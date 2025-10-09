# Client-Server Architecture Separation

## Overview

This document describes the refactored architecture that separates game state logic from UI logic, preparing for eventual server-based gameplay.

## Architecture Principles

### Separation of Concerns

1. **Service Layer (Game Logic)**
   - Manages authoritative game state
   - Processes player actions
   - Validates game rules
   - Returns updated state to UI

2. **UI Layer (Client)**
   - Accepts player input
   - Sends commands to service
   - Receives game state updates
   - Renders visual representation
   - Manages user interactions

### Communication Pattern

```
Player Input → UI Layer → PlayerAction Command → Game Service
                                                       ↓
                                              Process & Validate
                                                       ↓
UI Layer ← GameStateResponse ← Updated GameState ←────┘
   ↓
Render Updates
```

## Key Components

### Service Layer

#### IGameService
Interface defining the contract between UI and game logic. This abstraction allows for multiple implementations:
- `LocalGameService`: In-process implementation (current)
- `RemoteGameService`: Future network-based implementation
- `MockGameService`: For testing

#### GameState
Complete representation of game state including:
- Turn number and current player
- Current phase
- Player hands
- Placed summons
- Deck counts
- Victory points

#### PlayerAction Types
Command pattern for all player inputs:
- `NextPhaseAction`: Advance to next phase
- `PlayCardAction`: Play a card with optional target
- `MoveSummonAction`: Move a summon
- `AttackAction`: Attack with a summon
- `DiscardCardsAction`: Discard cards at end phase
- `DrawCardAction`: Manually draw a card

#### GameStateResponse
Response from service containing:
- Updated game state
- Success/failure status
- Optional message
- Cards drawn (if applicable)

### UI Layer

#### GameScene
Main coordinator that:
- Initializes game service
- Processes player input and sends to service
- Receives state updates from service
- Synchronizes UI with game state

Key methods:
- `processPlayerAction(action)`: Send action to service
- `syncUIWithGameState()`: Update all UI elements
- `syncHandFromGameState()`: Update hand display

#### Visual Components
Still managed by UI layer:
- Card visuals (Card class)
- Summon tokens (created by SummonPlayHandler)
- Grid display (GridManager)
- Hand display (HandManager)
- UI elements (UIManager)

## Data Flow Examples

### Phase Transition
```
1. Player clicks "Next Phase" button
2. GameScene.handleNextPhase() creates NextPhaseAction
3. processPlayerAction() sends action to LocalGameService
4. Service validates and updates state (executes draw, levels summons, etc.)
5. Service returns GameStateResponse with updated state
6. GameScene syncs UI with new state
7. Phase indicator updates, cards drawn appear in hand
```

### Playing a Summon Card
```
1. Player selects summon card and clicks "Play Card"
2. Player clicks grid position
3. GameScene creates PlayCardAction with card and position
4. processPlayerAction() sends to LocalGameService
5. Service validates:
   - Correct phase (Action)
   - Valid position (player territory)
   - Card in hand
6. Service updates state:
   - Creates SummonUnit in placedSummons
   - Removes card from hand
   - Draws 3 cards
7. Service returns updated state
8. GameScene receives response
9. UI creates visual token at position
10. Hand display updates with new cards
```

### Moving a Summon
```
1. Player clicks summon token
2. SummonActionMenu shows available actions
3. Player selects "Move"
4. MoveAction highlights valid cells
5. Player clicks destination
6. GameScene creates MoveSummonAction
7. processPlayerAction() sends to LocalGameService
8. Service validates:
   - Summon exists and belongs to player
   - Movement available
   - Valid destination
9. Service updates state:
   - Updates summon position
   - Marks movement used
10. Service returns updated state
11. UI animates token to new position
```

## Benefits of This Architecture

### 1. Testability
- Service can be tested independently of UI
- UI can use MockGameService for testing
- State changes are predictable and reproducible

### 2. Future Server Support
- `LocalGameService` can be replaced with `RemoteGameService`
- UI code remains unchanged
- Network communication handled in service layer
- Easy to add authentication, latency handling, etc.

### 3. Clean Code Principles

#### Single Responsibility Principle (SRP)
- Service: Manages game state and rules
- UI: Manages display and user interaction
- Each component has one reason to change

#### Open/Closed Principle (OCP)
- New action types can be added without modifying existing code
- New service implementations (remote, mock) without changing UI

#### Dependency Inversion Principle (DIP)
- UI depends on IGameService interface, not concrete implementation
- Easy to swap implementations

#### Interface Segregation Principle (ISP)
- IGameService has focused interface
- PlayerAction types are specific and minimal

### 4. Maintainability
- Clear boundaries between layers
- State management centralized in service
- UI code simplified (no game logic)

## Current Implementation Status

### ✅ Completed
- Service layer interfaces and types
- LocalGameService implementation
- GameScene integration with service
- Phase transitions through service
- Hand synchronization with state

### 🚧 In Progress
- Card play through service
- Summon movement through service
- Visual token management

### 📋 TODO
- Complete integration of all actions
- Remove old TurnManager (replaced by service)
- Attack actions through service
- Discard through service
- Add RemoteGameService for future server support

## Backward Compatibility

During the transition, both old and new systems coexist:
- TurnManager still used for some operations
- Deck still managed separately
- Gradual migration to full service integration

This allows for incremental refactoring without breaking existing functionality.

## Future Enhancements

### Network Support
```typescript
export class RemoteGameService implements IGameService {
  async processAction(action: AnyPlayerAction): Promise<GameStateResponse> {
    const response = await fetch('/api/game/action', {
      method: 'POST',
      body: JSON.stringify(action)
    });
    return response.json();
  }
}
```

### State Synchronization
- Server broadcasts state changes
- Multiple clients stay in sync
- Spectator mode support

### Replay System
- Record all PlayerActions
- Replay games from action history
- Analysis and debugging tools

## Testing Strategy

### Service Layer Tests
```typescript
describe('LocalGameService', () => {
  it('should advance phase on NextPhaseAction', async () => {
    const service = new LocalGameService();
    await service.initializeGame();
    
    const response = await service.processAction({
      type: 'NEXT_PHASE',
      playerId: 0
    });
    
    expect(response.success).toBe(true);
    expect(response.state.currentPhase).toBe(TurnPhase.Level);
  });
});
```

### UI Layer Tests
```typescript
describe('GameScene', () => {
  it('should sync hand when state changes', () => {
    const mockService = new MockGameService();
    const scene = new GameScene();
    scene.setGameService(mockService);
    
    // Test hand synchronization
    // ...
  });
});
```

## Conclusion

This architecture provides a clean separation between game logic and UI, following SOLID principles and preparing for future server-based gameplay. The incremental approach allows for safe refactoring while maintaining working functionality.
