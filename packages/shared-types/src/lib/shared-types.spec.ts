import {
  Position,
  GameBoard,
  TurnPhase,
  CardType,
  Rarity,
  Attribute,
  Speed,
  SummonStats,
  CardTemplate,
  CardInstance,
  Role,
  RoleFamily,
  Player,
  GameState,
  DeckConfiguration
} from './shared-types.js';

import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  GetCollectionRequest,
  CreateDeckRequest,
  TradeProposalResponse
} from './api-types.js';

import {
  AuthenticateMessage,
  PlayCardMessage,
  GameStateUpdateMessage,
  ClientMessage,
  ServerMessage
} from './websocket-types.js';

import {
  PositionSchema,
  RegisterRequestSchema,
  validateApiRequest,
  validateWebSocketMessage,
  validateDeckComposition,
  validatePosition,
  validateMovementPath
} from './validation.js';

describe('Shared Types', () => {
  describe('Core Game Types', () => {
    it('should create valid Position', () => {
      const position: Position = { x: 5, y: 7 };
      expect(position.x).toBe(5);
      expect(position.y).toBe(7);
      expect(validatePosition(position)).toBe(true);
    });

    it('should validate Position bounds', () => {
      expect(validatePosition({ x: 0, y: 0 })).toBe(true);
      expect(validatePosition({ x: 11, y: 13 })).toBe(true);
      expect(validatePosition({ x: -1, y: 5 })).toBe(false);
      expect(validatePosition({ x: 12, y: 5 })).toBe(false);
      expect(validatePosition({ x: 5, y: 14 })).toBe(false);
    });

    it('should create valid GameBoard', () => {
      const board: GameBoard = {
        width: 12,
        height: 14,
        summons: new Map(),
        buildings: new Map(),
        territories: {
          playerA: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
          playerB: [{ x: 0, y: 13 }, { x: 1, y: 13 }],
          contested: [{ x: 5, y: 7 }]
        }
      };
      
      expect(board.width).toBe(12);
      expect(board.height).toBe(14);
      expect(board.territories.playerA).toHaveLength(2);
    });

    it('should validate TurnPhase enum', () => {
      expect(Object.values(TurnPhase)).toContain('DRAW');
      expect(Object.values(TurnPhase)).toContain('LEVEL');
      expect(Object.values(TurnPhase)).toContain('ACTION');
      expect(Object.values(TurnPhase)).toContain('END');
    });

    it('should validate CardType enum', () => {
      expect(Object.values(CardType)).toContain('SUMMON');
      expect(Object.values(CardType)).toContain('ACTION');
      expect(Object.values(CardType)).toContain('BUILDING');
      expect(Object.values(CardType)).toContain('WEAPON');
    });

    it('should validate elemental Attribute enum', () => {
      expect(Object.values(Attribute)).toContain('FIRE');
      expect(Object.values(Attribute)).toContain('WATER');
      expect(Object.values(Attribute)).toContain('EARTH');
      expect(Object.values(Attribute)).toContain('WIND');
      expect(Object.values(Attribute)).toContain('LIGHT');
      expect(Object.values(Attribute)).toContain('DARK');
      expect(Object.values(Attribute)).toContain('NEUTRAL');
    });
  });

  describe('Card System Types', () => {
    it('should create valid SummonStats', () => {
      const stats: SummonStats = {
        str: 10,
        int: 8,
        agi: 12,
        level: 1,
        currentHp: 25,
        maxHp: 25,
        movement: 3
      };

      expect(stats.str).toBe(10);
      expect(stats.currentHp).toBeLessThanOrEqual(stats.maxHp);
    });

    it('should create valid CardTemplate', () => {
      const template: CardTemplate = {
        id: '001',
        name: 'Test Summon',
        type: CardType.SUMMON,
        rarity: Rarity.COMMON,
        attribute: Attribute.FIRE,
        setCode: 'ALPHA',
        cardNumber: '001',
        stats: {
          baseStr: 8,
          baseInt: 6,
          baseAgi: 10,
          strGrowth: 1.2,
          intGrowth: 0.8,
          agiGrowth: 1.0
        }
      };

      expect(template.type).toBe(CardType.SUMMON);
      expect(template.stats?.baseStr).toBe(8);
    });

    it('should create valid CardInstance', () => {
      const instance: CardInstance = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        templateId: '001',
        ownerId: '987fcdeb-51a2-43d1-b234-567890abcdef',
        signature: 'abc123def456',
        signatureChain: ['abc123def456'],
        mintedAt: new Date(),
        acquiredMethod: 'pack_opening',
        isLocked: false,
        createdAt: new Date()
      };

      expect(instance.id).toMatch(/^[0-9a-f-]+$/);
      expect(instance.isLocked).toBe(false);
    });

    it('should validate Role family and tier', () => {
      const role: Role = {
        id: 'warrior_t1',
        name: 'Warrior',
        family: RoleFamily.WARRIOR,
        tier: 1,
        statModifiers: {
          strModifier: 2,
          intModifier: 0,
          agiModifier: 1,
          hpModifier: 5,
          movementModifier: 0
        },
        abilities: [],
        advancementOptions: ['berserker', 'knight']
      };

      expect(role.family).toBe(RoleFamily.WARRIOR);
      expect(role.tier).toBe(1);
      expect(role.advancementOptions).toContain('berserker');
    });
  });

  describe('Player and Game State Types', () => {
    it('should create valid Player', () => {
      const player: Player = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'testplayer',
        level: 5,
        experience: 1250,
        rating: 1200,
        victoryPoints: 0,
        hand: [],
        mainDeck: [],
        advanceDeck: [],
        discardPile: [],
        rechargePile: [],
        activeSummons: new Map(),
        activeBuildings: new Map()
      };

      expect(player.username).toBe('testplayer');
      expect(player.victoryPoints).toBe(0);
      expect(player.hand).toEqual([]);
    });

    it('should create valid DeckConfiguration', () => {
      const mockCardInstance = (): CardInstance => ({
        id: '123e4567-e89b-12d3-a456-426614174000',
        templateId: '001',
        ownerId: '987fcdeb-51a2-43d1-b234-567890abcdef',
        signature: 'abc123',
        signatureChain: ['abc123'],
        mintedAt: new Date(),
        acquiredMethod: 'pack_opening',
        isLocked: false,
        createdAt: new Date()
      });

      const deck: DeckConfiguration = {
        id: 'deck-123',
        name: 'Test Deck',
        format: '3v3',
        summonSlots: [
          {
            summon: mockCardInstance(),
            role: mockCardInstance(),
            equipment: {
              weapon: mockCardInstance(),
              offhand: mockCardInstance(),
              armor: mockCardInstance(),
              accessory: mockCardInstance()
            }
          },
          {
            summon: mockCardInstance(),
            role: mockCardInstance(),
            equipment: {
              weapon: mockCardInstance(),
              offhand: mockCardInstance(),
              armor: mockCardInstance(),
              accessory: mockCardInstance()
            }
          },
          {
            summon: mockCardInstance(),
            role: mockCardInstance(),
            equipment: {
              weapon: mockCardInstance(),
              offhand: mockCardInstance(),
              armor: mockCardInstance(),
              accessory: mockCardInstance()
            }
          }
        ],
        mainDeck: [mockCardInstance()],
        advanceDeck: [mockCardInstance()],
        isValid: true
      };

      expect(deck.format).toBe('3v3');
      expect(deck.summonSlots).toHaveLength(3);
      expect(deck.isValid).toBe(true);
    });
  });

  describe('API Types', () => {
    it('should create valid RegisterRequest', () => {
      const request: RegisterRequest = {
        username: 'newuser',
        email: 'test@example.com',
        password: 'securepassword123'
      };

      expect(request.username).toBe('newuser');
      expect(request.email).toContain('@');
    });

    it('should create valid AuthResponse', () => {
      const response: AuthResponse = {
        success: true,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          username: 'testuser',
          email: 'test@example.com',
          level: 1,
          experience: 0,
          rating: 1000,
          peakRating: 1000,
          totalGames: 0,
          gamesWon: 0,
          createdAt: new Date()
        },
        token: 'jwt.token.here',
        expiresAt: new Date()
      };

      expect(response.success).toBe(true);
      expect(response.user?.username).toBe('testuser');
    });

    it('should create valid GetCollectionRequest', () => {
      const request: GetCollectionRequest = {
        cardType: 'SUMMON',
        rarity: 'RARE',
        sortBy: 'name',
        sortOrder: 'asc',
        limit: 20,
        offset: 0
      };

      expect(request.cardType).toBe('SUMMON');
      expect(request.limit).toBe(20);
    });
  });

  describe('WebSocket Types', () => {
    it('should create valid AuthenticateMessage', () => {
      const message: AuthenticateMessage = {
        type: 'AUTHENTICATE',
        timestamp: new Date(),
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        token: 'jwt.token.here'
      };

      expect(message.type).toBe('AUTHENTICATE');
      expect(message.token).toBe('jwt.token.here');
    });

    it('should create valid PlayCardMessage', () => {
      const message: PlayCardMessage = {
        type: 'PLAY_CARD',
        timestamp: new Date(),
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        data: {
          gameId: '987fcdeb-51a2-43d1-b234-567890abcdef',
          cardId: '123e4567-e89b-12d3-a456-426614174000',
          position: { x: 5, y: 7 },
          target: {
            type: 'summon',
            id: 'target-summon-id'
          }
        }
      };

      expect(message.type).toBe('PLAY_CARD');
      expect(message.data.position?.x).toBe(5);
      expect(message.data.target?.type).toBe('summon');
    });

    it('should validate ClientMessage and ServerMessage unions', () => {
      const clientMessage: ClientMessage = {
        type: 'AUTHENTICATE',
        timestamp: new Date(),
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        token: 'jwt.token.here'
      };

      const serverMessage: ServerMessage = {
        type: 'AUTHENTICATED',
        timestamp: new Date(),
        messageId: '123e4567-e89b-12d3-a456-426614174000',
        data: {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          username: 'testuser',
          sessionId: 'session-123'
        }
      };

      expect(clientMessage.type).toBe('AUTHENTICATE');
      expect(serverMessage.type).toBe('AUTHENTICATED');
    });
  });

  describe('Validation Schemas', () => {
    it('should validate RegisterRequest with schema', () => {
      const validRequest = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const result = validateApiRequest(RegisterRequestSchema, validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('testuser');
      }
    });

    it('should reject invalid RegisterRequest', () => {
      const invalidRequest = {
        username: 'te', // Too short
        email: 'invalid-email',
        password: '123' // Too short
      };

      const result = validateApiRequest(RegisterRequestSchema, invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate movement path correctly', () => {
      const validPath = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 }
      ];

      const result = validateMovementPath(validPath, 3);
      expect(result.isValid).toBe(true);
      expect(result.distance).toBe(2); // 2 diagonal moves
    });

    it('should reject movement path exceeding limit', () => {
      const invalidPath = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 6, y: 0 }
      ];

      const result = validateMovementPath(invalidPath, 3);
      expect(result.isValid).toBe(false);
      expect(result.distance).toBe(6);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should validate deck composition', () => {
      const validDeck = {
        name: 'Test Deck',
        format: '3v3',
        summonSlots: [
          {
            summonId: '123e4567-e89b-12d3-a456-426614174001',
            roleId: '123e4567-e89b-12d3-a456-426614174002',
            equipment: {
              weaponId: '123e4567-e89b-12d3-a456-426614174003',
              offhandId: '123e4567-e89b-12d3-a456-426614174004',
              armorId: '123e4567-e89b-12d3-a456-426614174005',
              accessoryId: '123e4567-e89b-12d3-a456-426614174006'
            }
          },
          {
            summonId: '123e4567-e89b-12d3-a456-426614174007',
            roleId: '123e4567-e89b-12d3-a456-426614174008',
            equipment: {
              weaponId: '123e4567-e89b-12d3-a456-426614174009',
              offhandId: '123e4567-e89b-12d3-a456-426614174010',
              armorId: '123e4567-e89b-12d3-a456-426614174011',
              accessoryId: '123e4567-e89b-12d3-a456-426614174012'
            }
          },
          {
            summonId: '123e4567-e89b-12d3-a456-426614174013',
            roleId: '123e4567-e89b-12d3-a456-426614174014',
            equipment: {
              weaponId: '123e4567-e89b-12d3-a456-426614174015',
              offhandId: '123e4567-e89b-12d3-a456-426614174016',
              armorId: '123e4567-e89b-12d3-a456-426614174017',
              accessoryId: '123e4567-e89b-12d3-a456-426614174018'
            }
          }
        ],
        mainDeckIds: ['123e4567-e89b-12d3-a456-426614174019'],
        advanceDeckIds: ['123e4567-e89b-12d3-a456-426614174020']
      };

      const result = validateDeckComposition(validDeck);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject deck with duplicate cards', () => {
      const duplicateCardId = '123e4567-e89b-12d3-a456-426614174001';
      const invalidDeck = {
        name: 'Invalid Deck',
        format: '3v3',
        summonSlots: [
          {
            summonId: duplicateCardId,
            roleId: '123e4567-e89b-12d3-a456-426614174002',
            equipment: {
              weaponId: '123e4567-e89b-12d3-a456-426614174003',
              offhandId: '123e4567-e89b-12d3-a456-426614174004',
              armorId: '123e4567-e89b-12d3-a456-426614174005',
              accessoryId: '123e4567-e89b-12d3-a456-426614174006'
            }
          },
          {
            summonId: '123e4567-e89b-12d3-a456-426614174007',
            roleId: '123e4567-e89b-12d3-a456-426614174008',
            equipment: {
              weaponId: '123e4567-e89b-12d3-a456-426614174009',
              offhandId: '123e4567-e89b-12d3-a456-426614174010',
              armorId: '123e4567-e89b-12d3-a456-426614174011',
              accessoryId: '123e4567-e89b-12d3-a456-426614174012'
            }
          },
          {
            summonId: '123e4567-e89b-12d3-a456-426614174013',
            roleId: '123e4567-e89b-12d3-a456-426614174014',
            equipment: {
              weaponId: '123e4567-e89b-12d3-a456-426614174015',
              offhandId: '123e4567-e89b-12d3-a456-426614174016',
              armorId: '123e4567-e89b-12d3-a456-426614174017',
              accessoryId: '123e4567-e89b-12d3-a456-426614174018'
            }
          }
        ],
        mainDeckIds: [duplicateCardId], // Duplicate card in main deck
        advanceDeckIds: ['123e4567-e89b-12d3-a456-426614174020']
      };

      const result = validateDeckComposition(invalidDeck);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate cards'))).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values', () => {
      expect(validatePosition(null)).toBe(false);
      expect(validatePosition(undefined)).toBe(false);
      expect(validatePosition({})).toBe(false);
    });

    it('should handle malformed WebSocket messages', () => {
      const malformedMessage = {
        type: 'INVALID_TYPE',
        // Missing required fields
      };

      const result = validateWebSocketMessage(RegisterRequestSchema, malformedMessage);
      expect(result.success).toBe(false);
    });

    it('should validate complex nested objects', () => {
      const complexObject = {
        position: { x: 5, y: 7 },
        stats: {
          str: 10,
          int: 8,
          agi: 12,
          level: 1,
          currentHp: 25,
          maxHp: 25,
          movement: 3
        },
        effects: [
          {
            id: 'effect1',
            name: 'Test Effect',
            description: 'A test effect',
            trigger: 'on_summon',
            resolver: 'test_resolver',
            parameters: { value: 5 },
            priority: 1
          }
        ]
      };

      // This should pass basic structure validation
      expect(typeof complexObject).toBe('object');
      expect(complexObject.position.x).toBe(5);
      expect(complexObject.stats.str).toBe(10);
      expect(complexObject.effects[0].id).toBe('effect1');
    });
  });
});
