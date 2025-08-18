import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a singleton Prisma client (lazy initialization)
let _prisma: PrismaClient | undefined;

export const getPrisma = () => {
  if (!_prisma) {
    _prisma = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _prisma;
    }
  }
  return _prisma;
};

// For backwards compatibility and direct access when needed
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    return getPrisma()[prop as keyof PrismaClient];
  }
});

// Utility functions for database operations
export class DatabaseService {
  
  /**
   * Generate a cryptographic signature for digital provenance
   */
  static generateSignature(data: any): string {
    // Handle null and undefined values
    const jsonString = data === undefined ? 'undefined' : JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Verify a card's ownership chain
   */
  static async verifyCardOwnership(cardInstanceId: string): Promise<boolean> {
    const prismaClient = getPrisma();
    const card = await prismaClient.cardInstance.findUnique({
      where: { id: cardInstanceId },
      include: {
        ownershipHistory: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!card) return false;

    // Verify the signature chain
    for (const history of card.ownershipHistory) {
      const expectedSignature = this.generateSignature({
        cardInstanceId: history.cardInstanceId,
        previousOwnerId: history.previousOwnerId,
        newOwnerId: history.newOwnerId,
        transferMethod: history.transferMethod,
        transferData: history.transferData
      });

      if (history.signature !== expectedSignature) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a new card instance with proper provenance
   */
  static async createCardInstance(data: {
    templateId: string;
    ownerId: string;
    uniqueStats?: any;
    acquiredMethod: string;
    acquisitionData?: any;
  }) {
    const prismaClient = getPrisma();
    const signatureData = {
      ...data,
      timestamp: Date.now(),
      mintingService: 'summoners-grid'
    };

    const signature = this.generateSignature(signatureData);

    const cardInstance = await prismaClient.cardInstance.create({
      data: {
        ...data,
        signature,
        signatureChain: [signature]
      }
    });

    // Create initial ownership history
    await prismaClient.ownershipHistory.create({
      data: {
        cardInstanceId: cardInstance.id,
        previousOwnerId: null,
        newOwnerId: data.ownerId,
        transferMethod: data.acquiredMethod,
        transferData: data.acquisitionData,
        signature: this.generateSignature({
          cardInstanceId: cardInstance.id,
          newOwnerId: data.ownerId,
          method: data.acquiredMethod,
          timestamp: Date.now()
        }),
        verified: true
      }
    });

    return cardInstance;
  }

  /**
   * Transfer card ownership with proper audit trail
   */
  static async transferCard(
    cardInstanceId: string,
    fromUserId: string,
    toUserId: string,
    transferMethod: string,
    transferData?: any
  ) {
    const prismaClient = getPrisma();
    
    // Verify current ownership
    const card = await prismaClient.cardInstance.findUnique({
      where: { id: cardInstanceId }
    });

    if (!card || card.ownerId !== fromUserId) {
      throw new Error('Invalid card ownership');
    }

    if (card.isLocked) {
      throw new Error('Card is locked and cannot be transferred');
    }

    // Create transfer signature
    const transferSignature = this.generateSignature({
      cardInstanceId,
      fromUserId,
      toUserId,
      transferMethod,
      transferData,
      timestamp: Date.now()
    });

    // Update card ownership
    const updatedCard = await prismaClient.cardInstance.update({
      where: { id: cardInstanceId },
      data: {
        ownerId: toUserId,
        lastTransferred: new Date(),
        signatureChain: {
          push: transferSignature
        }
      }
    });

    // Create ownership history record
    await prismaClient.ownershipHistory.create({
      data: {
        cardInstanceId,
        previousOwnerId: fromUserId,
        newOwnerId: toUserId,
        transferMethod,
        transferData,
        signature: transferSignature,
        verified: true
      }
    });

    return updatedCard;
  }

  /**
   * Get a user's card collection with filtering
   */
  static async getUserCards(
    userId: string,
    filters?: {
      type?: string;
      rarity?: string;
      attribute?: string;
      searchTerm?: string;
    }
  ) {
    const prismaClient = getPrisma();
    const where: any = { ownerId: userId };

    if (filters) {
      if (filters.type || filters.rarity || filters.attribute || filters.searchTerm) {
        where.template = {};
        
        if (filters.type) where.template.type = filters.type;
        if (filters.rarity) where.template.rarity = filters.rarity;
        if (filters.attribute) where.template.attribute = filters.attribute;
        if (filters.searchTerm) {
          where.template.name = {
            contains: filters.searchTerm,
            mode: 'insensitive'
          };
        }
      }
    }

    return prismaClient.cardInstance.findMany({
      where,
      include: {
        template: true,
        ownershipHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { template: { type: 'asc' } },
        { template: { name: 'asc' } }
      ]
    });
  }

  /**
   * Validate deck composition
   */
  static async validateDeck(deckData: {
    ownerId: string;
    summonSlots: any;
    mainDeck: string[];
    advanceDeck: string[];
    format: string;
  }) {
    const prismaClient = getPrisma();
    const errors: string[] = [];

    // Verify card ownership
    const allCardIds = [
      ...deckData.mainDeck,
      ...deckData.advanceDeck,
      ...(Array.isArray(deckData.summonSlots) 
        ? deckData.summonSlots.flatMap((slot: any) => [
            slot.summon,
            slot.equipment?.weapon,
            slot.equipment?.armor,
            slot.equipment?.accessory
          ]).filter(Boolean)
        : []
      )
    ];

    const ownedCards = await prismaClient.cardInstance.findMany({
      where: {
        id: { in: allCardIds },
        ownerId: deckData.ownerId
      }
    });

    if (ownedCards.length !== allCardIds.length) {
      errors.push('Deck contains cards not owned by player');
    }

    // Format-specific validation for 3v3
    if (deckData.format === '3v3') {
      if (!Array.isArray(deckData.summonSlots) || deckData.summonSlots.length !== 3) {
        errors.push('3v3 format requires exactly 3 summon slots');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Legacy export for backwards compatibility
export function database(): string {
  return 'database';
}
