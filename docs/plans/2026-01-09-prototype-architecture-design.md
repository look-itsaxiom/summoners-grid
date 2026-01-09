# Summoner's Grid Prototype Architecture Design

## Overview

A vertical slice prototype proving the card game mechanics work. Two players at one computer can play a full match using the example decks, making any legal action available within the game's rules.

**Target:** Web browser, local/hotseat multiplayer, clean minimal UI (no art assets).

## Architecture

### Layer Separation

```
┌─────────────────────────────────────────────────────────┐
│  React Shell                                            │
│  - Browser integration                                  │
│  - Routes (menu, game, deck builder stub)              │
│  - Debug panel for game state inspection               │
│  - Mediates Engine ↔ Phaser communication              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│  Phaser Client                                          │
│  - 12x14 grid rendering                                │
│  - Unit tokens, card displays, hand management         │
│  - All player input (clicks, targeting)                │
│  - Animation queue for state transitions               │
│  - No game logic - renders what it's told              │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│  Pure TypeScript Engine (future server)                │
│  - GameState management                                │
│  - Action validation and dispatch                      │
│  - Stack-based effect resolution                       │
│  - Combat calculations                                 │
│  - Authoritative source of truth                       │
└─────────────────────────────────────────────────────────┘
```

**Key principle:** The engine is server-portable. Zero React/Phaser dependencies. When multiplayer is added, this layer moves to NestJS/Colyseus unchanged.

### Data Flow

```
Phaser input → React mediator → Engine.dispatch(action) → { state, events } → React → Phaser.processEvents()
```

## Game State Structure

```typescript
interface GameState {
  board: Board;                    // 12x14 grid with entity positions
  players: [PlayerState, PlayerState];
  activePlayerIndex: 0 | 1;
  turn: TurnState;
  stack: EffectStack;
  winner: 0 | 1 | null;
}

interface PlayerState {
  victoryPoints: number;

  // Zones
  hand: Card[];
  mainDeck: Card[];
  advanceDeck: Card[];
  discardPile: Card[];
  rechargePile: Card[];
  removedFromPlay: Card[];

  // Active cards (face-up or face-down)
  inPlay: InPlayCard[];
}

interface InPlayCard {
  card: Card;
  faceDown: boolean;
  linkedEntityId?: EntityId;       // Links to unit/building on board
}

interface SummonUnit {
  id: UnitId;
  owner: 0 | 1;
  position: GridPosition;
  summon: SummonCard;
  role: Role;
  equipment: EquipmentLoadout;
  level: number;
  currentHp: number;
  maxHp: number;
  calculatedStats: Stats;
  statusEffects: StatusEffect[];
  completedQuests: QuestId[];
}

interface TurnState {
  number: number;
  phase: 'draw' | 'level' | 'action' | 'end';
  turnSummonUsed: boolean;
  summonActions: Map<UnitId, {
    attacksRemaining: number;
    movementRemaining: number;
  }>;
}
```

### Card Lifecycle

| Action | Card Movement |
|--------|---------------|
| Play summon slot | Hand → In Play (face up), unit spawns on board |
| Summon defeated | In Play → Removed from Play, unit removed from board |
| Play building | Hand → In Play (face up), building spawns on board |
| Building destroyed | In Play → Discard Pile, building removed from board |
| Play action | Hand → (resolves) → Recharge or Discard (card specifies) |
| Set counter/reaction | Hand → In Play (face down) |
| Counter triggers | In Play → Discard Pile (after resolution) |
| Play quest | Hand → In Play (face up) |
| Quest completed | In Play → Recharge or Discard (card specifies) |
| Play advance (role) | Advance Deck → Discard Pile (after resolution) |
| Play advance (Named) | Advance Deck → In Play (replaces original summon slot) |

## Engine Core

### Actions

```typescript
type GameAction =
  | { type: 'SELECT'; entityId: EntityId; selections?: Selection[] }
  | { type: 'PASS_PRIORITY' };

type Selection = EntityId | GridPosition | number | string;
```

Minimal action types. The context (current state, pending prompts) determines what a selection means. Card definitions drive validation and resolution.

### Engine Interface

```typescript
interface GameEngine {
  dispatch(state: GameState, action: GameAction): DispatchResult;
  getSelectableEntities(state: GameState): EntityId[];
  getRequiredSelections(state: GameState, entityId: EntityId): SelectionPrompt[];
}

interface DispatchResult {
  state: GameState;
  events: GameEvent[];
}
```

## Effect System

### Flexible Effect Definitions

```typescript
interface Effect {
  type: string;
  params: Record<string, unknown>;
}
```

Engine has handler registry that interprets effects by type. New effect types add handlers - core structure doesn't change.

### Flexible Event Definitions

```typescript
interface GameEvent {
  type: string;
  params: Record<string, unknown>;
}
```

Phaser has animator registry that renders events. Unknown events degrade gracefully (skip or show fallback).

## Stack Resolution

```typescript
interface EffectStack {
  entries: StackEntry[];
  speedLock: 'action' | 'reaction' | 'counter';
}

interface StackEntry {
  id: string;
  source: EntityId;
  effects: Effect[];
  speed: 'action' | 'reaction' | 'counter';
  targets: Selection[];
}
```

### Speed Lock Rules

- Empty stack → `action` speed (base state)
- Action added → `reaction` speed (reactions and counters can respond)
- Reaction added → `counter` speed (only counters can respond)
- Counter added → stays `counter` speed

### Resolution Flow (Per-Entry)

1. Effect added to stack
2. Check: does opponent of effect's origin have valid responses?
   - No valid responses → skip to step 4
   - Yes → opponent gets priority
3. Opponent responds (go to step 1) or passes
   - Check other player for valid responses
   - If none or pass → proceed to step 4
4. Both passed (or neither had valid responses) → resolve top entry
5. Resolution may trigger effects → triggered effects go on stack
6. If stack not empty → return to step 2
7. Stack empty → speed lock returns to 'action'

Priority only offered when player has valid responses.

## Card Data Format

Cards are JSON, loaded at startup. No logic in data files.

```json
{
  "id": "001-blast-bolt",
  "name": "Blast Bolt",
  "type": "action",
  "rarity": "common",
  "attribute": "fire",
  "speed": "action",
  "destination": "discard",
  "requirements": [
    { "type": "control_role_family", "family": "magician" }
  ],
  "selectionPrompts": [
    { "id": "caster", "type": "unit", "filter": "own && role.family == 'magician'" },
    { "id": "target", "type": "unit", "filter": "enemy" }
  ],
  "effects": [
    {
      "type": "damage",
      "params": {
        "formula": "caster.INT * (1 + 60/100) * (caster.INT / target.MDF)",
        "attribute": "fire",
        "canCrit": true,
        "hitFormula": "85 + (caster.ACC / 10)"
      }
    }
  ]
}
```

## Project Structure

```
/summoners-grid
  /packages
    /engine                    # Pure TypeScript game logic
      /src
        /state                 # GameState, PlayerState, etc.
        /actions               # Action dispatch, validation
        /resolution            # Stack, effect handlers, triggers
        /combat                # Damage, healing, hit/crit calculations
        /stats                 # Stat calculation, growth rates
        /cards                 # CardRegistry, card loading
        index.ts               # Public API
      /tests
      package.json

    /client                    # React + Phaser application
      /src
        /phaser
          /scenes              # BattleScene, etc.
          /animations          # Event animators
          /objects             # Grid, UnitToken, CardSprite, etc.
        /react
          /components          # GameApp, DebugPanel, GameLog
          /hooks               # useGameEngine, etc.
        /bridge                # React-Phaser communication
        App.tsx
        main.tsx
      /public
      package.json

    /data                      # Card definitions (JSON)
      /cards
        actions.json
        buildings.json
        ...

  package.json                 # Monorepo root (pnpm workspaces)
  tsconfig.json
```

## Testing Strategy

### Source of Truth Hierarchy

1. Formulas in the GDD (authoritative)
2. Implemented calculations (must match formulas)
3. Play Example (illustrative, not verified)

### Testing Approach

- Test formulas directly with hand-calculated expected values
- Test stat progression, combat resolution, stack behavior
- Play Example as smoke test (action sequence works, rules enforced)
- Don't assert Play Example's exact numbers - document may have arithmetic errors

## Prototype Scope

### Included

- Full game rules (turn structure, phases, priority, stack)
- All legal actions computable from any game state
- All cards in both example decks (~20 cards)
- Stat calculations, combat, triggers for any combination
- Live randomization (hit rolls, crit rolls)
- Grid rendering, unit tokens, hand display
- Movement/attack highlighting, basic animations
- Debug panel, pass priority controls

### Deferred

- Deck builder UI
- Summon generation / pack opening
- Networking / multiplayer
- Persistence / database
- Authentication
- AI opponent
- Polish animations / art assets
- Cards not in example decks

### Acceptance Criteria

1. Players can reproduce the Play Example by making the same choices (given matching RNG)
2. Players can make different choices and the game responds correctly
3. Any legal action is available; any illegal action is prevented
4. Victory/defeat triggers correctly regardless of path taken

The Play Example validates our implementation. It doesn't constrain it.
