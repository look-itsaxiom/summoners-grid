# Summoner's Grid Database Package

This package contains the complete database schema and utilities for the Summoner's Grid tactical card game.

## 🏗️ Architecture

The database is built using **Prisma** with **PostgreSQL** as the primary database and **Redis** for caching. It implements a comprehensive digital provenance system for card ownership tracking.

## 📊 Schema Overview

### Core Entities

- **Users**: Player accounts with authentication and statistics
- **Card Templates**: Immutable card definitions from game sets (Alpha, etc.)
- **Card Instances**: Unique player-owned cards with digital provenance
- **Decks**: Player-built deck configurations for different formats
- **Game Sessions**: Match data and results
- **Trading System**: Secure card trading with cryptographic verification

### Digital Provenance Features

- **Cryptographic Signatures**: Each card instance has a unique signature
- **Ownership Chain**: Complete audit trail of all card transfers
- **Transfer Verification**: Cryptographic proof of legitimate trades
- **Immutable History**: Tamper-proof ownership records

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+
- PostgreSQL 15+ (via Docker)
- Redis 7+ (via Docker)

### Setup Database

```bash
# Start database services
docker-compose up -d postgres redis

# Navigate to database package
cd packages/database

# Generate Prisma client
npx prisma generate

# Apply schema to database
npx prisma db push

# Seed with Alpha Set data
npx tsx prisma/seed.ts
```

### Quick Setup Script

```bash
# Run the setup script from project root
./scripts/setup-database.sh
```

## 🃏 Alpha Set Data

The database comes pre-seeded with the complete Alpha Set:

- **24 Card Templates**: Action cards, Role cards, Weapons, Buildings, etc.
- **3 Sample Users**: With different skill levels and game history
- **Sample Card Instances**: Unique cards with procedural stats
- **Sample Decks**: Ready-to-play deck configurations
- **Game History**: Example matches and trading data

## 🔧 Database Utilities

### DatabaseService Class

The `DatabaseService` provides high-level operations:

```typescript
import { DatabaseService } from '@summoners-grid/database';

// Create a new card with digital provenance
const card = await DatabaseService.createCardInstance({
  templateId: '001',
  ownerId: 'user-123',
  acquiredMethod: 'pack_opening',
  acquisitionData: { packType: 'alpha_starter' }
});

// Transfer card ownership securely
await DatabaseService.transferCard(
  cardId,
  fromUserId,
  toUserId,
  'trade',
  { tradeId: 'trade-456' }
);

// Verify card authenticity
const isValid = await DatabaseService.verifyCardOwnership(cardId);

// Validate deck composition
const validation = await DatabaseService.validateDeck(deckData);
```

### Direct Prisma Access

```typescript
import { prisma } from '@summoners-grid/database';

// Query users with their card collections
const users = await prisma.user.findMany({
  include: {
    cardInstances: {
      include: { template: true }
    }
  }
});
```

## 📋 Card Templates

### Alpha Set Overview

| Type | Count | Examples |
|------|-------|----------|
| Action Cards | 10 | Blast Bolt, Healing Hands, Rush |
| Role Cards | 13 | Warrior, Magician, Scout, Paladin |
| Weapon Cards | 3 | Heirloom Sword, Hunting Bow, Apprentice's Wand |
| Building Cards | 2 | Gignen Country, Dark Altar |
| Counter Cards | 3 | Dramatic Return!, Graverobbing |
| Quest Cards | 2 | Taste of Battle, Nearwood Forest Expedition |

### Card Instance Features

- **Unique Stats**: Procedurally generated base stats and growth rates
- **Digital Signatures**: Cryptographic proof of authenticity
- **Species Variants**: Different fantasy species with distinct traits
- **Equipment Slots**: Weapon, armor, and accessory combinations

## 🎮 Game Mechanics Support

The schema supports all core game mechanics:

- **3v3 Tactical Combat**: Deck validation for tournament format
- **Role Advancement**: Complex tier progression trees
- **Digital Provenance**: Tamper-proof card ownership
- **Trading System**: Secure player-to-player exchanges
- **Quest System**: Objective-based gameplay rewards
- **Territory Control**: Board positioning and building placement

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions with refresh tokens
- **Password Hashing**: bcrypt protection for user credentials
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Complete action history tracking
- **Card Locking**: Prevent transfers during games/trades
- **Signature Verification**: Cryptographic ownership proof

## 🧪 Testing

```bash
# Run database tests (requires running database)
npx nx test database

# Test with coverage
npx nx test database --coverage

# Run specific test suite
npx jest --testNamePattern="DatabaseService"
```

## 📈 Performance Considerations

- **Indexes**: Optimized for common query patterns
- **Connection Pooling**: Prisma handles connection management
- **Caching**: Redis integration for session and game state
- **Pagination**: Built-in support for large data sets
- **Query Optimization**: Prisma generates efficient SQL

## 🔄 Migration Strategy

```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# Deploy to production
npx prisma migrate deploy

# Reset development database
npx prisma migrate reset
```

## 🛠️ Development Tools

- **Prisma Studio**: Visual database browser (`npx prisma studio`)
- **Database Seeding**: Comprehensive test data generation
- **Schema Validation**: Type-safe database operations
- **Migration History**: Version controlled schema changes

## 📚 API Reference

### Key Models

- `User`: Player accounts and statistics
- `CardTemplate`: Immutable card definitions
- `CardInstance`: Unique player-owned cards
- `Deck`: Player deck configurations
- `GameSession`: Match data and results
- `TradeProposal`: Secure trading system
- `OwnershipHistory`: Digital provenance chain

### Enums

- `CardType`: SUMMON, ACTION, BUILDING, WEAPON, etc.
- `Rarity`: COMMON, UNCOMMON, RARE, LEGENDARY, MYTH
- `Attribute`: FIRE, WATER, EARTH, WIND, LIGHT, DARK, NEUTRAL
- `TradeStatus`: PENDING, ACCEPTED, COMPLETED, CANCELLED

## 🚀 Production Deployment

The database is designed for easy deployment to various hosting platforms:

- **PostgreSQL**: Any managed PostgreSQL service
- **Redis**: Any Redis hosting service
- **Docker**: Complete containerization support
- **Environment Variables**: Flexible configuration
- **Health Checks**: Built-in monitoring endpoints

## Building

Run `nx build database` to build the library.

## Running unit tests

Run `nx test database` to execute the unit tests via [Jest](https://jestjs.io).

## 📝 Task Completion Status

✅ **Task 004 - Core Database Schema**: COMPLETED

- [x] Comprehensive Prisma schema with 15+ models
- [x] User authentication tables with JWT support
- [x] Card definition and ownership tracking
- [x] Digital provenance system with cryptographic signatures
- [x] Trading system with escrow mechanics
- [x] Game session and matchmaking support
- [x] Social features (friends, friend requests)
- [x] Audit logging for security compliance
- [x] Alpha Set card templates and sample data
- [x] Database utility functions and services
- [x] Comprehensive test coverage
- [x] Migration and seeding scripts
- [x] Development tooling and documentation

**Acceptance Criteria Met**:
- ✅ Schema migration works successfully
- ✅ Basic CRUD operations available via DatabaseService
- ✅ Digital provenance system fully implemented
- ✅ Comprehensive test coverage for all utilities
- ✅ Sample data includes full Alpha Set

The database foundation is now ready to support the complete Summoner's Grid tactical card game implementation.
