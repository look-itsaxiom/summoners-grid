import { PrismaClient, CardType, Rarity, Attribute, Speed } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper function to generate cryptographic signature
function generateSignature(data: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

// Alpha Set card templates based on the Alpha Cards documentation
const alphaCardTemplates = [
  // Action Cards (10 cards)
  {
    id: '001',
    name: 'Blast Bolt',
    type: CardType.ACTION,
    rarity: Rarity.COMMON,
    attribute: Attribute.FIRE,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '001',
    requirements: { controlMagicianFamily: true },
    effects: { dealFireDamage: { targetType: 'opponent_summon', range: 'any' } },
    flavorText: 'A basic magical attack spell accessible to all magician-family roles'
  },
  {
    id: '005',
    name: 'Sharpened Blade',
    type: CardType.ACTION,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '005',
    requirements: { controlWarriorFamily: true },
    effects: { weaponBonus: { power: 5, duration: 'end_of_turn' } },
    flavorText: 'Temporary weapon enhancement for physical combat'
  },
  {
    id: '006',
    name: 'Healing Hands',
    type: CardType.ACTION,
    rarity: Rarity.COMMON,
    attribute: Attribute.LIGHT,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '006',
    requirements: { controlMagicianFamily: true },
    effects: { heal: { targetType: 'any_summon' } },
    flavorText: 'Basic healing spell that can target allies or enemies'
  },
  {
    id: '009',
    name: 'Rush',
    type: CardType.ACTION,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '009',
    requirements: { controlScoutFamily: true },
    effects: { grantActions: { extraMovement: 1, extraAttack: 1 } },
    flavorText: 'Provides additional combat actions for tactical positioning'
  },
  {
    id: '011',
    name: 'Ensnare',
    type: CardType.ACTION,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.NATURE,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '011',
    requirements: { controlScoutFamily: true },
    effects: { immobilize: { duration: 'next_turn' } },
    flavorText: 'Crowd control effect that immobilizes enemies'
  },
  {
    id: '012',
    name: 'Drain Touch',
    type: CardType.ACTION,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.DARK,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '012',
    requirements: { controlMagicianFamily: true },
    effects: { drainLife: { targetType: 'enemy_summon', healSelf: true } },
    flavorText: 'Life-steal spell that damages enemies while healing caster'
  },
  {
    id: '013',
    name: 'Adventurous Spirit',
    type: CardType.ACTION,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '013',
    requirements: { controlScoutFamily: true },
    effects: { deckSearch: { cardType: 'quest', addToHand: true } },
    flavorText: 'Deck searching ability for quest-based strategies'
  },
  {
    id: '015',
    name: 'Spell Recall',
    type: CardType.ACTION,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.NEUTRAL,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '015',
    requirements: { controlMagicianFamily: true },
    effects: { returnFromDiscard: { cardType: 'action', toHand: true } },
    flavorText: 'Spell recursion for repeated magical effects'
  },
  {
    id: '016',
    name: 'Life Alchemy',
    type: CardType.ACTION,
    rarity: Rarity.RARE,
    attribute: Attribute.LIGHT,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '016',
    requirements: { controlMagicianFamily: true },
    effects: { sacrifice: { healTarget: 'full' } },
    flavorText: 'Powerful healing at the cost of sacrificing an ally'
  },
  {
    id: '017',
    name: 'Dual Shot',
    type: CardType.ACTION,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.NEUTRAL,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '017',
    requirements: { controlScoutFamily: true, equippedBow: true },
    effects: { multipleAttacks: { count: 2, weapon: 'bow' } },
    flavorText: 'Enhanced archery allowing multiple shots per turn'
  },

  // Role Cards (13 cards) - Tier 1 Base Roles
  {
    id: '020',
    name: 'Warrior',
    type: CardType.SUMMON,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '020',
    tier: 1,
    family: 'warrior',
    stats: { strModifier: 1.25, endModifier: 1.25 },
    effects: { advancementPaths: ['berserker', 'knight'] },
    flavorText: 'Foundation warrior role focused on physical combat and durability'
  },
  {
    id: '021',
    name: 'Magician',
    type: CardType.SUMMON,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '021',
    tier: 1,
    family: 'magician',
    stats: { intModifier: 1.25, spiModifier: 1.25 },
    effects: { advancementPaths: ['element_mage', 'light_mage', 'dark_mage'] },
    flavorText: 'Foundation magical role with access to elemental and divine magic'
  },
  {
    id: '022',
    name: 'Scout',
    type: CardType.SUMMON,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '022',
    tier: 1,
    family: 'scout',
    stats: { spdModifier: 1.25, accModifier: 1.25 },
    effects: { advancementPaths: ['rogue', 'explorer'] },
    flavorText: 'Foundation agility role focused on speed and precision'
  },

  // Tier 2 Advanced Roles
  {
    id: '023',
    name: 'Berserker',
    type: CardType.ADVANCE,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '023',
    tier: 2,
    family: 'warrior',
    requirements: { fromRole: 'warrior' },
    stats: { strModifier: 1.5, spdModifier: 1.1, defModifier: 0.9 },
    effects: { advancementPaths: [] },
    flavorText: 'Aggressive warrior sacrificing defense for overwhelming offense'
  },
  {
    id: '024',
    name: 'Knight',
    type: CardType.ADVANCE,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '024',
    tier: 2,
    family: 'warrior',
    requirements: { fromRole: 'warrior' },
    stats: { strModifier: 1.3, defModifier: 1.3, endModifier: 1.2 },
    effects: { advancementPaths: ['paladin', 'sentinel'] },
    flavorText: 'Defensive warrior specialized in protection and armor'
  },

  // Weapons (3 cards)
  {
    id: '033',
    name: "Apprentice's Wand",
    type: CardType.WEAPON,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '033',
    equipment: {
      slot: 'weapon',
      power: 15,
      range: 2,
      damageStat: 'INT',
      bonuses: { INT: 2, SPI: 1 }
    },
    flavorText: 'Basic magical implement for beginning spellcasters'
  },
  {
    id: '034',
    name: 'Heirloom Sword',
    type: CardType.WEAPON,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '034',
    equipment: {
      slot: 'weapon',
      power: 30,
      range: 1,
      damageStat: 'STR',
      bonuses: { STR: 1, END: 1, DEF: 1, INT: 1, SPI: 1, MDF: 1, SPD: 1, ACC: 1 }
    },
    flavorText: 'Balanced weapon providing modest improvements across all attributes'
  },
  {
    id: '035',
    name: 'Hunting Bow',
    type: CardType.WEAPON,
    rarity: Rarity.COMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '035',
    equipment: {
      slot: 'weapon',
      power: 25,
      range: 3,
      damageStat: 'STR_ACC_HYBRID',
      bonuses: { ACC: 2, SPD: 1 }
    },
    flavorText: 'Ranged weapon favoring accuracy and speed over raw power'
  },

  // Building Cards (2 cards)
  {
    id: '004',
    name: 'Gignen Country',
    type: CardType.BUILDING,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.NEUTRAL,
    setCode: 'ALPHA',
    cardNumber: '004',
    effects: {
      dimensions: { width: 3, height: 2 },
      placement: 'your_territory',
      effect: 'gignen_summons_in_building_gain_extra_level_on_levelup'
    },
    flavorText: 'Species-specific territory that enhances Gignen growth rates'
  },
  {
    id: '010',
    name: 'Dark Altar',
    type: CardType.BUILDING,
    rarity: Rarity.RARE,
    attribute: Attribute.DARK,
    setCode: 'ALPHA',
    cardNumber: '010',
    effects: {
      dimensions: { width: 2, height: 2 },
      placement: 'your_territory',
      effect: 'sacrifice_building_and_occupants_next_turn_for_level_20_advancement'
    },
    flavorText: 'Sacrificial structure that enables rapid role advancement through dark rituals'
  },

  // Counter Cards (3 cards)
  {
    id: '003',
    name: 'Dramatic Return!',
    type: CardType.COUNTER,
    rarity: Rarity.LEGENDARY,
    attribute: Attribute.LIGHT,
    speed: Speed.COUNTER,
    setCode: 'ALPHA',
    cardNumber: '003',
    effects: {
      trigger: 'summon_defeated',
      effect: 'return_to_territory_with_10_percent_hp'
    },
    flavorText: 'Miraculous resurrection that brings back fallen allies at critical moments'
  },

  // Quest Cards (2 cards)
  {
    id: '002',
    name: 'Taste of Battle',
    type: CardType.QUEST,
    rarity: Rarity.UNCOMMON,
    attribute: Attribute.FIRE,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '002',
    effects: {
      objective: 'summon_under_level_10_deals_damage',
      failureCondition: 'summon_under_level_10_takes_damage',
      reward: 'target_gains_2_levels',
      failure: 'discard_pile'
    },
    flavorText: 'Risk/reward quest requiring aggressive play while protecting low-level summons'
  },
  {
    id: '037',
    name: 'Nearwood Forest Expedition',
    type: CardType.QUEST,
    rarity: Rarity.COMMON,
    attribute: Attribute.EARTH,
    speed: Speed.ACTION,
    setCode: 'ALPHA',
    cardNumber: '037',
    effects: {
      objective: 'control_warrior_scout_or_magician_under_level_10',
      failureCondition: 'none',
      reward: 'target_gains_2_levels'
    },
    flavorText: 'Safe exploration quest providing guaranteed progression for base role families'
  }
];

async function main() {
  console.log('🌱 Seeding database with Alpha Set cards and sample data...');

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.ownershipHistory.deleteMany();
  await prisma.cardInstance.deleteMany();
  await prisma.cardTemplate.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.tradeProposal.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  // Create card templates
  console.log('🃏 Creating Alpha Set card templates...');
  for (const template of alphaCardTemplates) {
    await prisma.cardTemplate.create({
      data: template
    });
  }

  // Create sample users
  console.log('👥 Creating sample users...');
  const sampleUsers = [
    {
      id: 'user-1',
      username: 'gignen_master',
      email: 'player1@summoners-grid.local',
      passwordHash: '$2b$10$dummy_hash_for_development', // This would be a real bcrypt hash
      displayName: 'Gignen Master',
      level: 5,
      experience: 1250,
      rating: 1150,
      peakRating: 1200,
      totalGames: 15,
      gamesWon: 9,
      emailVerified: true
    },
    {
      id: 'user-2',
      username: 'dark_mage_lord',
      email: 'player2@summoners-grid.local',
      passwordHash: '$2b$10$dummy_hash_for_development',
      displayName: 'Dark Mage Lord',
      level: 8,
      experience: 2100,
      rating: 1275,
      peakRating: 1300,
      totalGames: 22,
      gamesWon: 14,
      emailVerified: true
    },
    {
      id: 'user-3',
      username: 'scout_ranger',
      email: 'player3@summoners-grid.local',
      passwordHash: '$2b$10$dummy_hash_for_development',
      displayName: 'Scout Ranger',
      level: 3,
      experience: 500,
      rating: 1050,
      peakRating: 1080,
      totalGames: 8,
      gamesWon: 4,
      emailVerified: true
    }
  ];

  for (const user of sampleUsers) {
    await prisma.user.create({ data: user });
  }

  // Create sample card instances with digital provenance
  console.log('🎴 Creating sample card instances...');
  const cardInstances = [];
  
  // Give each user some cards from the Alpha set
  for (let userIndex = 0; userIndex < sampleUsers.length; userIndex++) {
    const userId = sampleUsers[userIndex].id;
    const userCards = alphaCardTemplates.slice(userIndex * 8, (userIndex + 1) * 8);
    
    for (const template of userCards) {
      const instanceData = {
        templateId: template.id,
        ownerId: userId,
        acquiredMethod: 'pack_opening',
        acquisitionData: {
          packType: 'alpha_starter',
          openedAt: new Date().toISOString(),
          packSerial: `PACK-${Math.random().toString(36).substr(2, 9)}`
        }
      };

      // Generate unique stats for summon cards
      let uniqueStats = null;
      if (template.type === CardType.SUMMON) {
        uniqueStats = {
          baseStats: {
            STR: Math.floor(Math.random() * 5) + 8, // 8-12 range
            END: Math.floor(Math.random() * 5) + 8,
            DEF: Math.floor(Math.random() * 5) + 8,
            INT: Math.floor(Math.random() * 5) + 8,
            SPI: Math.floor(Math.random() * 5) + 8,
            MDF: Math.floor(Math.random() * 5) + 8,
            SPD: Math.floor(Math.random() * 5) + 8,
            ACC: Math.floor(Math.random() * 5) + 8,
            LCK: Math.floor(Math.random() * 5) + 8
          },
          growthRates: {
            STR: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            END: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            DEF: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            INT: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            SPI: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            MDF: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            SPD: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            ACC: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)],
            LCK: ['--', '-', '_', '+', '++', '*'][Math.floor(Math.random() * 6)]
          },
          species: ['gignen', 'fae', 'stoneheart', 'wilderling'][Math.floor(Math.random() * 4)]
        };
      }

      // Generate cryptographic signature for digital provenance
      const signatureData = {
        ...instanceData,
        uniqueStats,
        timestamp: Date.now(),
        mintingService: 'summoners-grid-alpha'
      };
      const signature = generateSignature(signatureData);

      const cardInstance = await prisma.cardInstance.create({
        data: {
          ...instanceData,
          uniqueStats,
          signature,
          signatureChain: [signature]
        }
      });

      cardInstances.push(cardInstance);

      // Create initial ownership history
      await prisma.ownershipHistory.create({
        data: {
          cardInstanceId: cardInstance.id,
          previousOwnerId: null, // Initial minting
          newOwnerId: userId,
          transferMethod: 'pack_opening',
          transferData: instanceData.acquisitionData,
          signature: generateSignature({
            cardInstanceId: cardInstance.id,
            newOwnerId: userId,
            method: 'pack_opening',
            timestamp: Date.now()
          }),
          verified: true
        }
      });
    }
  }

  // Create sample decks
  console.log('🃏 Creating sample decks...');
  await prisma.deck.create({
    data: {
      ownerId: 'user-1',
      name: 'Gignen Country Build',
      description: 'Focused strategy around Gignen species with building synergy',
      format: '3v3',
      summonSlots: [
        {
          summon: cardInstances.find(c => c.ownerId === 'user-1' && c.templateId === '020')?.id, // Warrior
          role: '020', // Warrior
          equipment: {
            weapon: cardInstances.find(c => c.ownerId === 'user-1' && c.templateId === '034')?.id, // Heirloom Sword
            armor: null,
            accessory: null
          }
        }
      ],
      mainDeck: cardInstances
        .filter(c => c.ownerId === 'user-1' && ['001', '005', '006', '004', '037', '013'].includes(c.templateId))
        .map(c => c.id),
      advanceDeck: cardInstances
        .filter(c => c.ownerId === 'user-1' && ['023'].includes(c.templateId))
        .map(c => c.id),
      isValid: true,
      isPublic: true
    }
  });

  // Create sample game session
  console.log('🎮 Creating sample game session...');
  await prisma.gameSession.create({
    data: {
      gameId: 'game-alpha-001',
      gameMode: 'casual',
      format: '3v3',
      playerAId: 'user-1',
      playerBId: 'user-2',
      status: 'COMPLETED',
      winnerId: 'user-1',
      startTime: new Date(Date.now() - 1800000), // 30 minutes ago
      endTime: new Date(Date.now() - 600000),    // 10 minutes ago
      durationSeconds: 1200, // 20 minutes
      ratingChanges: {
        'user-1': { oldRating: 1130, newRating: 1150, change: 20 },
        'user-2': { oldRating: 1295, newRating: 1275, change: -20 }
      },
      gameData: {
        finalTurn: 15,
        victoryCondition: 'victory_points',
        finalVP: { 'user-1': 3, 'user-2': 1 }
      }
    }
  });

  // Create sample trade proposal
  console.log('💱 Creating sample trade proposal...');
  await prisma.tradeProposal.create({
    data: {
      proposerId: 'user-1',
      targetPlayerId: 'user-2',
      offeredCards: [cardInstances.find(c => c.ownerId === 'user-1' && c.templateId === '005')?.id].filter(Boolean),
      requestedCards: [cardInstances.find(c => c.ownerId === 'user-2' && c.templateId === '012')?.id].filter(Boolean),
      status: 'PENDING',
      message: 'Want to trade my Sharpened Blade for your Drain Touch?',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  });

  // Create friendship
  console.log('👫 Creating sample friendship...');
  await prisma.friendship.create({
    data: {
      userAId: 'user-1',
      userBId: 'user-3'
    }
  });

  // Create audit log entries
  console.log('📝 Creating audit log entries...');
  await prisma.auditLog.create({
    data: {
      userId: 'user-1',
      action: 'DECK_CREATED',
      entityType: 'deck',
      entityId: (await prisma.deck.findFirst({ where: { ownerId: 'user-1' } }))?.id,
      newData: { deckName: 'Gignen Country Build' },
      ipAddress: '127.0.0.1',
      userAgent: 'SummonersGrid/1.0'
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`
📊 Seeding Summary:
   • ${alphaCardTemplates.length} card templates created
   • ${sampleUsers.length} users created  
   • ${cardInstances.length} card instances created
   • 1 deck created
   • 1 game session created
   • 1 trade proposal created
   • 1 friendship created
   • Sample audit logs created
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });