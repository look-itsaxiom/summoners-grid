// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

import { CardInstance, DeckConfiguration } from './shared-types.js';

// ============================================================================
// AUTHENTICATION API TYPES
// ============================================================================

/**
 * User registration request
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

/**
 * User login request
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    level: number;
    experience: number;
    rating: number;
    peakRating: number;
    totalGames: number;
    gamesWon: number;
    createdAt: Date;
    lastLogin?: Date;
  };
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
  error?: string;
}

// ============================================================================
// USER MANAGEMENT API TYPES
// ============================================================================

/**
 * User profile update request
 */
export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
}

/**
 * User statistics response
 */
export interface UserStatsResponse {
  level: number;
  experience: number;
  rating: number;
  peakRating: number;
  totalGames: number;
  gamesWon: number;
  winRate: number;
  recentGames: {
    id: string;
    opponent: string;
    result: 'WIN' | 'LOSS' | 'DRAW';
    ratingChange: number;
    duration: number;
    createdAt: Date;
  }[];
}

/**
 * User search request
 */
export interface UserSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
}

/**
 * User search response
 */
export interface UserSearchResponse {
  users: {
    id: string;
    username: string;
    displayName?: string;
    level: number;
    rating: number;
    isOnline: boolean;
  }[];
  total: number;
}

// ============================================================================
// CARD COLLECTION API TYPES
// ============================================================================

/**
 * Card collection request with filters
 */
export interface GetCollectionRequest {
  ownerId?: string;
  cardType?: string;
  rarity?: string;
  attribute?: string;
  search?: string;
  sortBy?: 'name' | 'rarity' | 'type' | 'acquired';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Card collection response
 */
export interface GetCollectionResponse {
  cards: (CardInstance & {
    template: {
      name: string;
      type: string;
      rarity: string;
      attribute: string;
      imageUrl?: string;
    };
  })[];
  total: number;
  filters: {
    types: string[];
    rarities: string[];
    attributes: string[];
  };
}

/**
 * Pack opening request
 */
export interface OpenPackRequest {
  packType: string;
  quantity: number;
}

/**
 * Pack opening response
 */
export interface OpenPackResponse {
  success: boolean;
  cards?: CardInstance[];
  error?: string;
}

// ============================================================================
// DECK MANAGEMENT API TYPES
// ============================================================================

/**
 * Get user decks request
 */
export interface GetDecksRequest {
  ownerId?: string;
  format?: string;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Get user decks response
 */
export interface GetDecksResponse {
  decks: {
    id: string;
    name: string;
    description?: string;
    format: string;
    isValid: boolean;
    gamesPlayed: number;
    gamesWon: number;
    winRate: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  total: number;
}

/**
 * Get deck details response
 */
export interface GetDeckDetailsResponse {
  deck: DeckConfiguration;
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Create deck request
 */
export interface CreateDeckRequest {
  name: string;
  description?: string;
  format: '3v3';
  summonSlots: {
    summonId: string;
    roleId: string;
    equipment: {
      weaponId: string;
      offhandId: string;
      armorId: string;
      accessoryId: string;
    };
  }[];
  mainDeckIds: string[];
  advanceDeckIds: string[];
}

/**
 * Update deck request
 */
export interface UpdateDeckRequest {
  name?: string;
  description?: string;
  summonSlots?: {
    summonId: string;
    roleId: string;
    equipment: {
      weaponId: string;
      offhandId: string;
      armorId: string;
      accessoryId: string;
    };
  }[];
  mainDeckIds?: string[];
  advanceDeckIds?: string[];
  isPublic?: boolean;
}

/**
 * Deck validation response
 */
export interface ValidateDeckResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalCards: number;
    cardTypes: Record<string, number>;
    rarityDistribution: Record<string, number>;
    attributeDistribution: Record<string, number>;
  };
}

// ============================================================================
// TRADING SYSTEM API TYPES
// ============================================================================

/**
 * Trade proposal creation request
 */
export interface CreateTradeRequest {
  targetPlayerId: string;
  offeredCardIds: string[];
  requestedCardIds: string[];
  message?: string;
  expiresIn?: number; // Hours until expiration
}

/**
 * Trade proposal response
 */
export interface TradeProposalResponse {
  id: string;
  proposerId: string;
  targetPlayerId: string;
  offeredCards: CardInstance[];
  requestedCards: CardInstance[];
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  message?: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Get trades request
 */
export interface GetTradesRequest {
  userId: string;
  status?: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  type?: 'SENT' | 'RECEIVED';
  limit?: number;
  offset?: number;
}

/**
 * Get trades response
 */
export interface GetTradesResponse {
  trades: TradeProposalResponse[];
  total: number;
}

/**
 * Trade action request
 */
export interface TradeActionRequest {
  tradeId: string;
  action: 'ACCEPT' | 'DECLINE' | 'CANCEL';
  message?: string;
}

// ============================================================================
// FRIEND SYSTEM API TYPES
// ============================================================================

/**
 * Send friend request
 */
export interface SendFriendRequestRequest {
  targetUserId: string;
  message?: string;
}

/**
 * Friend request response
 */
export interface FriendRequestResponse {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterUsername: string;
  receiverUsername: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
}

/**
 * Get friend requests
 */
export interface GetFriendRequestsResponse {
  sent: FriendRequestResponse[];
  received: FriendRequestResponse[];
}

/**
 * Respond to friend request
 */
export interface RespondToFriendRequestRequest {
  requestId: string;
  action: 'ACCEPT' | 'DECLINE';
}

/**
 * Get friends list response
 */
export interface GetFriendsResponse {
  friends: {
    id: string;
    username: string;
    displayName?: string;
    level: number;
    rating: number;
    isOnline: boolean;
    lastSeen?: Date;
    friendsSince: Date;
  }[];
}

// ============================================================================
// MATCHMAKING API TYPES
// ============================================================================

/**
 * Join matchmaking queue request
 */
export interface JoinQueueRequest {
  gameMode: 'RANKED' | 'CASUAL' | 'PRIVATE';
  format: '3v3';
  deckId: string;
}

/**
 * Matchmaking status response
 */
export interface MatchmakingStatusResponse {
  inQueue: boolean;
  queueTime?: number;
  estimatedWaitTime?: number;
  gameMode?: string;
  format?: string;
}

/**
 * Game invitation request
 */
export interface CreateGameInviteRequest {
  targetPlayerId: string;
  gameMode: 'CASUAL' | 'PRIVATE';
  format: '3v3';
  deckId: string;
  message?: string;
}

/**
 * Game invitation response
 */
export interface GameInviteResponse {
  id: string;
  inviterId: string;
  targetPlayerId: string;
  inviterUsername: string;
  targetUsername: string;
  gameMode: string;
  format: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// COMMON API RESPONSE TYPES
// ============================================================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Generic API response type
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}