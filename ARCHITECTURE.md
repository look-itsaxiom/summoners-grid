# Summon Action Mechanics Architecture

## Overview

This document describes the architecture of the summon action system, which follows SOLID principles for maintainability and extensibility.

## Class Diagram

```
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
- `SummonUnit`: Changes only if summon state model changes
- `MoveAction`: Changes only if movement rules change
- `AttackAction`: Changes only if attack mechanics change
- `SummonActionMenu`: Changes only if UI requirements change

### Open/Closed Principle (OCP)
- ✅ System is open for extension, closed for modification
- Add new actions by creating new classes implementing `ISummonAction`
- No need to modify `SummonPlayHandler` or `SummonActionMenu`
- Example: Adding a "Defend" action:
  ```typescript
  export class DefendAction implements ISummonAction {
    getName(): string { return 'Defend'; }
    canExecute(summon: SummonUnit): boolean { return true; }
    execute(summon: SummonUnit, scene: Phaser.Scene, onComplete: Function): void {
      // Defend logic here
    }
  }
  ```

### Liskov Substitution Principle (LSP)
- ✅ All action implementations can be used interchangeably
- `SummonPlayHandler` works with any `ISummonAction`
- No need to check action type at runtime

### Interface Segregation Principle (ISP)
- ✅ Interface contains only essential methods
- Actions only implement what they need
- No "fat interfaces" with unused methods

### Dependency Inversion Principle (DIP)
- ✅ High-level modules depend on abstractions
- `SummonPlayHandler` depends on `ISummonAction` interface
- Not dependent on concrete `MoveAction` or `AttackAction` classes
- Actions can be swapped or mocked for testing

## Extension Points

### Adding New Actions

1. Create a new class implementing `ISummonAction`:
```typescript
export class NewAction implements ISummonAction {
  getName(): string { return 'New Action'; }
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
  new NewAction() // Add here
];
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
- See [TESTING_SUMMON_ACTIONS.md](TESTING_SUMMON_ACTIONS.md)
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

## Future Architecture Enhancements

1. **Action Queue System**: For managing multiple actions in sequence
2. **Action Validation Service**: Centralized validation logic
3. **Action History**: For undo/redo functionality
4. **Animation Manager**: Centralized animation handling
5. **State Machine**: For managing summon states (idle, moving, attacking, etc.)
