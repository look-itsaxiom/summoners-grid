# Summoner's Grid - Backend API Implementation Plan

## Overview

The Backend API layer handles the logistical aspects of the game including user management, card collection and ownership, digital provenance, authentication, trading systems, and persistent data management. This layer provides the foundation for player accounts, card economies, and long-term progression systems.

## API Architecture Principles

### Core Responsibilities
- **User Management**: Account creation, authentication, profile management
- **Card Ownership**: Digital provenance system with cryptographic verification
- **Trading System**: Secure player-to-player card trading with verification
- **Collection Management**: Card pack opening, inventory, deck management
- **Game Results**: Match history, statistics, rating updates
- **Economy**: In-game currency, shop system, reward distribution

### Design Goals
- **Secure**: Cryptographic verification for all card ownership and trades
- **Scalable**: Horizontal scaling for growing player base
- **Reliable**: High availability with data consistency guarantees
- **Fast**: Sub-200ms response times for common operations
- **Auditable**: Complete transaction history and audit trails

## Technology Stack

### Core Technologies
- **Node.js 18+**: Server runtime with TypeScript
- **Express.js**: Web framework with middleware ecosystem
- **TypeScript**: Type safety and shared code with other layers
- **Prisma**: Type-safe ORM with excellent TypeScript integration

### Supporting Libraries
- **Zod**: Request/response validation and schema definition
- **JWT**: Authentication with refresh token rotation
- **bcrypt**: Password hashing with salt rounds
- **crypto**: Native cryptographic functions for card signatures
- **Winston**: Structured logging with multiple outputs

### Security and Validation
- **helmet**: Security headers and protection middleware
- **express-rate-limit**: API rate limiting and abuse prevention
- **joi or zod**: Input validation and sanitization
- **express-validator**: Additional validation middleware

### Database and Caching
- **PostgreSQL 15+**: Primary database for relational data
- **Redis 7+**: Caching and session management
- **Prisma**: Database ORM with migrations
- **Connection pooling**: pgbouncer or built-in pooling

## API Architecture

```
src/
├── api/
│   ├── routes/
│   │   ├── auth.ts            # Authentication endpoints
│   │   ├── users.ts           # User management
│   │   ├── cards.ts           # Card operations
│   │   ├── trading.ts         # Trading system
│   │   ├── decks.ts           # Deck management
│   │   ├── games.ts           # Game results and history
│   │   └── admin.ts           # Administrative endpoints
│   ├── middleware/
│   │   ├── auth.ts            # JWT validation
│   │   ├── validation.ts      # Request validation
│   │   ├── rateLimit.ts       # Rate limiting
│   │   └── security.ts        # Security headers
│   └── controllers/
│       ├── AuthController.ts
│       ├── UserController.ts
│       ├── CardController.ts
│       ├── TradingController.ts
│       └── GameController.ts
├── services/
│   ├── AuthService.ts         # Authentication logic
│   ├── UserService.ts         # User management
│   ├── CardService.ts         # Card operations
│   ├── TradingService.ts      # Trading system
│   ├── ProvenanceService.ts   # Digital provenance
│   └── NotificationService.ts # User notifications
├── models/
│   ├── User.ts                # User data models
│   ├── Card.ts                # Card ownership models
│   ├── Trade.ts               # Trading models
│   └── Game.ts                # Game result models
├── utils/
│   ├── crypto.ts              # Cryptographic utilities
│   ├── validation.ts          # Validation helpers
│   ├── pagination.ts          # Pagination utilities
│   └── responses.ts           # Standardized API responses
└── database/
    ├── schema.prisma          # Database schema
    ├── migrations/            # Database migrations
    └── seeders/               # Development data
```

## Core API Services

### 1. Authentication Service

**Purpose**: Secure user authentication with JWT tokens and session management.

**Key Features**:
- User registration with email verification
- Secure login with password hashing
- JWT access/refresh token system
- Multi-factor authentication support
- Session management and logout

**Implementation Approach**:
```typescript
// Example service structure (no implementation)
interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  public async register(credentials: AuthCredentials): Promise<User>;
  public async login(credentials: AuthCredentials): Promise<AuthTokens>;
  public async refreshToken(refreshToken: string): Promise<AuthTokens>;
  public async logout(refreshToken: string): Promise<void>;
  public async validateToken(accessToken: string): Promise<User>;
  
  private hashPassword(password: string): Promise<string>;
  private verifyPassword(password: string, hash: string): Promise<boolean>;
  private generateTokens(userId: string): Promise<AuthTokens>;
}
```

**Security Considerations**:
- Password strength requirements and validation
- Rate limiting for login attempts
- Secure token storage and rotation
- Protection against brute force attacks

### 2. Digital Provenance Service

**Purpose**: Implement cryptographic card ownership and trading verification system.

**Key Features**:
- Unique card signatures with ownership tracking
- Ownership history chains for trade verification
- Cryptographic proof of card authenticity
- Anti-duplication and fraud prevention

**Implementation Approach**:
```typescript
// Example provenance system structure
interface CardProvenance {
  cardId: string;
  currentOwner: string;
  signature: string;
  ownershipChain: OwnershipRecord[];
  createdAt: Date;
  lastTransfer?: Date;
}

interface OwnershipRecord {
  previousOwner: string;
  newOwner: string;
  transferMethod: 'pack_opening' | 'trade' | 'reward';
  signature: string;
  timestamp: Date;
  blockHash?: string; // Optional blockchain integration
}

class ProvenanceService {
  public async createCard(templateId: string, ownerId: string): Promise<CardProvenance>;
  public async transferCard(cardId: string, fromOwner: string, toOwner: string): Promise<void>;
  public async verifyOwnership(cardId: string, ownerId: string): Promise<boolean>;
  public async getOwnershipHistory(cardId: string): Promise<OwnershipRecord[]>;
  public async validateCardAuthenticity(cardProvenance: CardProvenance): Promise<boolean>;
  
  private generateCardSignature(card: CardInstance, owner: string): string;
  private verifySignatureChain(ownershipChain: OwnershipRecord[]): boolean;
  private createOwnershipRecord(transfer: CardTransfer): OwnershipRecord;
}
```

**Design Considerations**:
- Cryptographically secure signature generation
- Efficient verification of ownership chains
- Protection against signature replay attacks
- Audit trail for all ownership changes

### 3. Trading Service

**Purpose**: Secure player-to-player card trading with verification and escrow.

**Key Features**:
- Trade proposal and negotiation system
- Escrow protection for secure exchanges
- Trade history and verification
- Trading restrictions and cooldowns

**Implementation Approach**:
```typescript
// Example trading system structure
interface TradeProposal {
  id: string;
  proposerId: string;
  targetPlayerId: string;
  offeredCards: string[];
  requestedCards: string[];
  status: TradeStatus;
  expiresAt: Date;
  createdAt: Date;
}

interface TradeTransaction {
  id: string;
  proposalId: string;
  participantA: string;
  participantB: string;
  cardsTransferred: CardTransfer[];
  completedAt: Date;
  signature: string;
}

class TradingService {
  public async createTradeProposal(proposal: CreateTradeRequest): Promise<TradeProposal>;
  public async acceptTrade(tradeId: string, accepterId: string): Promise<TradeTransaction>;
  public async rejectTrade(tradeId: string, rejecterId: string): Promise<void>;
  public async cancelTrade(tradeId: string, cancelerId: string): Promise<void>;
  public async getActiveProposals(playerId: string): Promise<TradeProposal[]>;
  
  private validateTradeProposal(proposal: CreateTradeRequest): Promise<ValidationResult>;
  private executeTradeTransaction(proposal: TradeProposal): Promise<TradeTransaction>;
  private updateCardOwnership(transfers: CardTransfer[]): Promise<void>;
}
```

**Design Considerations**:
- Atomic transactions for card exchanges
- Prevention of trade duplication or manipulation
- Fair exchange verification
- Trading restrictions based on account status

### 4. Card Collection Service

**Purpose**: Manage player card collections, pack opening, and inventory operations.

**Key Features**:
- Card pack opening with random generation
- Collection browsing and filtering
- Deck construction and validation
- Card statistics and analytics

**Implementation Approach**:
```typescript
// Example collection service structure
interface PlayerCollection {
  playerId: string;
  cards: Map<string, CardInstance>;
  totalCards: number;
  uniqueCards: number;
  lastUpdated: Date;
}

interface CardPack {
  id: string;
  type: PackType;
  rarity: Rarity;
  cardCount: number;
  guaranteedRarities: Rarity[];
  cost: number;
}

class CardService {
  public async openCardPack(playerId: string, packType: PackType): Promise<CardInstance[]>;
  public async getPlayerCollection(playerId: string): Promise<PlayerCollection>;
  public async searchCards(criteria: SearchCriteria): Promise<CardInstance[]>;
  public async validateDeck(deck: DeckDefinition): Promise<ValidationResult>;
  public async saveDeck(playerId: string, deck: DeckDefinition): Promise<Deck>;
  
  private generatePackCards(pack: CardPack): Promise<CardInstance[]>;
  private createCardInstance(templateId: string, ownerId: string): Promise<CardInstance>;
  private validateDeckConstraints(deck: DeckDefinition): ValidationResult;
}
```

**Design Considerations**:
- Fair random generation for pack opening
- Efficient collection queries and filtering
- Deck validation against current rule set
- Analytics for card distribution and economy

### 5. User Management Service

**Purpose**: Complete user profile and account management system.

**Key Features**:
- User profile creation and updates
- Account settings and preferences
- Friend lists and social features
- Achievement and progression tracking

**Implementation Approach**:
```typescript
// Example user service structure
interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  level: number;
  experience: number;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
}

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  currentRating: number;
  peakRating: number;
  favoriteCardTypes: string[];
}

class UserService {
  public async createUser(userData: CreateUserRequest): Promise<UserProfile>;
  public async updateProfile(userId: string, updates: ProfileUpdate): Promise<UserProfile>;
  public async getUserStats(userId: string): Promise<UserStats>;
  public async addFriend(userId: string, friendId: string): Promise<void>;
  public async searchUsers(query: string): Promise<UserProfile[]>;
  
  private validateUserData(userData: CreateUserRequest): ValidationResult;
  private calculateUserLevel(experience: number): number;
  private updateUserStats(userId: string, gameResult: GameResult): Promise<void>;
}
```

**Design Considerations**:
- Privacy controls for user data
- Efficient search and filtering
- Social features with appropriate privacy
- Progressive achievement system

## API Endpoint Design

### RESTful API Structure

```typescript
// Authentication endpoints
POST   /api/auth/register        # User registration
POST   /api/auth/login           # User login
POST   /api/auth/refresh         # Token refresh
POST   /api/auth/logout          # User logout
POST   /api/auth/forgot-password # Password reset

// User management endpoints
GET    /api/users/profile        # Get current user profile
PUT    /api/users/profile        # Update user profile
GET    /api/users/:id            # Get user by ID (public data)
GET    /api/users/search         # Search users
POST   /api/users/friends        # Add friend
DELETE /api/users/friends/:id    # Remove friend

// Card management endpoints
GET    /api/cards/collection     # Get user's card collection
POST   /api/cards/packs/open     # Open card pack
GET    /api/cards/search         # Search cards
GET    /api/cards/:id            # Get card details
GET    /api/cards/templates      # Get card templates

// Deck management endpoints
GET    /api/decks                # Get user's decks
POST   /api/decks                # Create new deck
PUT    /api/decks/:id            # Update deck
DELETE /api/decks/:id            # Delete deck
POST   /api/decks/:id/validate   # Validate deck

// Trading endpoints
GET    /api/trades               # Get active trades
POST   /api/trades               # Create trade proposal
PUT    /api/trades/:id/accept    # Accept trade
PUT    /api/trades/:id/reject    # Reject trade
DELETE /api/trades/:id           # Cancel trade

// Game endpoints
POST   /api/games/results        # Submit game result
GET    /api/games/history        # Get game history
GET    /api/games/stats          # Get game statistics
```

### Request/Response Schemas

```typescript
// Standard API response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
  pagination?: PaginationInfo;
  meta?: ResponseMeta;
}

interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Example request schemas
interface CreateDeckRequest {
  name: string;
  description?: string;
  summons: SummonSlot[];
  mainDeck: string[];
  advanceDeck: string[];
}

interface TradeProposalRequest {
  targetPlayerId: string;
  offeredCardIds: string[];
  requestedCardIds: string[];
  message?: string;
  expirationHours: number;
}
```

## Database Design

### Core Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Card instances (owned cards)
CREATE TABLE card_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(50) NOT NULL,
  owner_id UUID REFERENCES users(id),
  signature VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  acquired_method VARCHAR(50) NOT NULL
);

-- Card ownership history
CREATE TABLE ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_instance_id UUID REFERENCES card_instances(id),
  previous_owner_id UUID REFERENCES users(id),
  new_owner_id UUID REFERENCES users(id),
  transfer_method VARCHAR(50) NOT NULL,
  signature VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trading system
CREATE TABLE trade_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id UUID REFERENCES users(id),
  target_player_id UUID REFERENCES users(id),
  offered_cards UUID[] NOT NULL,
  requested_cards UUID[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Decks
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  summon_slots JSONB NOT NULL,
  main_deck UUID[] NOT NULL,
  advance_deck UUID[] NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Game results
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id VARCHAR(100) UNIQUE NOT NULL,
  player_a_id UUID REFERENCES users(id),
  player_b_id UUID REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  game_mode VARCHAR(50) NOT NULL,
  duration_seconds INTEGER,
  rating_changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_card_instances_owner ON card_instances(owner_id);
CREATE INDEX idx_card_instances_template ON card_instances(template_id);
CREATE INDEX idx_ownership_history_card ON ownership_history(card_instance_id);
CREATE INDEX idx_trade_proposals_status ON trade_proposals(status);
CREATE INDEX idx_trade_proposals_target ON trade_proposals(target_player_id);
CREATE INDEX idx_decks_owner ON decks(owner_id);
CREATE INDEX idx_game_results_players ON game_results(player_a_id, player_b_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Composite indexes for complex queries
CREATE INDEX idx_card_instances_owner_template ON card_instances(owner_id, template_id);
CREATE INDEX idx_trade_proposals_status_target ON trade_proposals(status, target_player_id);
```

## Implementation Phases

### Phase 1: Foundation and Authentication (Week 1)
1. **Project Setup**
   - Initialize Express.js TypeScript project
   - Configure Prisma with PostgreSQL
   - Set up basic middleware (cors, helmet, logging)
   - Create development and production configurations

2. **Authentication System**
   - Implement user registration and login
   - Create JWT token management
   - Add password hashing and validation
   - Build basic session management

3. **Database Schema**
   - Create Prisma schema for core entities
   - Implement database migrations
   - Add seed data for development
   - Set up connection pooling

### Phase 2: User and Card Management (Week 2)
1. **User Management**
   - Complete user profile system
   - Implement user search and social features
   - Add user statistics and achievements
   - Create friend system foundation

2. **Card System Foundation**
   - Implement card template management
   - Create card instance generation
   - Build basic collection endpoints
   - Add card search and filtering

3. **Digital Provenance**
   - Implement cryptographic card signatures
   - Create ownership tracking system
   - Build ownership verification
   - Add ownership history tracking

### Phase 3: Trading and Collection (Week 3)
1. **Trading System**
   - Implement trade proposal system
   - Create secure trade execution
   - Add trade history and verification
   - Build trading restrictions and validation

2. **Collection Management**
   - Complete collection browsing features
   - Implement pack opening system
   - Add collection statistics
   - Create collection export/import

3. **Deck Management**
   - Build deck creation and editing
   - Implement deck validation system
   - Add deck sharing features
   - Create deck templates and presets

### Phase 4: Game Integration and Polish (Week 4)
1. **Game Results Integration**
   - Implement game result submission
   - Create match history system
   - Add rating and statistics updates
   - Build performance analytics

2. **Advanced Features**
   - Complete social features
   - Add notification system
   - Implement advanced search
   - Create admin panel features

3. **Testing and Security**
   - Write comprehensive API tests
   - Implement security testing
   - Add performance optimization
   - Create monitoring and logging

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper input sanitization
- Add SQL injection protection

### Authentication Security
- Strong password requirements
- Rate limiting for authentication attempts
- Secure token storage and rotation
- Session timeout and management

### API Security
- Rate limiting per endpoint
- Request size limits
- CORS configuration
- Security headers (helmet)

### Card Security
- Cryptographic signature verification
- Ownership chain validation
- Anti-duplication measures
- Trade fraud prevention

## Testing Strategy

### Unit Testing
- Test individual service methods
- Mock database operations
- Test validation logic
- Test error handling

### Integration Testing
- Test complete API workflows
- Test database operations
- Test authentication flows
- Test trading scenarios

### Security Testing
- Test authentication vulnerabilities
- Test authorization bypass attempts
- Test input validation
- Test rate limiting

### Performance Testing
- Load test API endpoints
- Test database query performance
- Test concurrent user scenarios
- Test large collection operations

## Monitoring and Observability

### Key Metrics
- API response times and error rates
- Database query performance
- User activity and engagement
- Trading volume and patterns

### Logging Strategy
- Structured JSON logging
- Request/response logging
- Error and exception tracking
- Security event logging

### Health Checks
- Database connectivity
- External service availability
- Memory and CPU usage
- Disk space and I/O

This Backend API implementation plan provides a comprehensive foundation for managing all the logistical aspects of Summoner's Grid while ensuring security, scalability, and maintainability for the digital card game ecosystem.