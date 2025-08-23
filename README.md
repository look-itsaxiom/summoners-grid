# Summoner's Grid

A tactical grid-based RPG card game with a fantasy theme designed for competitive multiplayer online play. Players collect unique cards, build strategic decks, and engage in turn-based combat using a comprehensive effect system with stack-based resolution.

## 🎮 Game Overview

**Summoner's Grid** is a strategic card game that combines:
- **3v3 Tactical Combat**: Players field up to 3 summons on a 12×14 grid battlefield
- **Digital Provenance**: Unique cards with cryptographic signatures and ownership tracking
- **Role Advancement**: Complex progression system allowing summons to advance through role trees
- **Stack-Based Effects**: Rich card interactions with Last-In-First-Out resolution
- **Real-time Multiplayer**: WebSocket-based gameplay with authoritative server

## 🚀 Current Status (December 2024)

### ✅ Working Core Systems
- **Game Engine**: Complete with stack-based effect resolution (140 tests passing)
- **Database**: Prisma schema with digital provenance and card ownership tracking
- **Authentication**: JWT-based auth system with secure token management
- **Authentication UI**: Complete login/registration interface with user management
- **Matchmaking**: Basic queue-based matchmaking with WebSocket integration
- **Card System**: Full Alpha card set support with effect parsing and resolution
- **Shared Types**: Comprehensive type definitions for all game systems

### 🔄 In Development
- **Game Client**: Phaser.js implementation exists but has integration issues
- **Game Board**: 12×14 grid visualization implemented but not fully testable
- **Card Rendering**: Frontend card display system partially implemented

### ❌ Not Yet Implemented
- Combat resolution system
- Movement and positioning mechanics
- React UI overlays
- Real-time client synchronization
- Advanced game features (equipment, trading, etc.)

## 🏗️ Architecture

This project uses an **Nx monorepo** with the following packages:

```
apps/
├── api-server/          # REST API server (Express.js)
├── game-server/         # WebSocket game server (Socket.IO)
├── game-client/         # React + Phaser.js game client
└── game-client-e2e/     # End-to-end tests

packages/
├── shared-types/        # TypeScript definitions shared across apps
├── game-engine/         # Core game logic and rules engine
└── database/           # Prisma schema and database utilities
```

### Technology Stack
- **Backend**: Node.js, Express.js, Socket.IO, Prisma, PostgreSQL, Redis
- **Frontend**: React, Phaser.js, TypeScript
- **Infrastructure**: Docker, Nx, Jest, ESLint, Prettier

## 🔐 Authentication System

The game features a comprehensive authentication system that provides secure user management:

### Features
- **Secure Registration & Login**: JWT-based authentication with HTTP-only refresh tokens
- **User Profile Management**: Display user stats, level, rating, and game history
- **Protected Routes**: Automatic authentication flow with session persistence
- **Token Management**: Automatic refresh every 30 minutes with fallback handling
- **Form Validation**: Real-time validation with comprehensive error handling
- **Responsive Design**: Mobile-friendly interface matching the game's fantasy theme

### User Interface
- **Login Form**: Username/password authentication with show/hide password toggle
- **Registration Form**: Comprehensive signup with email verification and password strength validation
- **User Profile**: In-game overlay showing user statistics and account management
- **Logout Options**: Single device logout or logout from all devices

The authentication UI automatically appears when users access the game, ensuring secure access to all game features while maintaining a seamless user experience.

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/look-itsaxiom/summoners-grid.git
   cd summoners-grid
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start infrastructure services**
   ```bash
   docker-compose up -d postgres redis
   ```

4. **Run database setup**
   ```bash
   # Set up environment variables (copy .env.example to .env)
   cp .env.example .env
   
   # Run database migrations (if database is available)
   npx nx run @summoners-grid/database:migrate
   ```

5. **Start development servers**
   ```bash
   # Start API server (for authentication and backend services)
   npx nx serve @summoners-grid/api-server
   
   # Start game client (includes authentication UI)
   npx nx serve @summoners-grid/game-client
   ```

6. **Run tests to verify setup**
   ```bash
   # Run all working tests (excludes failing game-client tests)
   npx nx run @summoners-grid/shared-types:test
   npx nx run @summoners-grid/game-engine:test
   npx nx run @summoners-grid/database:test
   npx nx run @summoners-grid/game-server:test
   npx nx run @summoners-grid/api-server:test
   ```

### Development Commands

```bash
# Start API server
npx nx serve @summoners-grid/api-server

# Start game server (WebSocket)
npx nx serve @summoners-grid/game-server

# Start game client (currently has issues)
npx nx serve @summoners-grid/game-client

# Run specific package tests
npx nx test @summoners-grid/game-engine

# Build all packages
npx nx run-many --target=build --all

# View project dependency graph
npx nx graph
```

## 🧪 Testing

The project has comprehensive test coverage for working systems:

- **Shared Types**: 42 tests passing (utilities, types, validation)
- **Game Engine**: 140 tests passing (game state, effects, stack system)
- **Database**: 8 tests passing (digital provenance, signatures)
- **Game Server**: 9 tests passing (WebSocket, auth, matchmaking)
- **API Server**: 23 tests passing (authentication, endpoints)

**Known Issue**: Game client tests fail due to Phaser.js Canvas/WebGL context issues in headless environment.

## 🎯 Game Design

The game implements the mechanics described in:
- `Summoner's Grid GDD.md` - Complete game design document
- `Alpha Cards.md` - Full 42-card Alpha set with effects
- `Summoner's Grid Play Example.md` - Detailed gameplay walkthrough

### Key Game Features
- **12×14 Grid Board**: Tactical positioning with territory control
- **Role System**: Three-family progression trees (Warrior/Scout/Magician)
- **Card Effects**: Universal rule override system with complex interactions
- **Digital Ownership**: Cryptographic card verification and trading

## 🤝 Contributing

We welcome contributions! The project has a solid foundation but needs help with:

### High Priority
1. **Fix Phaser.js Integration**: Resolve Canvas/WebGL context issues preventing client tests
2. **Combat System**: Implement damage calculation and resolution
3. **Movement System**: Add grid-based movement validation and pathfinding
4. **UI Integration**: Connect React overlays with Phaser game scenes

### Medium Priority
- Complete game client frontend
- Real-time state synchronization
- Game UI and UX improvements
- Performance optimization

### Getting Started Contributing

1. **Read the Documentation**
   - Review `docs/implementation-plan/07-GITHUB-ISSUES-BREAKDOWN.md` for detailed task breakdown
   - Understand the GDD for game mechanics

2. **Set up Development Environment**
   - Follow the development setup above
   - Ensure all working tests pass

3. **Pick an Issue**
   - Check GitHub Issues for available tasks
   - Start with issues marked as "good first issue"

4. **Development Workflow**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature-name
   
   # Make changes and test frequently
   npx nx test <package-name>
   
   # Ensure all working tests still pass
   npm run test:all-working
   
   # Submit pull request
   ```

## 📋 Project Status Summary

| Component | Status | Tests | Notes |
|-----------|--------|-------|-------|
| Game Engine | ✅ Complete | 140/140 | Stack effects, card system working |
| Database | ✅ Complete | 8/8 | Prisma schema, digital provenance |
| Shared Types | ✅ Complete | 42/42 | Comprehensive type system |
| API Server | ✅ Complete | 23/23 | Authentication, REST endpoints |
| Game Server | ✅ Complete | 9/9 | WebSocket, matchmaking |
| Authentication UI | ✅ Complete | Visual | Login/register forms, user profile |
| Game Client | 🔄 Issues | 0/2 | Phaser.js integration problems |

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Game Design Document](./Summoner's%20Grid%20GDD.md)
- [Implementation Plan](./docs/implementation-plan/07-GITHUB-ISSUES-BREAKDOWN.md)
- [Alpha Card Set](./Alpha%20Cards.md)
- [Play Example](./Summoner's%20Grid%20Play%20Example.md)
