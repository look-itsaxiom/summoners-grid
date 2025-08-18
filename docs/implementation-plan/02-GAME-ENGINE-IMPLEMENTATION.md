# Summoner's Grid - Game Engine Implementation Plan

## Overview

The Game Engine is the core component responsible for implementing all game mechanics, rules, and logic defined in the Game Design Document. This layer transforms the conceptual game design into a fully functional, rule-enforcing system that can manage game state, validate player actions, and resolve complex interactions.

## Engine Architecture Principles

### Core Design Philosophy
- **Data-Driven**: All game rules, cards, and mechanics defined as structured data
- **Event-Driven**: Actions trigger events that other systems can respond to
- **Immutable State**: Game state changes create new state objects for better tracking
- **Rule Agnostic**: The engine can handle any rule override from card effects
- **Deterministic**: Same inputs always produce same outputs for replay and validation

### Implementation Requirements
- **Stack-Based Resolution**: Effects resolve in Last-In-First-Out order with priorities
- **Universal Rule Override**: Every game rule can be modified by card effects
- **Trigger-Response Chains**: Complex interaction systems with timing windows
- **State Validation**: Comprehensive validation of all game state transitions
- **Replay Support**: Actions can be recorded and replayed for debugging

## Technology Stack

### Core Technologies
- **TypeScript**: Type safety and excellent tooling
- **Immutable.js or Immer**: Immutable state management
- **Zod**: Runtime type validation and schema definition
- **Jest**: Comprehensive testing framework

### Game Engine Specific
- **Custom Event System**: Type-safe event emitter for game events
- **State Machine**: Finite state machine for turn phases and game flow
- **Rules Engine**: Flexible system for defining and overriding game rules
- **Random Number Generator**: Seeded RNG for deterministic gameplay

## Engine Architecture

```
src/
├── core/
│   ├── GameEngine.ts          # Main engine orchestrator
│   ├── GameState.ts           # Game state management
│   ├── ActionResolver.ts      # Action validation and resolution
│   └── EventSystem.ts         # Event emission and handling
├── systems/
│   ├── StackSystem.ts         # Effect stack management
│   ├── TurnSystem.ts          # Turn phase management
│   ├── CombatSystem.ts        # Combat resolution
│   ├── MovementSystem.ts      # Summon movement validation
│   └── TriggerSystem.ts       # Trigger-response handling
├── cards/
│   ├── CardDatabase.ts        # Card definition storage
│   ├── CardFactory.ts         # Dynamic card creation
│   ├── EffectProcessor.ts     # Card effect implementation
│   └── ValidationRules.ts     # Card requirement validation
├── rules/
│   ├── BaseRules.ts           # Core game rules
│   ├── RuleOverrides.ts       # Dynamic rule modification
│   └── GameMechanics.ts       # Mechanical implementations
├── models/
│   ├── Card.ts                # Card data models
│   ├── Summon.ts              # Summon entity models
│   ├── GameBoard.ts           # Board state models
│   └── Player.ts              # Player state models
└── utils/
    ├── RandomGenerator.ts     # Seeded random number generation
    ├── MathUtils.ts           # Game calculation utilities
    └── ValidationUtils.ts     # Common validation functions
```

## Core Engine Components

### 1. Game Engine Orchestrator

**Purpose**: Central coordinator that manages all game systems and state transitions.

**Key Responsibilities**:
- Initialize and configure all game systems
- Coordinate turn phases and state transitions
- Handle player action submission and validation
- Manage game lifecycle (start, pause, end)
- Provide external API for game server integration

**Implementation Approach**:
```typescript
// Example structure (no implementation)
interface GameEngineConfig {
  randomSeed?: string;
  ruleVariants?: RuleVariant[];
  debugMode?: boolean;
}

class GameEngine {
  // Core systems
  private gameState: GameState;
  private stackSystem: StackSystem;
  private turnSystem: TurnSystem;
  private eventSystem: EventSystem;
  
  // Public API
  public submitAction(playerId: string, action: PlayerAction): ActionResult;
  public getGameState(): GameState;
  public addEventListener(event: GameEvent, handler: EventHandler): void;
  
  // Internal coordination
  private processAction(action: PlayerAction): void;
  private validateGameState(): ValidationResult;
  private emitGameEvent(event: GameEvent): void;
}
```

**Design Considerations**:
- Maintain clear separation between systems
- Provide comprehensive logging for debugging
- Support hot-swapping of rule implementations
- Enable save/load of complete game state

### 2. Game State Management

**Purpose**: Immutable state container that represents the complete game state at any point.

**Key Features**:
- Immutable state updates with history tracking
- Efficient state comparison and change detection
- Serializable for network transmission and storage
- Support for state rollback and replay

**Implementation Approach**:
```typescript
// Example state structure
interface GameState {
  // Meta information
  gameId: string;
  turnNumber: number;
  currentPhase: TurnPhase;
  activePlayer: PlayerId;
  
  // Game board
  board: GameBoard;
  summons: Map<SummonId, Summon>;
  buildings: Map<BuildingId, Building>;
  
  // Player states
  players: Map<PlayerId, PlayerState>;
  
  // Game systems
  effectStack: Effect[];
  triggerQueue: Trigger[];
  
  // Rule overrides
  activeRules: RuleSet;
  temporaryModifiers: Modifier[];
}

interface PlayerState {
  playerId: string;
  hand: Card[];
  deckCards: Card[];
  advanceDeck: Card[];
  resources: Resources;
  territories: Position[];
}
```

**Design Considerations**:
- Use structural sharing for efficient memory usage
- Implement deep equality checking for change detection
- Support partial state updates for network efficiency
- Maintain referential integrity between related entities

### 3. Stack-Based Effect Resolution

**Purpose**: Implement the Last-In-First-Out effect resolution system described in the GDD.

**Key Features**:
- Priority-based ordering with speed considerations
- Response window management for reactive cards
- Nested effect handling with proper cleanup
- State tracking throughout resolution

**Implementation Approach**:
```typescript
// Example stack system structure
interface Effect {
  id: string;
  sourceCard: Card;
  castingPlayer: PlayerId;
  targets: Target[];
  priority: number;
  speed: EffectSpeed;
  effect: EffectDefinition;
}

class StackSystem {
  private effectStack: Effect[] = [];
  private resolutionState: ResolutionState;
  
  public addEffect(effect: Effect): void;
  public resolveTop(): EffectResult;
  public canAddResponse(player: PlayerId): boolean;
  public getStackSize(): number;
  
  private sortByPriority(): void;
  private processEffect(effect: Effect): EffectResult;
  private handleCounters(effect: Effect): boolean;
}
```

**Design Considerations**:
- Maintain strict ordering rules for resolution
- Support complex nested effect interactions
- Provide clear feedback about resolution state
- Handle edge cases like infinite loops

### 4. Combat Resolution System

**Purpose**: Handle all combat interactions between summons including damage calculation, special effects, and death resolution.

**Key Features**:
- Accurate damage calculation using GDD formulas
- Critical hit and miss chance calculations
- Range and line-of-sight validation
- Death triggers and cleanup

**Implementation Approach**:
```typescript
// Example combat system structure
interface CombatAction {
  attacker: SummonId;
  target: SummonId;
  weapon?: WeaponCard;
  modifiers: CombatModifier[];
}

class CombatSystem {
  public resolveCombat(action: CombatAction): CombatResult;
  public calculateDamage(attacker: Summon, target: Summon): DamageResult;
  public checkHitChance(attacker: Summon, target: Summon): number;
  public validateRange(attacker: Position, target: Position, range: number): boolean;
  
  private applyCombatModifiers(base: CombatStats, modifiers: Modifier[]): CombatStats;
  private processDeathTriggers(deadSummons: SummonId[]): void;
}
```

**Design Considerations**:
- Implement all formulas exactly as specified in GDD
- Support for complex modifier stacking
- Handle simultaneous damage scenarios
- Provide detailed combat logging

### 5. Card Effect System

**Purpose**: Process and apply all card effects according to their definitions and timing.

**Key Features**:
- Dynamic effect creation from card data
- Template-based effect definitions
- Complex targeting and requirement validation
- Modifier and rule override application

**Implementation Approach**:
```typescript
// Example effect processor structure
interface EffectDefinition {
  type: EffectType;
  parameters: EffectParameters;
  targeting: TargetingRules;
  requirements: Requirement[];
  timing: EffectTiming;
}

class EffectProcessor {
  public processEffect(effect: Effect, gameState: GameState): EffectResult;
  public validateTargets(targeting: TargetingRules, gameState: GameState): Target[];
  public checkRequirements(requirements: Requirement[], gameState: GameState): boolean;
  
  private applyEffectToTargets(effect: EffectDefinition, targets: Target[]): void;
  private modifyGameRules(ruleOverrides: RuleOverride[]): void;
}
```

**Design Considerations**:
- Support for template-based effect definitions
- Flexible targeting system for complex requirements
- Comprehensive requirement validation
- Clear separation between effect types

## Data Models and Type System

### Core Game Entities

```typescript
// Card system types
interface Card {
  id: string;
  templateId: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  cost: ResourceCost;
  requirements: Requirement[];
  effects: EffectDefinition[];
  attributes: Attribute[];
}

interface Summon {
  id: string;
  templateId: string;
  name: string;
  position: Position;
  stats: SummonStats;
  role: RoleCard;
  equipment: Equipment;
  conditions: Condition[];
  owner: PlayerId;
}

interface SummonStats {
  health: number;
  maxHealth: number;
  attack: number;
  magic: number;
  defense: number;
  speed: number;
  movement: number;
  range: number;
}
```

### Game Board and Positioning

```typescript
interface GameBoard {
  width: number; // 12
  height: number; // 14
  cells: BoardCell[][];
  territories: Territory[];
}

interface Position {
  x: number;
  y: number;
}

interface BoardCell {
  position: Position;
  terrain: TerrainType;
  occupant?: SummonId | BuildingId;
  owner?: PlayerId;
}

interface Territory {
  owner: PlayerId;
  cells: Position[];
  type: TerritoryType;
}
```

### Effect and Rule System Types

```typescript
interface Effect {
  id: string;
  sourceId: string;
  type: EffectType;
  priority: number;
  speed: EffectSpeed;
  targets: Target[];
  parameters: EffectParameters;
}

interface RuleOverride {
  ruleId: string;
  modification: RuleModification;
  duration: Duration;
  source: string;
}

interface Trigger {
  id: string;
  event: GameEventType;
  conditions: TriggerCondition[];
  source: string;
  response: EffectDefinition;
}
```

## Implementation Phases

### Phase 1: Core Foundation (Week 1)
1. **Project Setup and Types**
   - Set up TypeScript project with strict configuration
   - Define core type system and interfaces
   - Implement basic data models (Card, Summon, GameState)
   - Create validation schemas with Zod

2. **Basic Game Engine**
   - Implement GameEngine class with basic lifecycle
   - Create immutable GameState management
   - Build simple event system for notifications
   - Add comprehensive logging system

3. **Card System Foundation**
   - Create card database structure
   - Implement card factory for unique card generation
   - Build basic effect definition system
   - Add card requirement validation

### Phase 2: Game Mechanics (Week 2)
1. **Turn and Phase System**
   - Implement turn structure (Draw, Level, Action, End phases)
   - Create phase transition management
   - Add turn order and timing controls
   - Build phase-specific action validation

2. **Board and Movement**
   - Implement 12x14 game board with coordinate system
   - Create movement validation and pathfinding
   - Add territory control mechanics
   - Build position-based effect calculations

3. **Basic Combat System**
   - Implement damage calculation formulas from GDD
   - Create hit chance and critical hit calculations
   - Add range and line-of-sight validation
   - Build death and destruction handling

### Phase 3: Advanced Systems (Week 3)
1. **Stack-Based Resolution**
   - Implement effect stack with priority ordering
   - Create response window management
   - Add speed-based resolution rules
   - Build nested effect handling

2. **Trigger System**
   - Implement event-driven trigger system
   - Create trigger condition evaluation
   - Add timing window management
   - Build complex trigger chains

3. **Rule Override System**
   - Create flexible rule modification system
   - Implement temporary and permanent rule changes
   - Add rule conflict resolution
   - Build rule restoration mechanisms

### Phase 4: Card Effects and Polish (Week 4)
1. **Complete Card Implementation**
   - Implement all Alpha Set card effects
   - Create template system for effect definitions
   - Add complex targeting and requirement systems
   - Build modifier and enhancement systems

2. **Game Flow Integration**
   - Integrate all systems into complete game flow
   - Implement win/loss condition checking
   - Add game state validation and error recovery
   - Create comprehensive action validation

3. **Testing and Optimization**
   - Write comprehensive unit tests for all systems
   - Create integration tests for complete game scenarios
   - Add performance optimization and profiling
   - Implement debugging and development tools

## Validation and Error Handling

### Input Validation
- Validate all player actions against current game state
- Check card play requirements and costs
- Verify targeting rules and restrictions
- Ensure turn phase and timing constraints

### State Validation
- Verify game state consistency after each action
- Check referential integrity between entities
- Validate rule modifications and overrides
- Ensure resource and constraint limits

### Error Recovery
- Graceful handling of invalid actions
- State rollback for critical errors
- Comprehensive error reporting for debugging
- Automatic recovery from temporary inconsistencies

## Testing Strategy

### Unit Testing
- Test individual systems in isolation
- Mock dependencies for focused testing
- Test edge cases and error conditions
- Verify mathematical calculations

### Integration Testing
- Test complete game scenarios from start to finish
- Test complex card interactions and combinations
- Verify stack resolution and trigger chains
- Test rule override scenarios

### Property-Based Testing
- Generate random game states and actions
- Verify invariants hold under all conditions
- Test performance under stress conditions
- Validate serialization and deserialization

## Performance Considerations

### Memory Management
- Use object pooling for frequently created objects
- Implement efficient state change tracking
- Minimize object creation during gameplay
- Use weak references where appropriate

### Computation Optimization
- Cache expensive calculations (pathfinding, targeting)
- Optimize frequent operations (state comparison, validation)
- Use efficient data structures for lookups
- Implement lazy evaluation where possible

### Scalability
- Design for multiple concurrent games
- Minimize shared state between game instances
- Support horizontal scaling of game servers
- Implement efficient game state serialization

## Common Implementation Patterns

### Command Pattern for Actions
```typescript
interface PlayerAction {
  type: ActionType;
  playerId: string;
  parameters: ActionParameters;
  timestamp: number;
}

abstract class ActionHandler {
  abstract validate(action: PlayerAction, state: GameState): ValidationResult;
  abstract execute(action: PlayerAction, state: GameState): GameState;
  abstract undo(action: PlayerAction, state: GameState): GameState;
}
```

### Observer Pattern for Events
```typescript
interface GameEventListener {
  onGameEvent(event: GameEvent): void;
}

class EventSystem {
  private listeners: Map<GameEventType, GameEventListener[]>;
  
  public subscribe(event: GameEventType, listener: GameEventListener): void;
  public unsubscribe(event: GameEventType, listener: GameEventListener): void;
  public emit(event: GameEvent): void;
}
```

### Strategy Pattern for Rules
```typescript
interface RuleStrategy {
  apply(context: RuleContext): RuleResult;
  canApply(context: RuleContext): boolean;
}

class RuleEngine {
  private rules: Map<RuleId, RuleStrategy>;
  
  public addRule(id: RuleId, rule: RuleStrategy): void;
  public removeRule(id: RuleId): void;
  public applyRules(context: RuleContext): RuleResult[];
}
```

## Debugging and Development Tools

### Game State Inspector
- Visual representation of complete game state
- Step-by-step action replay
- State diff visualization
- Export/import game states

### Rule Debugger
- Real-time rule application tracking
- Override visualization and impact analysis
- Performance profiling for rule evaluation
- Conflict detection and resolution tracing

### Effect Stack Visualizer
- Visual representation of effect stack
- Priority and timing visualization
- Response window indicators
- Resolution step-by-step walkthrough

This Game Engine implementation plan provides a comprehensive foundation for implementing all the complex mechanics defined in the Summoner's Grid Game Design Document. The modular architecture allows for iterative development while maintaining the flexibility needed to support the game's "Universal Rule Override" philosophy.