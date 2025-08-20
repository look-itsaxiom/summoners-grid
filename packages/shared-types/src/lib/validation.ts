// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

import { z } from 'zod';

// ============================================================================
// CORE GAME VALIDATION SCHEMAS
// ============================================================================

/**
 * Position validation (12x14 grid)
 */
export const PositionSchema = z.object({
  x: z.number().int().min(0).max(11),
  y: z.number().int().min(0).max(13)
});

/**
 * Game board validation
 */
export const GameBoardSchema = z.object({
  width: z.literal(12),
  height: z.literal(14),
  summons: z.map(z.string(), PositionSchema),
  buildings: z.map(z.string(), PositionSchema),
  territories: z.object({
    playerA: z.array(PositionSchema),
    playerB: z.array(PositionSchema),
    contested: z.array(PositionSchema)
  })
});

/**
 * Turn phase validation
 */
export const TurnPhaseSchema = z.enum(['DRAW', 'LEVEL', 'ACTION', 'END']);

/**
 * Card type validation
 */
export const CardTypeSchema = z.enum([
  'SUMMON', 'ROLE', 'ACTION', 'BUILDING', 'WEAPON', 
  'ARMOR', 'ACCESSORY', 'ADVANCE', 'COUNTER', 'QUEST', 'UNIQUE'
]);

/**
 * Rarity validation
 */
export const RaritySchema = z.enum([
  'COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTH', 'SPECIAL'
]);

/**
 * Attribute validation
 */
export const AttributeSchema = z.enum([
  'NEUTRAL', 'FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHT', 'DARK', 'NATURE'
]);

/**
 * Speed validation
 */
export const SpeedSchema = z.enum(['COUNTER', 'REACTION', 'ACTION']);

/**
 * Summon stats validation
 */
export const SummonStatsSchema = z.object({
  str: z.number().int().min(0),
  int: z.number().int().min(0),
  agi: z.number().int().min(0),
  level: z.number().int().min(1),
  currentHp: z.number().int().min(0),
  maxHp: z.number().int().min(1),
  movement: z.number().int().min(0)
});

/**
 * Card requirements validation
 */
export const CardRequirementsSchema = z.object({
  minLevel: z.number().int().min(1).optional(),
  requiredRoles: z.array(z.string()).optional(),
  boardConditions: z.array(z.string()).optional(),
  costs: z.array(z.object({
    type: z.string(),
    amount: z.number().int().min(0)
  })).optional()
});

/**
 * Card effect validation
 */
export const CardEffectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  trigger: z.string().min(1),
  requirements: CardRequirementsSchema.optional(),
  resolver: z.string().min(1),
  parameters: z.record(z.string(), z.any()),
  priority: z.number().int()
});

/**
 * Card template validation
 */
export const CardTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: CardTypeSchema,
  rarity: RaritySchema,
  attribute: AttributeSchema,
  speed: SpeedSchema.optional(),
  requirements: CardRequirementsSchema.optional(),
  effects: z.array(CardEffectSchema).optional(),
  stats: z.object({
    baseStr: z.number().int().min(0),
    baseInt: z.number().int().min(0),
    baseAgi: z.number().int().min(0),
    strGrowth: z.number().min(0),
    intGrowth: z.number().min(0),
    agiGrowth: z.number().min(0)
  }).optional(),
  equipment: z.object({
    strBonus: z.number().int().optional(),
    intBonus: z.number().int().optional(),
    agiBonus: z.number().int().optional(),
    specialEffects: z.array(CardEffectSchema).optional()
  }).optional(),
  tier: z.number().int().min(1).max(3).optional(),
  family: z.enum(['warrior', 'magician', 'scout']).optional(),
  setCode: z.string().min(1),
  cardNumber: z.string().min(1),
  flavorText: z.string().optional(),
  imageUrl: z.string().url().optional()
});

/**
 * Card instance validation
 */
export const CardInstanceSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().min(1),
  ownerId: z.string().uuid(),
  uniqueStats: SummonStatsSchema.partial().optional(),
  uniqueProperties: z.record(z.string(), z.any()).optional(),
  signature: z.string().min(1),
  signatureChain: z.array(z.string()),
  mintedAt: z.date(),
  acquiredMethod: z.string().min(1),
  acquisitionData: z.record(z.string(), z.any()).optional(),
  lastTransferred: z.date().optional(),
  isLocked: z.boolean(),
  createdAt: z.date()
});

// ============================================================================
// API VALIDATION SCHEMAS
// ============================================================================

/**
 * Registration request validation
 */
export const RegisterRequestSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50).optional()
});

/**
 * Login request validation
 */
export const LoginRequestSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8).max(128)
});

/**
 * Token refresh request validation
 */
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1)
});

/**
 * Profile update request validation
 */
export const UpdateProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional()
});

/**
 * User search request validation
 */
export const UserSearchRequestSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

/**
 * Get collection request validation
 */
export const GetCollectionRequestSchema = z.object({
  ownerId: z.string().uuid().optional(),
  cardType: CardTypeSchema.optional(),
  rarity: RaritySchema.optional(),
  attribute: AttributeSchema.optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'rarity', 'type', 'acquired']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional()
});

/**
 * Pack opening request validation
 */
export const OpenPackRequestSchema = z.object({
  packType: z.string().min(1),
  quantity: z.number().int().min(1).max(10)
});

/**
 * Create deck request validation
 */
export const CreateDeckRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  format: z.literal('3v3'),
  summonSlots: z.array(z.object({
    summonId: z.string().uuid(),
    roleId: z.string().uuid(),
    equipment: z.object({
      weaponId: z.string().uuid(),
      offhandId: z.string().uuid(),
      armorId: z.string().uuid(),
      accessoryId: z.string().uuid()
    })
  })).length(3),
  mainDeckIds: z.array(z.string().uuid()),
  advanceDeckIds: z.array(z.string().uuid())
});

/**
 * Update deck request validation
 */
export const UpdateDeckRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  summonSlots: z.array(z.object({
    summonId: z.string().uuid(),
    roleId: z.string().uuid(),
    equipment: z.object({
      weaponId: z.string().uuid(),
      offhandId: z.string().uuid(),
      armorId: z.string().uuid(),
      accessoryId: z.string().uuid()
    })
  })).length(3).optional(),
  mainDeckIds: z.array(z.string().uuid()).optional(),
  advanceDeckIds: z.array(z.string().uuid()).optional(),
  isPublic: z.boolean().optional()
});

/**
 * Create trade request validation
 */
export const CreateTradeRequestSchema = z.object({
  targetPlayerId: z.string().uuid(),
  offeredCardIds: z.array(z.string().uuid()).min(1),
  requestedCardIds: z.array(z.string().uuid()).min(1),
  message: z.string().max(500).optional(),
  expiresIn: z.number().int().min(1).max(168).optional() // Max 7 days
});

/**
 * Trade action request validation
 */
export const TradeActionRequestSchema = z.object({
  tradeId: z.string().uuid(),
  action: z.enum(['ACCEPT', 'DECLINE', 'CANCEL']),
  message: z.string().max(500).optional()
});

/**
 * Friend request validation
 */
export const SendFriendRequestRequestSchema = z.object({
  targetUserId: z.string().uuid(),
  message: z.string().max(200).optional()
});

/**
 * Friend request response validation
 */
export const RespondToFriendRequestRequestSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['ACCEPT', 'DECLINE'])
});

/**
 * Join queue request validation
 */
export const JoinQueueRequestSchema = z.object({
  gameMode: z.enum(['RANKED', 'CASUAL', 'PRIVATE']),
  format: z.literal('3v3'),
  deckId: z.string().uuid()
});

/**
 * Create game invite request validation
 */
export const CreateGameInviteRequestSchema = z.object({
  targetPlayerId: z.string().uuid(),
  gameMode: z.enum(['CASUAL', 'PRIVATE']),
  format: z.literal('3v3'),
  deckId: z.string().uuid(),
  message: z.string().max(200).optional()
});

// ============================================================================
// WEBSOCKET MESSAGE VALIDATION SCHEMAS
// ============================================================================

/**
 * Base WebSocket message validation
 */
export const BaseWebSocketMessageSchema = z.object({
  type: z.string().min(1),
  timestamp: z.date(),
  messageId: z.string().uuid()
});

/**
 * Combat target validation
 */
export const CombatTargetSchema = z.object({
  type: z.enum(['summon', 'building', 'position', 'player']),
  id: z.string().uuid().optional(),
  position: PositionSchema.optional()
});

/**
 * Authenticate message validation
 */
export const AuthenticateMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('AUTHENTICATE'),
  token: z.string().min(1)
});

/**
 * Join queue message validation
 */
export const JoinQueueMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('JOIN_QUEUE'),
  data: z.object({
    gameMode: z.enum(['RANKED', 'CASUAL', 'PRIVATE']),
    format: z.literal('3v3'),
    deckId: z.string().uuid()
  })
});

/**
 * Accept match message validation
 */
export const AcceptMatchMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('ACCEPT_MATCH'),
  data: z.object({
    gameId: z.string().uuid(),
    accepted: z.boolean()
  })
});

/**
 * Player ready message validation
 */
export const PlayerReadyMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('PLAYER_READY'),
  data: z.object({
    gameId: z.string().uuid(),
    ready: z.boolean()
  })
});

/**
 * Play card message validation
 */
export const PlayCardMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('PLAY_CARD'),
  data: z.object({
    gameId: z.string().uuid(),
    cardId: z.string().uuid(),
    position: PositionSchema.optional(),
    target: CombatTargetSchema.optional(),
    additionalChoices: z.record(z.string(), z.any()).optional()
  })
});

/**
 * Move summon message validation
 */
export const MoveSummonMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('MOVE_SUMMON'),
  data: z.object({
    gameId: z.string().uuid(),
    summonId: z.string().uuid(),
    fromPosition: PositionSchema,
    toPosition: PositionSchema,
    movementPath: z.array(PositionSchema).optional()
  })
});

/**
 * Attack message validation
 */
export const AttackMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('ATTACK'),
  data: z.object({
    gameId: z.string().uuid(),
    attackerId: z.string().uuid(),
    target: CombatTargetSchema,
    attackType: z.enum(['BASIC', 'ABILITY']),
    abilityId: z.string().uuid().optional()
  })
});

/**
 * Use ability message validation
 */
export const UseAbilityMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('USE_ABILITY'),
  data: z.object({
    gameId: z.string().uuid(),
    sourceId: z.string().uuid(),
    abilityId: z.string().uuid(),
    target: CombatTargetSchema.optional(),
    additionalChoices: z.record(z.string(), z.any()).optional()
  })
});

/**
 * Advance role message validation
 */
export const AdvanceRoleMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('ADVANCE_ROLE'),
  data: z.object({
    gameId: z.string().uuid(),
    summonId: z.string().uuid(),
    advanceCardId: z.string().uuid(),
    newRoleId: z.string().uuid()
  })
});

/**
 * End phase message validation
 */
export const EndPhaseMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('END_PHASE'),
  data: z.object({
    gameId: z.string().uuid(),
    phase: z.string().min(1)
  })
});

/**
 * Effect choice message validation
 */
export const EffectChoiceMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('EFFECT_CHOICE'),
  data: z.object({
    gameId: z.string().uuid(),
    effectId: z.string().uuid(),
    choiceId: z.string().min(1),
    additionalData: z.record(z.string(), z.any()).optional()
  })
});

/**
 * Send chat message validation
 */
export const SendChatMessageSchema = BaseWebSocketMessageSchema.extend({
  type: z.literal('SEND_CHAT'),
  data: z.object({
    gameId: z.string().uuid().optional(),
    message: z.string().min(1).max(500),
    recipientId: z.string().uuid().optional()
  })
});

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate API request body
 */
export function validateApiRequest<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T; 
} | { 
  success: false; 
  errors: string[]; 
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = (error as any).issues?.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ) || ['Validation failed'];
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid data format'] };
  }
}

/**
 * Validate WebSocket message
 */
export function validateWebSocketMessage<T>(
  schema: z.ZodSchema<T>, 
  message: unknown
): { 
  success: true; 
  message: T; 
} | { 
  success: false; 
  error: string; 
} {
  try {
    const result = schema.parse(message);
    return { success: true, message: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = ((error as any).issues || [])
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join(', ') || 'Validation failed';
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Invalid message format' };
  }
}

/**
 * Validate deck composition for 3v3 format
 */
export function validateDeckComposition(deck: unknown): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const validationResult = CreateDeckRequestSchema.parse(deck);
    
    // Additional deck validation logic
    if (validationResult.summonSlots.length !== 3) {
      errors.push('Deck must have exactly 3 summon slots for 3v3 format');
    }
    
    if (validationResult.mainDeckIds.length === 0) {
      errors.push('Main deck cannot be empty');
    }
    
    if (validationResult.mainDeckIds.length > 60) {
      warnings.push('Main deck has more than 60 cards, which may be difficult to manage');
    }
    
    // Check for duplicate cards (not allowed in most formats)
    const allCardIds = [
      ...validationResult.summonSlots.map(slot => slot.summonId),
      ...validationResult.summonSlots.map(slot => slot.roleId),
      ...validationResult.summonSlots.flatMap(slot => Object.values(slot.equipment)),
      ...validationResult.mainDeckIds,
      ...validationResult.advanceDeckIds
    ];
    
    const duplicates = allCardIds.filter((id, index) => allCardIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate cards found: ${[...new Set(duplicates)].join(', ')}`);
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = (error as any).issues || [];
      errors.push(...issues.map((err: any) => `${err.path.join('.')}: ${err.message}`));
    } else {
      errors.push('Invalid deck format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate position is within game board bounds
 */
export function validatePosition(position: unknown): position is { x: number; y: number } {
  try {
    PositionSchema.parse(position);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate movement path doesn't exceed movement speed
 */
export function validateMovementPath(
  path: { x: number; y: number }[], 
  maxMovement: number
): { isValid: boolean; distance: number; error?: string } {
  if (path.length < 2) {
    return { isValid: false, distance: 0, error: 'Movement path must have at least 2 positions' };
  }
  
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    
    // Allow diagonal movement with same cost as orthogonal
    const distance = Math.max(Math.abs(curr.x - prev.x), Math.abs(curr.y - prev.y));
    totalDistance += distance;
  }
  
  return {
    isValid: totalDistance <= maxMovement,
    distance: totalDistance,
    error: totalDistance > maxMovement ? `Movement distance ${totalDistance} exceeds maximum ${maxMovement}` : undefined
  };
}