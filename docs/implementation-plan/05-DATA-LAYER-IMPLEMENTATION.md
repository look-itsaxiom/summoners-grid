# Summoner's Grid - Data Layer Implementation Plan

## Overview

The Data Layer is responsible for persistent storage, data access patterns, caching strategies, and database interactions across the entire Summoner's Grid ecosystem. This layer must handle complex relationships between users, cards, games, and transactions while maintaining data integrity, performance, and scalability.

## Data Architecture Principles

### Core Responsibilities
- **Data Persistence**: Reliable storage of all game and user data
- **Data Integrity**: ACID transactions and referential integrity
- **Performance**: Optimized queries and efficient data access patterns
- **Scalability**: Horizontal and vertical scaling capabilities
- **Security**: Data encryption, access control, and audit trails

### Design Goals
- **Consistency**: Strong consistency for critical operations (trades, ownership)
- **Availability**: High availability with minimal downtime
- **Partition Tolerance**: Graceful handling of network partitions
- **Performance**: Sub-50ms response times for common queries
- **Auditability**: Complete audit trail for all data changes

## Technology Stack

### Primary Database
- **PostgreSQL 15+**: Primary relational database
- **Connection Pooling**: pgbouncer or built-in connection pooling
- **Replication**: Master-slave setup for read scaling
- **Backup**: Automated backups with point-in-time recovery

### Caching Layer
- **Redis 7+**: Primary cache for hot data and sessions
- **Redis Cluster**: Distributed caching for scalability
- **Cache Strategies**: Write-through, write-behind, and invalidation patterns

### ORM and Data Access
- **Prisma**: Type-safe ORM with excellent TypeScript integration
- **Raw SQL**: For complex queries and performance optimization
- **Migrations**: Version-controlled database schema changes

### Monitoring and Analytics
- **pg_stat_statements**: PostgreSQL query performance monitoring
- **Redis INFO**: Cache performance and memory usage monitoring
- **Custom Metrics**: Application-specific performance metrics

## Database Design

### Core Schema Architecture

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    rating INTEGER DEFAULT 1000,
    peak_rating INTEGER DEFAULT 1000,
    total_games INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Card Templates (Static card definitions)
CREATE TABLE card_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    cost JSONB,
    requirements JSONB,
    effects JSONB,
    attributes JSONB,
    stats JSONB,
    flavor_text TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card Instances (Player-owned cards)
CREATE TABLE card_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id VARCHAR(50) REFERENCES card_templates(id),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    unique_stats JSONB, -- For procedurally generated cards
    signature VARCHAR(512) UNIQUE NOT NULL,
    signature_chain TEXT[], -- Ownership history signatures
    acquired_method VARCHAR(50) NOT NULL,
    acquisition_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transferred TIMESTAMP WITH TIME ZONE
);

-- Card Ownership History
CREATE TABLE ownership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_instance_id UUID REFERENCES card_instances(id) ON DELETE CASCADE,
    previous_owner_id UUID REFERENCES users(id),
    new_owner_id UUID REFERENCES users(id),
    transfer_method VARCHAR(50) NOT NULL,
    transfer_data JSONB,
    signature VARCHAR(512) NOT NULL,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decks
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    format VARCHAR(50) DEFAULT '3v3',
    summon_slots JSONB NOT NULL,
    main_deck UUID[] NOT NULL,
    advance_deck UUID[] NOT NULL,
    is_valid BOOLEAN DEFAULT false,
    validation_errors JSONB,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading System
CREATE TABLE trade_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    offered_cards UUID[] NOT NULL,
    requested_cards UUID[] NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Sessions and Results
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(100) UNIQUE NOT NULL,
    game_mode VARCHAR(50) NOT NULL,
    format VARCHAR(50) DEFAULT '3v3',
    player_a_id UUID REFERENCES users(id),
    player_b_id UUID REFERENCES users(id),
    winner_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    rating_changes JSONB,
    game_data JSONB, -- Compressed game state/replay data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Sessions and Authentication
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friend Relationships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Audit Trail
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Advanced Database Features

```sql
-- Indexes for Performance
CREATE INDEX CONCURRENTLY idx_card_instances_owner ON card_instances(owner_id);
CREATE INDEX CONCURRENTLY idx_card_instances_template ON card_instances(template_id);
CREATE INDEX CONCURRENTLY idx_card_instances_signature ON card_instances(signature);
CREATE INDEX CONCURRENTLY idx_ownership_history_card ON ownership_history(card_instance_id);
CREATE INDEX CONCURRENTLY idx_ownership_history_owners ON ownership_history(previous_owner_id, new_owner_id);
CREATE INDEX CONCURRENTLY idx_decks_owner ON decks(owner_id);
CREATE INDEX CONCURRENTLY idx_decks_public ON decks(is_public) WHERE is_public = true;
CREATE INDEX CONCURRENTLY idx_trade_proposals_status ON trade_proposals(status);
CREATE INDEX CONCURRENTLY idx_trade_proposals_target ON trade_proposals(target_player_id);
CREATE INDEX CONCURRENTLY idx_game_sessions_players ON game_sessions(player_a_id, player_b_id);
CREATE INDEX CONCURRENTLY idx_game_sessions_status ON game_sessions(status);
CREATE INDEX CONCURRENTLY idx_user_sessions_token ON user_sessions(refresh_token_hash);
CREATE INDEX CONCURRENTLY idx_friendships_users ON friendships(requester_id, addressee_id);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_card_instances_owner_template ON card_instances(owner_id, template_id);
CREATE INDEX CONCURRENTLY idx_trade_proposals_status_expires ON trade_proposals(status, expires_at);
CREATE INDEX CONCURRENTLY idx_game_sessions_player_status ON game_sessions(player_a_id, status);

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY idx_card_templates_effects ON card_templates USING GIN(effects);
CREATE INDEX CONCURRENTLY idx_card_templates_attributes ON card_templates USING GIN(attributes);
CREATE INDEX CONCURRENTLY idx_card_instances_stats ON card_instances USING GIN(unique_stats);
CREATE INDEX CONCURRENTLY idx_decks_summon_slots ON decks USING GIN(summon_slots);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_card_templates_search ON card_templates USING GIN(to_tsvector('english', name || ' ' || COALESCE(flavor_text, '')));
CREATE INDEX CONCURRENTLY idx_users_search ON users USING GIN(to_tsvector('english', username || ' ' || COALESCE(display_name, '')));
```

### Database Constraints and Triggers

```sql
-- Constraints for data integrity
ALTER TABLE card_instances ADD CONSTRAINT chk_signature_format 
    CHECK (length(signature) >= 64);

ALTER TABLE trade_proposals ADD CONSTRAINT chk_different_players 
    CHECK (proposer_id != target_player_id);

ALTER TABLE trade_proposals ADD CONSTRAINT chk_valid_expiration 
    CHECK (expires_at > created_at);

ALTER TABLE users ADD CONSTRAINT chk_valid_rating 
    CHECK (rating >= 0 AND rating <= 5000);

-- Triggers for audit logging
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), current_setting('app.current_user_id', true)::UUID);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), current_setting('app.current_user_id', true)::UUID);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_card_instances AFTER INSERT OR UPDATE OR DELETE ON card_instances
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_ownership_history AFTER INSERT OR UPDATE OR DELETE ON ownership_history
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_trade_proposals AFTER INSERT OR UPDATE OR DELETE ON trade_proposals
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Caching Strategy

### Cache Architecture

```typescript
// Cache key patterns
const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_COLLECTION: (userId: string) => `user:collection:${userId}`,
  CARD_TEMPLATE: (templateId: string) => `card:template:${templateId}`,
  DECK: (deckId: string) => `deck:${deckId}`,
  TRADE_PROPOSALS: (userId: string) => `trades:${userId}`,
  GAME_SESSION: (gameId: string) => `game:${gameId}`,
  USER_STATS: (userId: string) => `stats:${userId}`,
  LEADERBOARD: (type: string) => `leaderboard:${type}`,
} as const;

// Cache TTL configuration
const CACHE_TTL = {
  USER_PROFILE: 300,      // 5 minutes
  USER_COLLECTION: 600,   // 10 minutes
  CARD_TEMPLATE: 3600,    // 1 hour
  DECK: 1800,            // 30 minutes
  TRADE_PROPOSALS: 60,    // 1 minute
  GAME_SESSION: 30,       // 30 seconds
  USER_STATS: 900,        // 15 minutes
  LEADERBOARD: 300,       // 5 minutes
} as const;
```

### Caching Patterns

#### 1. Read-Through Cache
```typescript
class CacheService {
  async getUserCollection(userId: string): Promise<CardInstance[]> {
    const cacheKey = CACHE_KEYS.USER_COLLECTION(userId);
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fallback to database
    const collection = await this.db.cardInstance.findMany({
      where: { ownerId: userId },
      include: { template: true }
    });
    
    // Store in cache
    await this.redis.setex(cacheKey, CACHE_TTL.USER_COLLECTION, JSON.stringify(collection));
    
    return collection;
  }
}
```

#### 2. Write-Through Cache
```typescript
async updateUserProfile(userId: string, updates: ProfileUpdate): Promise<UserProfile> {
  // Update database
  const updatedUser = await this.db.user.update({
    where: { id: userId },
    data: updates
  });
  
  // Update cache
  const cacheKey = CACHE_KEYS.USER_PROFILE(userId);
  await this.redis.setex(cacheKey, CACHE_TTL.USER_PROFILE, JSON.stringify(updatedUser));
  
  return updatedUser;
}
```

#### 3. Cache Invalidation
```typescript
async invalidateUserCaches(userId: string): Promise<void> {
  const keys = [
    CACHE_KEYS.USER_PROFILE(userId),
    CACHE_KEYS.USER_COLLECTION(userId),
    CACHE_KEYS.USER_STATS(userId),
    CACHE_KEYS.TRADE_PROPOSALS(userId)
  ];
  
  await this.redis.del(...keys);
}
```

### Cache Warming Strategies

```typescript
class CacheWarmupService {
  async warmupUserData(userId: string): Promise<void> {
    // Preload frequently accessed data
    await Promise.all([
      this.cacheService.getUserProfile(userId),
      this.cacheService.getUserCollection(userId),
      this.cacheService.getUserStats(userId)
    ]);
  }
  
  async warmupPopularCards(): Promise<void> {
    // Cache most popular card templates
    const popularCards = await this.db.cardTemplate.findMany({
      orderBy: { usage_count: 'desc' },
      take: 100
    });
    
    for (const card of popularCards) {
      const cacheKey = CACHE_KEYS.CARD_TEMPLATE(card.id);
      await this.redis.setex(cacheKey, CACHE_TTL.CARD_TEMPLATE, JSON.stringify(card));
    }
  }
}
```

## Data Access Layer

### Repository Pattern Implementation

```typescript
// Base repository with common operations
abstract class BaseRepository<T, K> {
  constructor(protected db: PrismaClient, protected redis: Redis) {}
  
  abstract findById(id: K): Promise<T | null>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: K, data: Partial<T>): Promise<T>;
  abstract delete(id: K): Promise<void>;
  
  protected async withCache<R>(
    key: string,
    ttl: number,
    fetcher: () => Promise<R>
  ): Promise<R> {
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const result = await fetcher();
    await this.redis.setex(key, ttl, JSON.stringify(result));
    return result;
  }
}

// User repository implementation
class UserRepository extends BaseRepository<User, string> {
  async findById(id: string): Promise<User | null> {
    return this.withCache(
      CACHE_KEYS.USER_PROFILE(id),
      CACHE_TTL.USER_PROFILE,
      () => this.db.user.findUnique({ where: { id } })
    );
  }
  
  async findByUsername(username: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { username }
    });
  }
  
  async create(userData: CreateUserData): Promise<User> {
    return this.db.user.create({
      data: userData
    });
  }
  
  async update(id: string, updates: Partial<User>): Promise<User> {
    const user = await this.db.user.update({
      where: { id },
      data: updates
    });
    
    // Invalidate cache
    await this.redis.del(CACHE_KEYS.USER_PROFILE(id));
    
    return user;
  }
  
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return this.db.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        level: true,
        rating: true
      }
    });
  }
}

// Card repository implementation
class CardRepository extends BaseRepository<CardInstance, string> {
  async findById(id: string): Promise<CardInstance | null> {
    return this.db.cardInstance.findUnique({
      where: { id },
      include: { template: true }
    });
  }
  
  async findByOwner(ownerId: string): Promise<CardInstance[]> {
    return this.withCache(
      CACHE_KEYS.USER_COLLECTION(ownerId),
      CACHE_TTL.USER_COLLECTION,
      () => this.db.cardInstance.findMany({
        where: { ownerId },
        include: { template: true },
        orderBy: { createdAt: 'desc' }
      })
    );
  }
  
  async transferOwnership(
    cardId: string, 
    fromOwner: string, 
    toOwner: string, 
    method: string
  ): Promise<void> {
    await this.db.$transaction(async (tx) => {
      // Update card ownership
      await tx.cardInstance.update({
        where: { id: cardId },
        data: { 
          ownerId: toOwner,
          lastTransferred: new Date()
        }
      });
      
      // Record ownership history
      await tx.ownershipHistory.create({
        data: {
          cardInstanceId: cardId,
          previousOwnerId: fromOwner,
          newOwnerId: toOwner,
          transferMethod: method,
          signature: this.generateTransferSignature(cardId, fromOwner, toOwner)
        }
      });
    });
    
    // Invalidate caches
    await Promise.all([
      this.redis.del(CACHE_KEYS.USER_COLLECTION(fromOwner)),
      this.redis.del(CACHE_KEYS.USER_COLLECTION(toOwner))
    ]);
  }
  
  private generateTransferSignature(cardId: string, from: string, to: string): string {
    // Implementation for cryptographic signature generation
    return crypto.createHash('sha256')
      .update(`${cardId}:${from}:${to}:${Date.now()}`)
      .digest('hex');
  }
}
```

### Query Optimization Strategies

#### 1. Efficient Pagination
```typescript
interface PaginationOptions {
  page: number;
  limit: number;
  cursor?: string;
}

class QueryBuilder {
  static async paginateQuery<T>(
    model: any,
    options: PaginationOptions,
    where?: any,
    orderBy?: any
  ): Promise<{ data: T[]; pagination: PaginationInfo }> {
    const { page, limit, cursor } = options;
    
    if (cursor) {
      // Cursor-based pagination for better performance
      const data = await model.findMany({
        where: {
          ...where,
          id: { gt: cursor }
        },
        orderBy: orderBy || { id: 'asc' },
        take: limit + 1
      });
      
      const hasNext = data.length > limit;
      const items = hasNext ? data.slice(0, -1) : data;
      
      return {
        data: items,
        pagination: {
          hasNext,
          nextCursor: hasNext ? items[items.length - 1].id : null,
          count: items.length
        }
      };
    } else {
      // Offset-based pagination for known page counts
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit
        }),
        model.count({ where })
      ]);
      
      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    }
  }
}
```

#### 2. Batch Operations
```typescript
class BatchOperations {
  async batchCreateCards(
    ownerId: string, 
    cardTemplateIds: string[]
  ): Promise<CardInstance[]> {
    const cards = cardTemplateIds.map(templateId => ({
      templateId,
      ownerId,
      signature: this.generateCardSignature(templateId, ownerId),
      acquiredMethod: 'pack_opening'
    }));
    
    return this.db.cardInstance.createMany({
      data: cards,
      skipDuplicates: true
    });
  }
  
  async batchUpdateUserStats(updates: Array<{userId: string, stats: Partial<UserStats>}>): Promise<void> {
    const updatePromises = updates.map(({ userId, stats }) =>
      this.db.user.update({
        where: { id: userId },
        data: stats
      })
    );
    
    await Promise.all(updatePromises);
    
    // Invalidate caches
    const cacheKeys = updates.map(({ userId }) => CACHE_KEYS.USER_STATS(userId));
    await this.redis.del(...cacheKeys);
  }
}
```

## Database Performance Optimization

### Connection Pooling Configuration

```typescript
// Prisma configuration for connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=20'
    }
  },
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' }
  ]
});

// Monitor query performance
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Log slow queries
    console.warn(`Slow query detected: ${e.query} (${e.duration}ms)`);
  }
});
```

### Query Analysis and Monitoring

```typescript
class DatabaseMonitoring {
  async analyzeSlowQueries(): Promise<SlowQuery[]> {
    const slowQueries = await this.db.$queryRaw`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements 
      WHERE mean_time > 100
      ORDER BY mean_time DESC 
      LIMIT 20
    `;
    
    return slowQueries;
  }
  
  async getTableSizes(): Promise<TableSize[]> {
    const tableSizes = await this.db.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation,
        null_frac
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname
    `;
    
    return tableSizes;
  }
  
  async optimizeIndexes(): Promise<IndexRecommendation[]> {
    // Analyze query patterns and suggest index optimizations
    const missingIndexes = await this.db.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public' 
        AND n_distinct > 100
        AND correlation < 0.1
    `;
    
    return missingIndexes;
  }
}
```

## Data Migration and Versioning

### Migration Strategy

```typescript
// Prisma migration workflow
interface Migration {
  version: string;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

class MigrationRunner {
  async runMigrations(): Promise<void> {
    // Use Prisma's built-in migration system
    await this.prisma.$executeRaw`SELECT 1`; // Health check
    console.log('Database connection established');
    
    // Run any custom data migrations
    await this.runDataMigrations();
  }
  
  private async runDataMigrations(): Promise<void> {
    const migrations = [
      this.migrateCardSignatures(),
      this.updateUserStatistics(),
      this.cleanupExpiredSessions()
    ];
    
    for (const migration of migrations) {
      try {
        await migration;
        console.log('Migration completed successfully');
      } catch (error) {
        console.error('Migration failed:', error);
        throw error;
      }
    }
  }
  
  private async migrateCardSignatures(): Promise<void> {
    // Example: Update card signatures to new format
    const cardsWithoutSignatures = await this.db.cardInstance.findMany({
      where: { signature: null }
    });
    
    for (const card of cardsWithoutSignatures) {
      const signature = this.generateCardSignature(card.templateId, card.ownerId);
      await this.db.cardInstance.update({
        where: { id: card.id },
        data: { signature }
      });
    }
  }
}
```

### Data Seeding

```typescript
class DatabaseSeeder {
  async seedDevelopmentData(): Promise<void> {
    console.log('Seeding development data...');
    
    await this.seedCardTemplates();
    await this.seedTestUsers();
    await this.seedTestDecks();
    
    console.log('Development data seeded successfully');
  }
  
  private async seedCardTemplates(): Promise<void> {
    const alphaCards = await this.loadAlphaCardSet();
    
    for (const cardData of alphaCards) {
      await this.db.cardTemplate.upsert({
        where: { id: cardData.id },
        update: cardData,
        create: cardData
      });
    }
  }
  
  private async seedTestUsers(): Promise<void> {
    const testUsers = [
      {
        username: 'testplayer1',
        email: 'test1@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        displayName: 'Test Player 1'
      },
      {
        username: 'testplayer2',
        email: 'test2@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        displayName: 'Test Player 2'
      }
    ];
    
    for (const userData of testUsers) {
      await this.db.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData
      });
    }
  }
}
```

## Backup and Recovery Strategy

### Automated Backup System

```bash
#!/bin/bash
# Database backup script

DB_NAME="summoners_grid"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$DATE.sql"

# Create full backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Upload to cloud storage (optional)
aws s3 cp "${BACKUP_FILE}.gz" s3://backups/database/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "${DB_NAME}_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Point-in-Time Recovery

```sql
-- Enable point-in-time recovery
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /var/lib/postgresql/archive/%f';
ALTER SYSTEM SET max_wal_senders = 3;

-- Create recovery configuration
-- recovery.conf (for point-in-time recovery)
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
```

## Implementation Phases

### Phase 1: Core Database Setup (Week 1)
1. **Database Infrastructure**
   - Set up PostgreSQL with proper configuration
   - Configure connection pooling with pgbouncer
   - Set up Redis for caching
   - Create development and production environments

2. **Schema Implementation**
   - Implement core Prisma schema
   - Create all tables with proper constraints
   - Add indexes for performance
   - Set up audit triggers

3. **Basic Data Access**
   - Implement repository pattern
   - Create basic CRUD operations
   - Set up connection management
   - Add basic caching layer

### Phase 2: Advanced Features (Week 2)
1. **Caching Implementation**
   - Implement comprehensive caching strategies
   - Add cache invalidation logic
   - Create cache warming procedures
   - Monitor cache performance

2. **Query Optimization**
   - Implement efficient pagination
   - Add batch operation support
   - Optimize complex queries
   - Create query monitoring

3. **Data Integrity**
   - Implement transaction management
   - Add data validation
   - Create ownership verification
   - Set up audit logging

### Phase 3: Performance and Monitoring (Week 3)
1. **Performance Optimization**
   - Analyze and optimize slow queries
   - Implement database monitoring
   - Add performance metrics
   - Create alerting system

2. **Backup and Recovery**
   - Set up automated backups
   - Implement point-in-time recovery
   - Test disaster recovery procedures
   - Create operational runbooks

3. **Security Hardening**
   - Implement access controls
   - Add data encryption
   - Secure connection strings
   - Create security monitoring

### Phase 4: Production Readiness (Week 4)
1. **Migration System**
   - Create migration procedures
   - Test migration rollbacks
   - Set up data seeding
   - Create maintenance procedures

2. **Scaling Preparation**
   - Set up read replicas
   - Implement horizontal scaling
   - Test failover procedures
   - Create scaling metrics

3. **Documentation and Training**
   - Document all procedures
   - Create operational guides
   - Train team on procedures
   - Set up monitoring dashboards

This Data Layer implementation plan provides a robust foundation for all data operations in Summoner's Grid, ensuring performance, reliability, and scalability while maintaining data integrity and security throughout the system.