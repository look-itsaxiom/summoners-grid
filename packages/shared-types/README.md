# @summoners-grid/shared-types

This package provides comprehensive TypeScript definitions for the Summoner's Grid tactical card game, implementing all types required for the game engine, API, and real-time multiplayer communication.

## Overview

The shared types package implements **Phase 1 - Task 006** from the GitHub Issues breakdown, providing:

- **Core Game State Types**: Complete game mechanics representation
- **API Request/Response Types**: RESTful endpoint definitions  
- **WebSocket Message Types**: Real-time multiplayer communication
- **Zod Validation Schemas**: Runtime validation for all types

## Package Structure

```
src/
├── lib/
│   ├── shared-types.ts     # Core game types and interfaces
│   ├── api-types.ts        # API request/response definitions
│   ├── websocket-types.ts  # Real-time message types
│   ├── validation.ts       # Zod schemas and validation utilities
│   └── shared-types.spec.ts # Comprehensive test suite
└── index.ts                # Package exports
```

## Core Features

### 🎮 Game State Management

- **12x14 Grid Board**: Complete positional system with territory control
- **Turn Structure**: Draw, Level, Action, End phases
- **Victory Conditions**: 3 Victory Point system with multiple sources
- **Player State**: Hand management, deck configuration, active entities

### 🃏 Card System

- **Complete Card Types**: All 11 card types from the GDD
- **Digital Provenance**: Cryptographic signatures and ownership chains
- **Effect System**: Universal rule override with stack-based resolution
- **Equipment System**: 4-slot equipment with stat modifications

### ⚔️ Combat & Positioning

- **Grid-Based Movement**: Diagonal movement with distance calculation
- **Elemental System**: 8 attributes with advantage/resistance
- **Status Effects**: Temporary modifications and conditions
- **Combat Actions**: Attack, movement, abilities, and targeting

### 🔄 Role Advancement

- **3-Tier Progression**: Warrior, Magician, Scout family trees
- **Cross-Family Paths**: Paladin accessible from multiple paths
- **Stat Modifiers**: Role-based bonuses and abilities
- **Dynamic Progression**: Mid-game strategic pivots

## API Integration

### Authentication
```typescript
interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  refreshToken?: string;
}
```

### Collection Management
```typescript
interface GetCollectionRequest {
  cardType?: CardType;
  rarity?: Rarity;
  search?: string;
  sortBy?: 'name' | 'rarity' | 'type';
}
```

### Deck Building
```typescript
interface DeckConfiguration {
  summonSlots: [SummonSlot, SummonSlot, SummonSlot]; // Exactly 3
  mainDeck: CardInstance[];
  advanceDeck: CardInstance[];
}
```

## Real-Time Multiplayer

### Game Actions
```typescript
type ClientMessage = 
  | PlayCardMessage
  | MoveSummonMessage  
  | AttackMessage
  | UseAbilityMessage;
```

### State Synchronization
```typescript
interface GameStateUpdateMessage {
  type: 'GAME_STATE_UPDATE';
  data: {
    gameState: GameState;
    updateReason: 'TURN_CHANGE' | 'ACTION_RESOLVED';
  };
}
```

## Validation System

### Runtime Validation
```typescript
import { validateApiRequest, RegisterRequestSchema } from '@summoners-grid/shared-types';

const result = validateApiRequest(RegisterRequestSchema, requestData);
if (result.success) {
  // Use result.data with full type safety
} else {
  // Handle result.errors
}
```

### Game Rule Validation
```typescript
import { validateDeckComposition, validateMovementPath } from '@summoners-grid/shared-types';

// Validate 3v3 deck format
const deckValidation = validateDeckComposition(deck);

// Validate movement within speed limits
const movementValidation = validateMovementPath(path, maxMovement);
```

## Design Principles

### ✅ GDD Alignment
- **100% GDD Compliance**: Every type matches game design specifications
- **No Assumptions**: Implementation strictly follows documented mechanics
- **Future-Proof**: Extensible for planned expansion features

### ✅ Type Safety
- **Comprehensive Coverage**: All game entities and interactions
- **Runtime Validation**: Zod schemas prevent invalid data
- **Error Handling**: Detailed validation messages

### ✅ Performance
- **Efficient Structures**: Optimized for game engine operations
- **Minimal Overhead**: Lightweight validation and serialization
- **Memory Conscious**: Appropriate data structures for real-time use

## Dependencies

- **zod**: Runtime validation and schema definition
- **typescript**: Type definitions and compilation

## Usage

```typescript
import {
  // Core game types
  GameState, Player, Position, CardInstance,
  
  // API types  
  RegisterRequest, AuthResponse, GetCollectionRequest,
  
  // WebSocket types
  PlayCardMessage, GameStateUpdateMessage,
  
  // Validation
  validateApiRequest, validatePosition
} from '@summoners-grid/shared-types';
```

## Testing

The package includes comprehensive test coverage:

```bash
npm test  # Run all validation tests
```

**Test Coverage:**
- ✅ Core game type creation and validation
- ✅ API request/response structure validation  
- ✅ WebSocket message format validation
- ✅ Zod schema validation with edge cases
- ✅ Game rule validation (movement, deck composition)
- ✅ Error handling and malformed data

## Integration Points

This package serves as the foundation for:

- **Game Engine** (`@summoners-grid/game-engine`): Core game logic implementation
- **API Server**: RESTful endpoints with validated request/response
- **Game Client**: Real-time UI with WebSocket communication
- **Database Layer**: Type-safe Prisma integration

## Future Expansion

The type system is designed to support planned GDD features:

- **Multiple Formats**: Beyond 3v3 tactical combat
- **Advanced Roles**: Additional tier 3 and unique roles  
- **Enhanced Equipment**: Complex equipment interactions
- **Campaign Mode**: Single-player progression content
- **Auction House**: Player-to-player trading system

---

_This implementation provides the complete type foundation for Summoner's Grid, ensuring type safety and GDD compliance across all game systems._
