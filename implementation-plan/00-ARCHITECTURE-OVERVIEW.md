# Summoner's Grid - Master Architecture Overview

## Project Vision

Summoner's Grid is a tactical grid-based RPG card game designed for competitive multiplayer online play. This document outlines the complete technical architecture to bring the game from design concept to a fully playable browser-based experience suitable for itch.io hosting.

## Architecture Principles

### Core Design Drivers
- **Browser-First**: Fully playable in web browsers without downloads
- **TypeScript Ecosystem**: Consistent language across all server components
- **Modular Design**: Clear separation of concerns between layers
- **Scalable Foundation**: Architecture supports growth from MVP to full feature set
- **Developer Accessibility**: Entry-level developers can contribute with clear guidance

### Technical Constraints
- **Hosting Platform**: Must deploy easily to itch.io and similar platforms
- **No Client Installation**: Pure web application approach
- **Real-time Multiplayer**: Support for live 3v3 tactical battles
- **Digital Provenance**: Cryptographic card ownership and trading verification
- **Complex Game Logic**: Stack-based effect resolution and rule overrides

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Game UI       │  │  Game Client    │  │   Asset      │ │
│  │   (React/Vue)   │  │   Engine        │  │  Management  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   WebSocket/HTTP   │
                    └─────────┬─────────┘
┌─────────────────────────────┼─────────────────────────────────┐
│                    GAME SERVER LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Game Server   │  │  Game Engine    │  │  Matchmaking │ │
│  │   (Node.js/TS)  │  │   Core Logic    │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    REST/GraphQL    │
                    └─────────┬─────────┘
┌─────────────────────────────┼─────────────────────────────────┐
│                   BACKEND API LAYER                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  User Service   │  │  Card Service   │  │   Trading    │ │
│  │  (Express/TS)   │  │  (Express/TS)   │  │   Service    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────┼─────────────────────────────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   PostgreSQL    │  │      Redis      │  │  File Storage│ │
│  │   (Primary DB)  │  │    (Caching)    │  │   (Assets)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Stack
- **Game Client**: Phaser.js 3.70+ with TypeScript for core gameplay
- **UI Framework**: React 18+ with TypeScript for overlays and menus
- **State Management**: Zustand for UI state, Phaser Data Manager for game state
- **Styling**: Tailwind CSS + Framer Motion for UI animations
- **Build Tool**: Vite for fast development and optimized builds
- **WebSocket Client**: Socket.IO client for real-time communication
- **Audio**: Howler.js for advanced audio management

### Game Server Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Game Server Framework**: Socket.IO for real-time communication
- **Game Engine**: Custom TypeScript engine with event-driven architecture
- **Validation**: Zod for runtime type checking
- **Testing**: Jest + Supertest for comprehensive testing

### Backend API Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Web Framework**: Express.js with TypeScript
- **API Layer**: REST with optional GraphQL for complex queries
- **Authentication**: JWT with refresh token rotation
- **Validation**: Zod for request/response validation

### Data Stack
- **Primary Database**: PostgreSQL 15+ for relational data
- **Cache Layer**: Redis 7+ for session management and game state caching
- **ORM**: Prisma for type-safe database access
- **File Storage**: Local file system (itch.io compatible) or cloud storage
- **Migrations**: Prisma migrations for database versioning

### DevOps & Deployment
- **Package Manager**: npm or pnpm for consistent dependencies
- **Monorepo Tool**: Nx or Lerna for multi-package management
- **Build System**: Docker for containerization
- **Process Management**: PM2 for production deployment
- **Monitoring**: Simple logging with Winston

## Project Structure

**Monorepo Organization**: The project uses a monorepo structure to enable code sharing and coordinated development across all components. For detailed setup instructions including advanced tooling options (Nx, Lerna), see the [Project Setup Guide](./06-PROJECT-SETUP-GUIDE.md).

```
summoners-grid/
├── packages/
│   ├── game-client/             # Phaser.js game client + React UI
│   ├── game-engine/            # Core game logic (shared)
│   ├── game-server/            # Real-time multiplayer server
│   ├── api-server/             # Backend API services
│   ├── database/               # Database schemas and migrations
│   └── shared/                 # Common types and utilities
├── assets/                     # Game assets (images, sounds, etc.)
├── docs/                       # Implementation guides
├── tools/                      # Development and build tools
└── deployment/                 # Deployment configurations
```

## Implementation Phases

**For detailed task breakdown**: See the [GitHub Issues Breakdown](./07-GITHUB-ISSUES-BREAKDOWN.md) which provides 35 specific, actionable issues with priority levels, sizing estimates, and team assignments.

### Phase 1: Foundation (Weeks 1-2)
- Set up monorepo structure with advanced tooling (Nx or Lerna)
- Implement basic game engine with card data models
- Create Phaser.js client with React UI overlay architecture
- Establish database schema and basic API endpoints

### Phase 2: Core Game (Weeks 3-6)
- Implement complete game engine with all mechanics
- Build Phaser.js game client with React HUD overlays
- Create real-time multiplayer game server with Socket.IO
- Implement user authentication and basic card management

### Phase 3: Full Feature Set (Weeks 7-10)
- Complete card collection and trading system
- Implement advanced UI features and animations
- Add comprehensive matchmaking and game lobbies
- Create digital provenance and ownership tracking

### Phase 4: Polish & Deployment (Weeks 11-12)
- Performance optimization and testing
- Deployment pipeline setup
- Documentation and user guides
- Final testing and bug fixes

## Key Design Decisions

### Why TypeScript Everywhere?
- **Type Safety**: Catch errors at compile time across all layers
- **Developer Experience**: Excellent tooling and IDE support
- **Code Sharing**: Common types and logic between frontend and backend
- **Team Scalability**: Easier onboarding for new developers

### Why This Architecture?
- **Separation of Concerns**: Each layer has clear responsibilities
- **Scalability**: Individual services can be scaled independently
- **Maintainability**: Modular design allows focused development
- **Testability**: Clear interfaces enable comprehensive testing

### Hosting Strategy for itch.io
- **Static Frontend**: React build deployable as static files
- **Serverless-Ready**: API designed to work with various hosting options
- **Database Flexibility**: Can use managed PostgreSQL or SQLite for smaller deployments
- **Asset Management**: Optimized for itch.io's file serving capabilities

## Cross-Layer Communication

### Client ↔ Game Server
- **WebSocket**: Real-time game state updates and player actions
- **Message Types**: Strictly typed events with Zod validation
- **State Synchronization**: Authoritative server with client prediction

### Game Server ↔ Backend API
- **REST API**: Stateless communication for user data and card management
- **Service Discovery**: Simple configuration-based service location
- **Data Flow**: Game results flow back to persistent storage

### Client ↔ Backend API
- **HTTP/HTTPS**: Standard REST API for account management and card collection
- **Authentication**: JWT tokens with secure refresh mechanism
- **Rate Limiting**: Protect against abuse while maintaining responsiveness

## Next Steps

The following documents provide detailed implementation plans for each layer:

1. **[Game UI Implementation Plan](./01-GAME-UI-IMPLEMENTATION.md)** - Frontend architecture and user interface
2. **[Game Engine Implementation Plan](./02-GAME-ENGINE-IMPLEMENTATION.md)** - Core game logic and mechanics
3. **[Game Server Implementation Plan](./03-GAME-SERVER-IMPLEMENTATION.md)** - Real-time multiplayer server
4. **[Backend API Implementation Plan](./04-BACKEND-API-IMPLEMENTATION.md)** - User management and card services
5. **[Data Layer Implementation Plan](./05-DATA-LAYER-IMPLEMENTATION.md)** - Database design and data access
6. **[Project Setup Guide](./06-PROJECT-SETUP-GUIDE.md)** - Step-by-step implementation roadmap
7. **[GitHub Issues Breakdown](./07-GITHUB-ISSUES-BREAKDOWN.md)** - Detailed implementation tasks and project management

## Implementation Management

For detailed project management and task breakdown, see the **[GitHub Issues Breakdown](./07-GITHUB-ISSUES-BREAKDOWN.md)** which provides:
- 35 detailed GitHub issues covering the entire implementation
- Clear priority levels, sizing, and team assignments
- Dependencies and critical path analysis
- Milestone planning and resource allocation recommendations
- Issue templates and management guidelines

This granular breakdown enables effective project management and parallel development across multiple team members.

Each document contains actionable steps suitable for entry-level developers, with clear examples and best practices for implementing the Summoner's Grid architecture.