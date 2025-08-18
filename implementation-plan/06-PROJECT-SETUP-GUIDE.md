# Summoner's Grid - Project Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the complete Summoner's Grid development environment and implementing the architecture outlined in the previous documents. It's designed to be followed by entry-level developers who want to build the game from scratch.

## Prerequisites

### Required Software
- **Node.js 18+**: JavaScript runtime ([Download](https://nodejs.org/))
- **npm or pnpm**: Package manager (npm comes with Node.js, pnpm can be installed separately)
- **PostgreSQL 15+**: Primary database ([Download](https://www.postgresql.org/download/))
- **Redis 7+**: Caching server ([Download](https://redis.io/download))
- **Git**: Version control ([Download](https://git-scm.com/))
- **VS Code**: Recommended IDE with TypeScript support

### Development Tools
- **Docker**: For containerization (optional but recommended)
- **pgAdmin**: PostgreSQL administration tool
- **Redis Desktop Manager**: Redis GUI client
- **Postman**: API testing tool

### System Requirements
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB available space
- **OS**: Windows 10+, macOS 10.15+, or Ubuntu 20.04+

## Phase 1: Project Foundation Setup (Week 1)

### Step 1: Create Project Structure

```bash
# Create main project directory
mkdir summoners-grid
cd summoners-grid

# Initialize monorepo structure
mkdir -p packages/{client,game-engine,game-server,api-server,database,shared}
mkdir -p assets/{images,sounds,fonts}
mkdir -p docs
mkdir -p tools
mkdir -p deployment

# Create root package.json
npm init -y
```

### Step 2: Configure Monorepo Management with Nx

For optimal monorepo management, we'll use Nx which provides excellent TypeScript support, caching, and dependency graph management.

```bash
# Install Nx globally
npm install -g nx@latest

# Initialize Nx workspace
npx create-nx-workspace@latest summoners-grid --preset=ts --packageManager=npm
cd summoners-grid

# Generate applications and libraries
nx g @nx/node:app game-server
nx g @nx/node:app api-server  
nx g @nx/react:app game-client
nx g @nx/js:lib shared-types
nx g @nx/js:lib game-engine
nx g @nx/js:lib database
```

Alternatively, if you prefer a simpler approach with npm workspaces:

Create `package.json` in root directory:

```json
{
  "name": "summoners-grid",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "dev": "npm run dev --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "clean": "npm run clean --workspaces --if-present",
    "type-check": "npm run type-check --workspaces --if-present"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^14.0.0"
  }
}
```

### Alternative: Monorepo with Lerna + npm workspaces

If you need more advanced publishing and versioning capabilities:

```bash
# Install Lerna
npm install -g lerna

# Initialize Lerna
lerna init

# Configure lerna.json
cat > lerna.json << 'EOF'
{
  "version": "independent",
  "npmClient": "npm",
  "useWorkspaces": true,
  "stream": true,
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish"
    },
    "bootstrap": {
      "ignore": "component-*",
      "npmClientArgs": ["--no-package-lock"]
    }
  }
}
EOF
```
```

### Step 3: Set Up TypeScript Configuration

Create `tsconfig.json` in root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true
  },
  "exclude": ["node_modules", "dist"]
}
```

### Step 4: Initialize Shared Package

```bash
cd packages/shared
npm init -y
```

Create `packages/shared/package.json`:

```json
{
  "name": "@summoners-grid/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Create shared types in `packages/shared/src/types/`:

```typescript
// packages/shared/src/types/game.ts
export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  gameId: string;
  turnNumber: number;
  currentPhase: TurnPhase;
  activePlayer: string;
  board: GameBoard;
  players: Map<string, PlayerState>;
}

export interface Card {
  id: string;
  templateId: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  cost: ResourceCost;
  effects: Effect[];
}

// Export all types from index
export * from './game';
export * from './user';
export * from './network';
```

### Step 5: Set Up Game Engine Package

```bash
cd packages/game-engine
npm init -y
```

Create `packages/game-engine/package.json`:

```json
{
  "name": "@summoners-grid/game-engine",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@summoners-grid/shared": "^1.0.0",
    "immutable": "^4.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

Create basic game engine structure:

```typescript
// packages/game-engine/src/GameEngine.ts
import { GameState, PlayerAction, GameEvent } from '@summoners-grid/shared';

export class GameEngine {
  private gameState: GameState;
  
  constructor(initialState: GameState) {
    this.gameState = initialState;
  }
  
  public submitAction(playerId: string, action: PlayerAction): ActionResult {
    // Validate action
    const validation = this.validateAction(playerId, action);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }
    
    // Process action
    const newState = this.processAction(action);
    this.gameState = newState;
    
    return { success: true, newState };
  }
  
  public getGameState(): GameState {
    return this.gameState;
  }
  
  private validateAction(playerId: string, action: PlayerAction): ValidationResult {
    // Implementation will be added in subsequent phases
    return { isValid: true };
  }
  
  private processAction(action: PlayerAction): GameState {
    // Implementation will be added in subsequent phases
    return this.gameState;
  }
}
```

## Phase 2: Database Setup (Week 1)

### Step 1: Database Package Setup

```bash
cd packages/database
npm init -y
```

Create `packages/database/package.json`:

```json
{
  "name": "@summoners-grid/database",
  "version": "1.0.0",
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:reset": "prisma migrate reset",
    "db:seed": "ts-node seeds/index.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "@summoners-grid/shared": "^1.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### Step 2: Initialize Prisma

```bash
cd packages/database
npx prisma init
```

Create `packages/database/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  username    String   @unique
  email       String   @unique
  passwordHash String  @map("password_hash")
  displayName String?  @map("display_name")
  avatarUrl   String?  @map("avatar_url")
  level       Int      @default(1)
  experience  Int      @default(0)
  rating      Int      @default(1000)
  peakRating  Int      @default(1000) @map("peak_rating")
  totalGames  Int      @default(0) @map("total_games")
  gamesWon    Int      @default(0) @map("games_won")
  isActive    Boolean  @default(true) @map("is_active")
  emailVerified Boolean @default(false) @map("email_verified")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  lastLogin   DateTime? @map("last_login")

  // Relationships
  cardInstances CardInstance[]
  decks         Deck[]
  proposedTrades TradeProposal[] @relation("ProposedTrades")
  receivedTrades TradeProposal[] @relation("ReceivedTrades")
  gameSessionsA GameSession[] @relation("PlayerA")
  gameSessionsB GameSession[] @relation("PlayerB")
  wonGames      GameSession[] @relation("Winner")

  @@map("users")
}

model CardTemplate {
  id          String   @id
  name        String
  type        String
  rarity      String
  cost        Json?
  requirements Json?
  effects     Json?
  attributes  Json?
  stats       Json?
  flavorText  String?  @map("flavor_text")
  imageUrl    String?  @map("image_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  cardInstances CardInstance[]

  @@map("card_templates")
}

model CardInstance {
  id               String    @id @default(uuid())
  templateId       String    @map("template_id")
  ownerId          String    @map("owner_id")
  uniqueStats      Json?     @map("unique_stats")
  signature        String    @unique
  signatureChain   String[]  @map("signature_chain")
  acquiredMethod   String    @map("acquired_method")
  acquisitionData  Json?     @map("acquisition_data")
  createdAt        DateTime  @default(now()) @map("created_at")
  lastTransferred  DateTime? @map("last_transferred")

  // Relationships
  template         CardTemplate @relation(fields: [templateId], references: [id])
  owner            User @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ownershipHistory OwnershipHistory[]

  @@map("card_instances")
}

model OwnershipHistory {
  id               String   @id @default(uuid())
  cardInstanceId   String   @map("card_instance_id")
  previousOwnerId  String?  @map("previous_owner_id")
  newOwnerId       String   @map("new_owner_id")
  transferMethod   String   @map("transfer_method")
  transferData     Json?    @map("transfer_data")
  signature        String
  verified         Boolean  @default(false)
  createdAt        DateTime @default(now()) @map("created_at")

  // Relationships
  cardInstance    CardInstance @relation(fields: [cardInstanceId], references: [id], onDelete: Cascade)
  previousOwner   User? @relation("PreviousOwner", fields: [previousOwnerId], references: [id])
  newOwner        User @relation("NewOwner", fields: [newOwnerId], references: [id])

  @@map("ownership_history")
}

model Deck {
  id               String   @id @default(uuid())
  ownerId          String   @map("owner_id")
  name             String
  description      String?
  format           String   @default("3v3")
  summonSlots      Json     @map("summon_slots")
  mainDeck         String[] @map("main_deck")
  advanceDeck      String[] @map("advance_deck")
  isValid          Boolean  @default(false) @map("is_valid")
  validationErrors Json?    @map("validation_errors")
  isPublic         Boolean  @default(false) @map("is_public")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relationships
  owner User @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  @@map("decks")
}

model TradeProposal {
  id                String    @id @default(uuid())
  proposerId        String    @map("proposer_id")
  targetPlayerId    String    @map("target_player_id")
  offeredCards      String[]  @map("offered_cards")
  requestedCards    String[]  @map("requested_cards")
  status            String    @default("pending")
  message           String?
  expiresAt         DateTime  @map("expires_at")
  completedAt       DateTime? @map("completed_at")
  cancellationReason String?  @map("cancellation_reason")
  createdAt         DateTime  @default(now()) @map("created_at")

  // Relationships
  proposer     User @relation("ProposedTrades", fields: [proposerId], references: [id], onDelete: Cascade)
  targetPlayer User @relation("ReceivedTrades", fields: [targetPlayerId], references: [id], onDelete: Cascade)

  @@map("trade_proposals")
}

model GameSession {
  id            String    @id @default(uuid())
  gameId        String    @unique @map("game_id")
  gameMode      String    @map("game_mode")
  format        String    @default("3v3")
  playerAId     String?   @map("player_a_id")
  playerBId     String?   @map("player_b_id")
  winnerId      String?   @map("winner_id")
  status        String    @default("active")
  startTime     DateTime  @default(now()) @map("start_time")
  endTime       DateTime? @map("end_time")
  durationSeconds Int?    @map("duration_seconds")
  ratingChanges Json?     @map("rating_changes")
  gameData      Json?     @map("game_data")
  createdAt     DateTime  @default(now()) @map("created_at")

  // Relationships
  playerA User? @relation("PlayerA", fields: [playerAId], references: [id])
  playerB User? @relation("PlayerB", fields: [playerBId], references: [id])
  winner  User? @relation("Winner", fields: [winnerId], references: [id])

  @@map("game_sessions")
}
```

### Step 3: Environment Configuration

Create `.env` file in root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/summoners_grid?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# API Configuration
API_PORT=3001
GAME_SERVER_PORT=3002
CLIENT_PORT=3000

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

### Step 4: Database Migration

```bash
# Install dependencies
cd packages/database
npm install

# Create and run first migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

## Phase 3: API Server Setup (Week 1)

### Step 1: API Server Package Setup

```bash
cd packages/api-server
npm init -y
```

Create `packages/api-server/package.json`:

```json
{
  "name": "@summoners-grid/api-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@summoners-grid/shared": "^1.0.0",
    "@summoners-grid/database": "^1.0.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.8.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "winston": "^3.10.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "typescript": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### Step 2: Create API Server Structure

Create basic Express server in `packages/api-server/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const app = express();
const port = process.env.API_PORT || 3001;

// Initialize database and cache
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (to be implemented)
app.use('/api/auth', (req, res) => res.json({ message: 'Auth routes coming soon' }));
app.use('/api/users', (req, res) => res.json({ message: 'User routes coming soon' }));
app.use('/api/cards', (req, res) => res.json({ message: 'Card routes coming soon' }));

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
```

## Phase 4: Game Server Setup (Week 1)

### Step 1: Game Server Package Setup

```bash
cd packages/game-server
npm init -y
```

Create `packages/game-server/package.json`:

```json
{
  "name": "@summoners-grid/game-server",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@summoners-grid/shared": "^1.0.0",
    "@summoners-grid/game-engine": "^1.0.0",
    "socket.io": "^4.7.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0",
    "winston": "^3.10.0",
    "ioredis": "^5.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/jsonwebtoken": "^9.0.0",
    "typescript": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### Step 2: Create Basic Game Server

Create `packages/game-server/src/index.ts`:

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameEngine } from '@summoners-grid/game-engine';
import Redis from 'ioredis';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const port = process.env.GAME_SERVER_PORT || 3002;
const redis = new Redis(process.env.REDIS_URL);

// Store active games
const activeGames = new Map<string, GameEngine>();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeGames: activeGames.size,
    timestamp: new Date().toISOString() 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('join_game', (gameId: string) => {
    socket.join(gameId);
    console.log(`Player ${socket.id} joined game ${gameId}`);
  });
  
  socket.on('player_action', (data) => {
    console.log('Player action received:', data);
    // Action processing will be implemented in subsequent phases
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

// Start server
server.listen(port, () => {
  console.log(`Game Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  redis.disconnect();
  server.close();
  process.exit(0);
});
```

## Phase 5: Client Application Setup (Week 1)

### Step 1: React Client Setup

```bash
cd packages/client
npm create vite@latest . -- --template react-ts
```

Update `packages/client/package.json`:

```json
{
  "name": "@summoners-grid/client",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest"
  },
  "dependencies": {
    "@summoners-grid/shared": "^1.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "zustand": "^4.4.0",
    "socket.io-client": "^4.7.0",
    "framer-motion": "^10.16.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Step 2: Configure Tailwind CSS

```bash
cd packages/client
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          primary: '#1a1a2e',
          secondary: '#16213e',
          accent: '#0f3460',
          highlight: '#e94560',
        }
      }
    },
  },
  plugins: [],
}
```

### Step 3: Create Basic React Structure

Create `packages/client/src/App.tsx`:

```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Placeholder components
const HomePage = () => (
  <div className="min-h-screen bg-game-primary text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Summoner's Grid</h1>
      <p className="text-xl">Coming Soon...</p>
    </div>
  </div>
);

const GamePage = () => (
  <div className="min-h-screen bg-game-secondary text-white flex items-center justify-center">
    <h1 className="text-2xl">Game Interface Coming Soon</h1>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

## Development Workflow

### Step 1: Install Dependencies

```bash
# From root directory
npm install

# Install dependencies for all packages
npm run install --workspaces
```

### Step 2: Build All Packages

```bash
# Build shared package first
cd packages/shared && npm run build

# Build game engine
cd ../game-engine && npm run build

# Build database package
cd ../database && npx prisma generate
```

### Step 3: Start Development Environment

Open multiple terminal windows/tabs:

```bash
# Terminal 1: API Server
cd packages/api-server
npm run dev

# Terminal 2: Game Server
cd packages/game-server
npm run dev

# Terminal 3: Client
cd packages/client
npm run dev

# Terminal 4: Database (if needed)
cd packages/database
npx prisma studio
```

### Step 4: Verify Setup

1. **API Server**: Visit `http://localhost:3001/health`
2. **Game Server**: Visit `http://localhost:3002/health`
3. **Client**: Visit `http://localhost:3000`
4. **Database Studio**: Visit `http://localhost:5555`

## Testing Setup

### Step 1: Configure Jest

Create `jest.config.js` in root:

```javascript
module.exports = {
  projects: [
    '<rootDir>/packages/*/jest.config.js'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### Step 2: Package-Specific Test Configuration

Create `jest.config.js` in each package:

```javascript
// packages/game-engine/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

### Step 3: Sample Test

Create `packages/game-engine/src/__tests__/GameEngine.test.ts`:

```typescript
import { GameEngine } from '../GameEngine';

describe('GameEngine', () => {
  it('should initialize with a game state', () => {
    const initialState = {
      gameId: 'test-game',
      turnNumber: 1,
      currentPhase: 'draw' as const,
      activePlayer: 'player1',
      board: {} as any,
      players: new Map()
    };
    
    const engine = new GameEngine(initialState);
    expect(engine.getGameState()).toEqual(initialState);
  });
});
```

## Deployment Preparation

### Step 1: Docker Configuration

Create `Dockerfile` in root:

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/game-engine/package*.json ./packages/game-engine/
COPY packages/api-server/package*.json ./packages/api-server/
COPY packages/game-server/package*.json ./packages/game-server/

RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3001 3002

CMD ["npm", "start"]
```

### Step 2: Environment Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: summoners_grid
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api-server:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@postgres:5432/summoners_grid
      REDIS_URL: redis://redis:6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  game-server:
    build: .
    environment:
      NODE_ENV: production
      REDIS_URL: redis://redis:6379
    ports:
      - "3002:3002"
    depends_on:
      - redis

volumes:
  postgres_data:
```

## Next Steps for Implementation

### Week 2: Core Game Logic
1. Implement complete Game Engine with all mechanics from GDD
2. Add comprehensive card system and effect processing
3. Create game state management and validation
4. Implement stack-based resolution system

### Week 3: Multiplayer Implementation
1. Complete real-time multiplayer game server
2. Implement matchmaking and lobby system
3. Add authentication and session management
4. Create comprehensive API endpoints

### Week 4: User Interface
1. Build complete game UI with board visualization
2. Implement card interaction and animations
3. Create collection and deck building interfaces
4. Add responsive design and accessibility

### Week 5: Advanced Features
1. Implement trading system with digital provenance
2. Add social features and friend systems
3. Create admin tools and analytics
4. Implement comprehensive testing

### Week 6: Polish and Deployment
1. Performance optimization and scaling
2. Security hardening and testing
3. Deployment pipeline and monitoring
4. Documentation and user guides

This setup guide provides a solid foundation for implementing the complete Summoner's Grid architecture. Each step builds upon the previous ones, creating a scalable and maintainable codebase that can grow with the project's needs.