# Summoner's Grid - Game Engine

The Game Engine package provides the core game state management system for Summoner's Grid, implementing all the fundamental mechanics defined in the Game Design Document (GDD).

## Overview

This package implements **Phase 2, Issue #008: Core Game State Management** and provides:

- **Immutable game state management** with comprehensive validation
- **Event-driven game loop architecture** for real-time multiplayer support
- **Turn phase management** (Draw, Level, Action, End phases)
- **Board state tracking** for the 12x14 tactical grid
- **Victory condition checking** with tiebreaker rules
- **Action validation and processing** with detailed error reporting
- **Game state serialization/deserialization** for network transmission
- **Comprehensive testing** with 84 test cases covering all functionality

## Key Features

### 🎯 Core Game Mechanics
- **3v3 Tactical Combat Format**: Full support for the primary game format
- **Turn Structure**: Draw → Level → Action → End phase progression
- **Victory Conditions**: 3 Victory Point target with summon count tiebreakers
- **Board Management**: 12x14 grid with territory control mechanics
- **Player State Tracking**: Hand, deck, discard pile, and active unit management

### 🔧 Technical Architecture
- **Immutable State Updates**: All state changes create new objects for better tracking
- **Event System**: Type-safe event emission and handling for game events
- **Validation Framework**: Comprehensive rule validation for actions and state
- **Error Handling**: Detailed error reporting with actionable feedback
- **Serialization Support**: JSON serialization for network transmission and persistence

### 🚀 Performance & Reliability
- **Efficient State Cloning**: Optimized deep cloning with structural sharing
- **State Comparison**: Fast state diff calculation for change detection
- **Memory Management**: Careful handling of Maps and complex objects
- **Debug Support**: Comprehensive logging and state snapshots

## Architecture

```
src/lib/
├── game-engine.ts           # Main GameEngine orchestrator
├── game-state-validator.ts  # Validation system for rules compliance
├── game-state-manager.ts    # Immutable state management utilities
├── *.spec.ts               # Comprehensive test suites (84 tests)
```

### Core Classes

#### `GameEngine`
The central orchestrator that manages the entire game lifecycle:

```typescript
const engine = new GameEngine({ debugMode: true });
const gameState = engine.initializeGame('game-123', playerA, playerB);

// Submit player actions
const result = engine.submitAction('player-a', action);
if (result.success) {
  console.log('Action applied successfully');
}

// Advance through phases
engine.advancePhase(); // DRAW → LEVEL
engine.advancePhase(); // LEVEL → ACTION
```

#### `GameStateValidator`
Comprehensive validation for game rules and state integrity:

```typescript
// Validate complete game state
const validation = GameStateValidator.validateGameState(gameState);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Validate specific actions
const actionValidation = GameStateValidator.validateAction(action, gameState);
```

#### `GameStateManager`
Immutable state management with utilities for safe updates:

```typescript
// Immutable state updates
const newState = GameStateManager.updatePlayer(gameState, 'A', { 
  victoryPoints: 2 
});

// Move cards between zones
const movedState = GameStateManager.moveCard(gameState, 'A', cardId, 'hand', 'discardPile');

// Compare states for changes
const changes = GameStateManager.compareGameStates(oldState, newState);
```

## Game Design Document Compliance

This implementation strictly follows the Summoner's Grid GDD specifications:

### ✅ Turn Structure
- **Draw Phase**: Card drawing with deck reshuffling logic
- **Level Phase**: Automatic summon leveling with HP damage retention
- **Action Phase**: Card play, movement, attacks, and role advancement
- **End Phase**: Hand size limit enforcement and turn passing

### ✅ Victory Conditions
- **Primary**: First to 3 Victory Points wins
- **Tiebreaker 1**: Player with more active summons wins
- **Tiebreaker 2**: Game ends in draw if summon counts are equal

### ✅ Board Management
- **12x14 Grid**: Coordinate system with (0,0) at bottom-left
- **Territory Control**: Player territories (first/last 3 rows) and contested middle
- **Position Validation**: Boundary checking and occupancy validation
- **Movement Rules**: Diagonal movement allowed with proper distance calculation

### ✅ Player State
- **Hand Management**: 6-card limit with discard to Recharge Pile
- **Deck Zones**: Main Deck, Advance Deck, Discard Pile, Recharge Pile
- **Active Units**: Summons and buildings with position tracking
- **Resource Tracking**: Victory Points, level, experience, rating

## Event System

The engine provides a type-safe event system for real-time game updates:

```typescript
// Listen for game events
engine.addEventListener(GameEventType.PHASE_CHANGED, (event) => {
  console.log(`Phase changed to ${event.data.newPhase}`);
});

engine.addEventListener(GameEventType.GAME_ENDED, (event) => {
  console.log(`Game ended, winner: ${event.data.winner}`);
});
```

### Event Types
- `GAME_STARTED` - Game initialization complete
- `TURN_STARTED` - New turn begins for a player
- `PHASE_CHANGED` - Turn phase transition
- `PLAYER_ACTION` - Player action submitted and processed
- `STATE_CHANGED` - Game state updated
- `GAME_ENDED` - Game completed with winner

## Validation Framework

Comprehensive validation ensures game rule compliance:

### State Validation
- **Structure Integrity**: Required fields and proper data types
- **Rule Compliance**: Victory conditions, hand limits, board constraints
- **Consistency Checks**: Turn/phase alignment, player state validation
- **Position Validation**: Board boundaries and occupancy rules

### Action Validation
- **Authorization**: Player turn and timing validation
- **Requirements**: Action-specific parameter checking
- **Phase Restrictions**: Actions allowed only in appropriate phases
- **Resource Availability**: Card availability and target validation

## Usage Examples

### Basic Game Setup
```typescript
import { GameEngine, GameEventType } from '@summoners-grid/game-engine';

// Create engine with configuration
const engine = new GameEngine({
  debugMode: true,
  format: {
    name: '3v3',
    maxSummons: 3,
    victoryPointTarget: 3,
    handSizeLimit: 6,
  }
});

// Initialize game
const gameState = engine.initializeGame('game-123', playerA, playerB);
console.log(`Game started with ID: ${gameState.gameId}`);
```

### Turn Management
```typescript
// Advance through turn phases
console.log(`Current phase: ${gameState.currentPhase}`); // DRAW

const result1 = engine.advancePhase();
console.log(`Advanced to: ${result1.newGameState.currentPhase}`); // LEVEL

const result2 = engine.advancePhase();
console.log(`Advanced to: ${result2.newGameState.currentPhase}`); // ACTION

// Complete turn
engine.advancePhase(); // ACTION → END
engine.advancePhase(); // END → Next player's DRAW
```

### Action Processing
```typescript
// Submit player actions
const moveAction = {
  id: 'action-123',
  player: 'A',
  turn: 1,
  phase: TurnPhase.ACTION,
  type: 'MOVE_SUMMON',
  fromPosition: { x: 0, y: 0 },
  toPosition: { x: 1, y: 1 },
  timestamp: new Date(),
};

const result = engine.submitAction('player-a', moveAction);
if (result.success) {
  console.log('Summon moved successfully');
} else {
  console.error('Move failed:', result.errors);
}
```

### State Management
```typescript
import { GameStateManager } from '@summoners-grid/game-engine';

// Clone state for safe updates
const newState = GameStateManager.cloneGameState(currentState);

// Update player properties
const updatedState = GameStateManager.updatePlayer(currentState, 'A', {
  victoryPoints: 2,
  level: 5,
});

// Move cards between zones
const cardMovedState = GameStateManager.moveCard(
  currentState, 
  'A', 
  'card-123', 
  'hand', 
  'discardPile'
);
```

### Validation
```typescript
import { GameStateValidator } from '@summoners-grid/game-engine';

// Validate game state
const validation = GameStateValidator.validateGameState(gameState);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  if (validation.warnings) {
    console.warn('Warnings:', validation.warnings);
  }
}

// Validate player action
const actionValidation = GameStateValidator.validateAction(action, gameState);
if (!actionValidation.isValid) {
  return { success: false, errors: actionValidation.errors };
}
```

## Testing

The package includes comprehensive test coverage with 84 test cases:

```bash
# Run all tests
nx test game-engine

# Test specific files
nx test game-engine --testPathPattern=game-engine.spec.ts
nx test game-engine --testPathPattern=game-state-validator.spec.ts
nx test game-engine --testPathPattern=game-state-manager.spec.ts
```

### Test Coverage
- **GameEngine**: 26 tests covering initialization, phase management, actions, events, serialization, victory conditions
- **GameStateValidator**: 31 tests covering state validation, action validation, movement rules, position utilities
- **GameStateManager**: 27 tests covering immutable updates, state comparison, cloning, card management

## Integration with Other Packages

### Dependencies
- `@summoners-grid/shared-types`: Core type definitions and interfaces
- `crypto`: UUID generation for unique game IDs

### Used By
- `@summoners-grid/game-server`: Real-time multiplayer game server
- `@summoners-grid/api-server`: RESTful API for game management
- `@summoners-grid/game-client`: Frontend game client

## Future Enhancements

This core implementation provides the foundation for future features:

1. **Stack-Based Effect Resolution** (Issue #009): Effect stack with priority ordering
2. **Card Effect System** (Issue #010): Dynamic effect processing from card data
3. **Combat System** (Issue #011): Damage calculation and resolution
4. **Movement System** (Issue #012): Advanced pathfinding and positioning

## Building

```bash
# Build the library
nx build game-engine

# Build with dependencies
nx build game-engine --with-deps
```

## Contributing

When contributing to the game engine:

1. **Follow GDD Specifications**: All implementations must align with the Game Design Document
2. **Maintain Immutability**: State changes should create new objects, not mutate existing ones
3. **Add Comprehensive Tests**: New features require test coverage for all edge cases
4. **Validate Against Rules**: Use the validation framework to ensure rule compliance
5. **Document Public APIs**: All public methods should have clear JSDoc documentation

---

This Game Engine implementation successfully completes **Phase 2, Issue #008** and provides a robust foundation for the complete Summoner's Grid tactical card game.
