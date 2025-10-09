# Summon Action Mechanics Architecture

## Overview

This document describes the architecture of the game system, which follows SOLID principles for maintainability and extensibility.

**NEW (2024):** The game now uses a **client-server architecture pattern** that separates game state logic from UI logic. See [CLIENT-SERVER-ARCHITECTURE.md](CLIENT-SERVER-ARCHITECTURE.md) for detailed information about the service layer.

## High-Level Architecture

### Service Layer (Game Logic)
The service layer manages the authoritative game state and processes player actions:
- **IGameService**: Interface defining the contract between UI and game logic
- **LocalGameService**: In-process implementation that validates actions and updates state
- **PlayerAction types**: Command pattern for all player inputs
- **GameState**: Complete representation of game state

### UI Layer (Client)
The UI layer handles player interaction and visual representation:
- **GameScene**: Main coordinator that sends actions to service and renders state updates
- **Managers**: Handle display concerns (GridManager, HandManager, UIManager)
- **Card Handlers**: Convert UI interactions into service commands
- **Visual Components**: Render game entities (cards, tokens, UI elements)

## Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     IGameService                            │
│                    (Interface)                               │
│  - initializeGame()                                         │
│  - processAction(action)                                    │
│  - getGameState()                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │ implements
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  LocalGameService                           │
│  (Manages authoritative game state)                         │
│  - Validates player actions                                 │
│  - Updates game state                                       │
│  - Returns state responses                                  │
└───────────────────┬─────────────────────────────────────────┘
                    │ uses
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      GameState                              │
│  - turnNumber, currentPlayer, currentPhase                  │
│  - playerAHand, playerBHand                                 │
│  - placedSummons (Map<string, SummonUnit>)                  │
│  - deck counts, victory points                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        GameScene                            │
│  (Main UI coordinator)                                      │
│  - Sends PlayerActions to service                           │
│  - Receives GameState updates                               │
│  - Syncs UI with state                                      │
└─────────────────┬───────────────────────────────────────────┘
                  │ uses
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                        GameScene                            │
│  (Main game scene - coordinates game flow)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ uses
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  SummonPlayHandler                          │
│  - Handles summon card placement                            │
│  - Manages placed summons collection                        │
│  - Makes tokens interactive                                 │
│  - Shows action menu on click                               │
└─────────────┬────────────────┬──────────────────────────────┘
              │                │
              │ contains       │ uses
              ▼                ▼
    ┌──────────────────┐   ┌──────────────────┐
    │   SummonUnit     │   │ISummonAction     │
    │                  │   │  (Interface)     │
    │  - cardData      │   │                  │
    │  - position      │   │  +getName()      │
    │  - playerId      │   │  +canExecute()   │
    │  - token         │   │  +execute()      │
    │  - hasAttacked   │   └────────┬─────────┘
    │  - movementUsed  │            │
    │                  │            │ implements
    │  +canMove()      │    ┌───────┴────────┐
    │  +canAttack()    │    │                │
    │  +markAttacked() │    ▼                ▼
    │  +useMovement()  │ ┌─────────┐  ┌──────────┐
    └──────────────────┘ │MoveAction│  │AttackAction│
              ▲          └─────────┘  └──────────┘
              │             │              │
              │ uses        │ uses         │ uses
              │             ▼              ▼
    ┌─────────┴──────────────────────────────────┐
    │         SummonActionMenu                   │
    │  (UI Component for action buttons)         │
    │                                             │
    │  +show(onActionSelected)                   │
    │  +hide()                                    │
    │  +isVisible()                               │
    └─────────────────────────────────────────────┘
```

## Component Responsibilities

### GameScene
- Main Phaser scene
- Coordinates overall game flow
- Initializes card handlers
- Manages game state

### SummonPlayHandler
- **Single Responsibility**: Manages summon card placement and interactions
- Maintains collection of placed summons
- Makes summon tokens interactive
- Shows action menu when tokens are clicked
- Executes selected actions

### SummonUnit
- **Single Responsibility**: Represents a placed summon with its state
- Tracks position, ownership, and action state
- Provides query methods for action availability
- Updates state when actions are performed

### ISummonAction (Interface)
- **Interface Segregation**: Minimal interface for actions
- Defines contract for all summon actions
- Enables **Open/Closed Principle**: New actions can be added without modifying existing code

### MoveAction
- **Single Responsibility**: Handles movement logic
- Highlights valid movement cells
- Animates token to new position
- Updates summon state

### AttackAction
- **Single Responsibility**: Handles attack logic
- Currently stubbed (shows notification)
- Will be expanded for target selection and damage

### SummonActionMenu
- **Single Responsibility**: Manages action menu UI
- Creates and displays action buttons
- Filters actions based on availability
- Handles user selection

## Data Flow

### Service-Based Architecture Flow

#### 1. Phase Transition
```
Player clicks "Next Phase"
    ↓
GameScene.handleNextPhase()
    ↓
Creates NextPhaseAction
    ↓
processPlayerAction() → LocalGameService
    ↓
Service validates and updates state
    ↓
Returns GameStateResponse
    ↓
GameScene syncs UI with new state
    ↓
Phase indicator updates, cards drawn
```

#### 2. Placing a Summon
```
Player selects card and clicks grid
    ↓
SummonPlayHandler.onSummonPlaced callback
    ↓
GameScene.onSummonPlacementRequested()
    ↓
Creates PlayCardAction
    ↓
processPlayerAction() → LocalGameService
    ↓
Service validates position and updates state
    ↓
Returns updated state with summon placed
    ↓
GameScene receives response
    ↓
Calls SummonPlayHandler.placeToken()
    ↓
Visual token created and animated
    ↓
Handler syncs with game state
```

#### 3. Moving a Summon
```
Player clicks summon token
    ↓
SummonActionMenu shows
    ↓
Player selects "Move"
    ↓
MoveAction highlights valid cells
    ↓
Player clicks destination
    ↓
MoveAction.onMoveRequested callback
    ↓
GameScene.onSummonMoveRequested()
    ↓
Creates MoveSummonAction
    ↓
processPlayerAction() → LocalGameService
    ↓
Service validates and updates position
    ↓
Returns updated state
    ↓
GameScene receives response
    ↓
Calls MoveAction.moveToken()
    ↓
Visual token animates to new position
```

### Legacy Data Flow (Deprecated)

### 1. Placing a Summon
```
Player clicks card
    ↓
GameScene.onCardSelected()
    ↓
Player clicks "Play Card"
    ↓
GameScene.playSelectedCard()
    ↓
SummonPlayHandler.execute()
    ↓
Player clicks grid cell
    ↓
SummonPlayHandler.placeToken()
    ↓
Creates SummonUnit
    ↓
Makes token interactive
```

### 2. Opening Action Menu
```
Player clicks summon token
    ↓
SummonPlayHandler.onSummonClicked()
    ↓
Creates SummonActionMenu
    ↓
Filters available actions using canExecute()
    ↓
Displays menu with action buttons
```

### 3. Executing an Action
```
Player clicks action button
    ↓
SummonActionMenu.onActionSelected()
    ↓
SummonPlayHandler.executeSummonAction()
    ↓
Action.execute()
    ↓
    ├─ MoveAction: Highlights cells, waits for selection
    │   ↓
    │   Player clicks destination
    │   ↓
    │   Animates token, updates SummonUnit
    │
    └─ AttackAction: Shows notification, marks attacked
        ↓
        SummonUnit.markAttacked()
```

## SOLID Principles in Practice

### Single Responsibility Principle (SRP)
- ✅ Each class has one reason to change
- `LocalGameService`: Manages game state and rules only
- `GameScene`: Coordinates UI and communicates with service only
- `SummonUnit`: Manages summon state only
- `MoveAction`: Handles movement UI/logic only
- `SummonActionMenu`: Manages action menu UI only

### Open/Closed Principle (OCP)
- ✅ System is open for extension, closed for modification
- Add new actions by creating new `PlayerAction` types
- Add new services by implementing `IGameService` (e.g., `RemoteGameService`)
- Add new summon actions by implementing `ISummonAction`
- No need to modify existing service or UI code

### Liskov Substitution Principle (LSP)
- ✅ All implementations can be used interchangeably
- `LocalGameService` can be swapped with `RemoteGameService` or `MockGameService`
- All action implementations work with any `ISummonAction` consumer
- No runtime type checking needed

### Interface Segregation Principle (ISP)
- ✅ Interfaces contain only essential methods
- `IGameService` has focused contract (3 methods)
- `ISummonAction` has minimal interface
- `PlayerAction` types are specific and focused

### Dependency Inversion Principle (DIP)
- ✅ High-level modules depend on abstractions
- `GameScene` depends on `IGameService` interface, not concrete implementation
- `SummonPlayHandler` depends on callback abstractions
- Easy to swap implementations for testing or different environments

## Architecture Benefits

### 1. Separation of Concerns
- **Service Layer**: Pure game logic, no UI dependencies
- **UI Layer**: Pure presentation, no game rules
- Clear boundaries make code easier to understand and maintain

### 2. Testability
- Service can be unit tested without UI
- UI can use `MockGameService` for testing
- Actions can be tested independently
- State changes are predictable and reproducible

### 3. Future Server Support
- `LocalGameService` runs in-process (current)
- Can be replaced with `RemoteGameService` that communicates over network
- UI code remains unchanged
- Easy path to authoritative server

### 4. Maintainability
- Changes to game rules only affect service layer
- Changes to UI only affect presentation layer
- Reduced coupling between components
- Clear responsibilities for each class

## Extension Points

### Adding New Player Actions

1. Create a new `PlayerAction` type:
```typescript
export interface NewGameAction extends PlayerAction {
  type: "NEW_ACTION";
  // action-specific data
}
```

2. Handle in `LocalGameService.processAction()`:
```typescript
case "NEW_ACTION":
  return await this.handleNewAction(action as NewGameAction);
```

3. Create UI interaction in appropriate component
4. Call `processPlayerAction()` from GameScene

### Adding New Summon Actions

1. Create a new class implementing `ISummonAction`:
```typescript
export class DefendAction implements ISummonAction {
  getName(): string { return 'Defend'; }
  canExecute(summon: SummonUnit): boolean { /* logic */ }
  execute(summon: SummonUnit, scene: Phaser.Scene, onComplete: Function): void {
    /* implementation */
  }
}
```

2. Register in `SummonPlayHandler` constructor:
```typescript
this.availableActions = [
  new MoveAction(this.grid, this.placedSummons),
  new AttackAction(),
  new DefendAction() // Add here
];
```

### Adding Remote Service Support

Create a `RemoteGameService` implementation:
```typescript
export class RemoteGameService implements IGameService {
  async processAction(action: AnyPlayerAction): Promise<GameStateResponse> {
    const response = await fetch('/api/game/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });
    return response.json();
  }
  
  async getGameState(): Promise<GameState> {
    const response = await fetch('/api/game/state');
    return response.json();
  }
  
  async initializeGame(): Promise<GameState> {
    const response = await fetch('/api/game/init', { method: 'POST' });
    return response.json();
  }
}
```

Then swap in GameScene:
```typescript
// Change from:
this.gameService = new LocalGameService();
// To:
this.gameService = new RemoteGameService();
```

### Extending SummonUnit State

Add new properties and methods to track additional state:
```typescript
export class SummonUnit {
  // Existing properties...
  private isDefending: boolean = false;
  
  public canDefend(): boolean {
    return !this.isDefending;
  }
  
  public markDefending(): void {
    this.isDefending = true;
  }
}
```

## Testing Strategy

### Unit Testing
- Test each action class independently
- Mock `SummonUnit` for testing action logic
- Mock Phaser scene for UI testing

### Integration Testing
- Test `SummonPlayHandler` with real actions
- Verify action menu shows correct actions
- Verify state updates correctly

### Manual Testing
- See [TESTING.md](TESTING.md) for comprehensive testing guide
- Use [demo-actions.js](demo-actions.js) for automated browser testing

## Performance Considerations

### Event Handler Management
- Handlers are properly cleaned up after action completes
- No memory leaks from unremoved event listeners

### Object Pooling (Future)
- Consider pooling highlight rectangles for move action
- Consider pooling menu containers

### State Management
- Summon state is centralized in `SummonUnit`
- Efficient lookup using Map for position-based queries

## Bug Fixes and Improvements

### Multiple Summon Selection Fix

**Issue:** Previously, users could select two summons simultaneously and accidentally move them both to the same location.

**Root Cause:**
1. User clicks first summon and selects "Move"
2. Before completing the move, user clicks second summon
3. Both move actions became active simultaneously
4. Clicking a destination would move both summons to the same location

**Solution Implemented:**

1. **Added `cancel()` method to ISummonAction interface:**
```typescript
export interface ISummonAction {
  getName(): string;
  canExecute(summon: SummonUnit): boolean;
  execute(...): void;
  cancel?(): void;  // Optional method for cleanup
}
```

2. **Implemented cancel() in MoveAction:**
```typescript
export class MoveAction implements ISummonAction {
  private isActive: boolean = false;
  private currentScene: Phaser.Scene | null = null;
  
  cancel(): void {
    if (this.isActive && this.currentScene) {
      this.cleanup(this.currentScene); // Removes handlers and UI
      this.isActive = false;
      this.currentScene = null;
    }
  }
}
```

3. **Track active action in SummonPlayHandler:**
```typescript
export class SummonPlayHandler {
  private activeAction: ISummonAction | null = null;
  
  private onSummonClicked(scene: Phaser.Scene, summon: SummonUnit): void {
    // Cancel any active action before showing new menu
    if (this.activeAction && this.activeAction.cancel) {
      this.activeAction.cancel();
      this.activeAction = null;
    }
    // ... show new menu
  }
}
```

**What Gets Cleaned Up:**
- ✅ Green highlight rectangles are destroyed
- ✅ Instruction text is removed
- ✅ Grid cell event handlers are removed
- ✅ Cell stroke styles are reset
- ✅ Action is marked as inactive

**Verification:**
The fix ensures only one action can be active at a time. When a new action starts, any previous action is properly canceled and cleaned up. See [TESTING.md](TESTING.md) for test scenarios.

## Future Architecture Enhancements

### Authoritative Server
- Replace `LocalGameService` with `RemoteGameService`
- Server validates all actions
- Multiple clients stay synchronized
- Prevents cheating and ensures fair play

### State Synchronization
- WebSocket connection for real-time updates
- Server broadcasts state changes to all clients
- Optimistic UI updates with rollback on rejection
- Spectator mode support

### Replay System
- Record all `PlayerAction` commands
- Replay games from action history
- Analysis and debugging tools
- Share replays with other players

### Advanced Features
- AI opponent using service interface
- Tournament mode with multiple games
- Statistics and analytics
- Leaderboards and rankings

For detailed information about the client-server architecture, see [CLIENT-SERVER-ARCHITECTURE.md](CLIENT-SERVER-ARCHITECTURE.md).
