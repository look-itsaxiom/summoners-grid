# Summoner's Grid Game Engine Architecture

This document describes the architecture and implementation of the core game engine for Summoner's Grid, a tactical grid-based RPG card game with a comprehensive TRR (Trigger → Response → Resolution) system.

## Architecture Overview

The engine follows a modular, immutable state architecture with a central event-driven TRR pipeline. Core components are:

### Core Components

1. **GameState** - Immutable state model with serialization
2. **TurnManager** - Turn/phase progression and game flow
3. **EventBus** - Typed event system for all game events
4. **TRR** - Trigger → Response → Resolution pipeline
5. **ActionProcessor** - Action validation and execution
6. **EffectRegistry** - Extensible effect system

### Data Flow

```
Player Action → ActionProcessor → GameState Update → EventBus → TRR Pipeline → Effect Resolution → New GameState
```

## TRR (Trigger → Response → Resolution) System

The TRR system is the heart of the game engine, implementing the stack-based effect resolution defined in the GDD.

### Speed Levels (Fastest to Slowest)

- **Counter** - Can respond to any effect, triggers automatically
- **Reaction** - Can be played during either player's turn  
- **Action** - Only during controller's Action Phase

### Speed Lock Rules

From GDD: Higher speed effects create "Speed Lock" preventing lower speed responses:

- Action → Reaction added: No more Actions until Reaction resolves
- Reaction → Counter added: No Actions or Reactions until Counter resolves
- Counter blocks all lower speeds until it resolves

### Stack Resolution

Effects resolve in **Last-In-First-Out (LIFO)** order with automatic priority windows for player responses.

### Priority System

- **Turn Player**: Has priority during their phases
- **Non-Turn Player**: Gets first response priority to turn player's actions
- **Alternating Priority**: Players alternate opportunities to respond
- **Passing Priority**: When both players pass consecutively, stack begins resolving

## Game State Management

### Immutable State

All state changes create new GameState instances, ensuring:
- Predictable state transitions
- Easy undo/redo capability  
- Deterministic testing
- Safe concurrent access

### State Structure

```typescript
GameState {
  players: Record<PlayerId, Player>
  sharedZones: { inPlay: Card[], gameBoard: Map<coordinate, Summon> }
  turnState: { currentPlayer, phase, turnNumber }
  effectStack: EffectStackEntry[]
  priorityQueue: PriorityWindow[]
  events: GameEvent[]
}
```

### Serialization

Full game state can be serialized to/from JSON for:
- Save/load functionality
- Network synchronization
- State debugging
- Replay systems

## Turn Structure (From GDD)

Each turn consists of four sequential phases:

### 1. Draw Phase
- Draw 1 card from Main Deck (skipped on first turn)
- If Main Deck empty, shuffle Recharge Pile to form new Main Deck
- If both empty, draw attempt fails

### 2. Level Phase  
- All summons controlled by turn player gain 1 level
- Stat recalculation occurs immediately
- HP damage retention: current damage stays the same when max HP increases

### 3. Action Phase
**Core Restrictions:**
- One Turn Summon: Only one summon can be played per turn
- Summon Draws: Playing a summon triggers drawing 3 cards
- One Attack: Each summon can only attack once per turn
- Movement Limit: Up to movement speed per turn (can be split)

### 4. End Phase
- If player has more than 6 cards in hand, discard excess to Recharge Pile
- Turn passes to opponent

## Effect System

### Effect Registry

The EffectRegistry maps effect IDs to resolver functions, enabling:
- **Extensibility**: Add new cards without engine changes
- **Modularity**: Effects can be composed and reused
- **Testing**: Individual effects can be tested in isolation

### Built-in Effects

- `deal_damage` - Deal damage to target summon
- `heal` - Restore HP to target summon  
- `stat_boost` - Temporarily modify summon stats
- `level_up` - Increase summon level
- `weapon_enhancement` - Modify weapon power
- `movement_boost` - Increase movement speed
- `defense_reduction` - Reduce defense value

### Adding New Effects

```typescript
effectRegistry.register({
  id: 'my_new_effect',
  name: 'My New Effect',
  description: 'Does something awesome',
  resolver: (context: EffectContext) => {
    // Implementation here
    return context.gameState.update({...});
  }
});
```

## Zone System (From GDD)

### Player Zones
- **Hand**: Cards available for play (6 card limit at turn end)
- **Main Deck**: Primary draw source, shuffled when searched
- **Advance Deck**: Role advancement cards (separate from hand)
- **Discard Pile**: Spent cards that don't return to deck
- **Recharge Pile**: Spent cards that shuffle back when Main Deck empty
- **Removed from Play**: Defeated summon units (rarely interacted with)

### Default Pile Destinations
- Counter, Building, Quest cards → Discard Pile  
- Action, Reaction cards → Recharge Pile
- Summon cards → Removed from game completely

### Shared Zones
- **In Play Zone**: Active cards affecting game state
- **Game Board**: Physical placement of summons and buildings (12x14 grid)

## Victory Conditions

First player to reach **3 Victory Points** wins:

- **Tier 1 Summon defeat**: 1 VP
- **Tier 2+ Summon defeat**: 2 VP  
- **Direct territory attack**: 1 VP
- **Quest completion**: Variable VP
- **Card effects**: Some cards can grant/remove VP

## Public API

### Game Creation
```typescript
const engine = createGameEngine(config?);
engine.addPlayer(playerId, playerName);
engine.loadDeck(playerId, cards);  
engine.startGame();
```

### Action Processing
```typescript
const actions = engine.getLegalActions(playerId);
engine.submitAction(action);
```

### State Access
```typescript
const state = engine.getState();
const json = engine.serialize();
const restored = loadGameFromJson(json);
```

### Event System
```typescript
const unsubscribe = engine.subscribe('cardPlayed', (event) => {
  console.log('Card played:', event);
});
```

## Extension Guide

### Adding New Card Types

1. Add card interface to `src/types/card.ts`
2. Update the `Card` union type
3. Add validation logic in `ActionProcessor`
4. Create effect resolvers in `EffectRegistry`

### Adding New Effects

1. Register effect resolver with `EffectRegistry`
2. Add to card definitions in JSON data
3. Create tests for the effect

### Adding New Trigger Events

1. Add event type to `EventType` enum
2. Emit event from appropriate game actions
3. Subscribe in TRR system for trigger detection
4. Add trigger matching logic

## Testing

### Test Coverage

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction
- **TRR Tests**: Stack behavior, priority passing, speed lock
- **State Tests**: Immutability, serialization

### Test Structure
```
tests/
  engine.test.ts     - Basic engine functionality
  trr.test.ts        - TRR system behavior
  gamestate.test.ts  - State management
  actions.test.ts    - Action validation/execution
```

### Running Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## TODOs and Implementation Notes

### TODO: Combat System
- Damage calculation formulas from GDD
- Accuracy/dodge mechanics
- Critical hit system
- Status effects and modifiers

### TODO: Stat System  
- Level-based stat calculation
- Equipment stat bonuses
- Temporary stat modifications
- Stat growth rates

### TODO: Board System
- Coordinate validation
- Territory control
- Movement pathfinding
- Attack range calculation

### TODO: Quest System
- Objective tracking
- Success/failure conditions
- Quest completion rewards

### TODO: Trigger System Expansion
- Complex trigger conditions
- Nested trigger resolution
- Replacement effects
- Prevention effects

## Development Notes

### Design Decisions

1. **Immutable State**: Chosen for predictability and debugging
2. **Event-Driven**: Enables loose coupling and extensibility
3. **TypeScript**: Strong typing prevents runtime errors
4. **Modular Architecture**: Each system is independently testable
5. **Data-Driven Cards**: Cards defined as JSON for easy modification

### Performance Considerations

- State updates create new objects (use structural sharing in production)
- Event history grows indefinitely (implement pruning)
- Effect stack depth could grow large (implement limits)

### Extension Points

- **Effect System**: Add new effect types via registry
- **Card Types**: Extend card union and validation
- **Triggers**: Add new trigger events and conditions
- **Validators**: Add custom validation rules
- **Randomization**: Inject random number generators

This engine provides a solid foundation for Summoner's Grid with full TRR system implementation, extensible architecture, and comprehensive testing coverage.