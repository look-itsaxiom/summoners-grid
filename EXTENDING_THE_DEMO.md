# Extending the Summoner's Grid Demo

This document provides a guide for developers looking to extend the functionality of this playable demo, add new content, or build upon the existing systems.

## Project Structure

The project is a monorepo managed by npm workspaces, divided into three main packages:

-   `packages/common`: Contains all shared code, including game state schemas (defined with Colyseus), card data, type definitions, and core calculation utilities. This code is used by both the client and the server.
-   `packages/server`: The Node.js game server built with Colyseus. It contains all the authoritative game logic, turn management, and action handling in the `GameRoom.ts` file.
-   `packages/client`: The Phaser 3 frontend application. It connects to the server, renders the game state, and sends user input back to the server for processing.

## How to Add a New Action Card

Adding a new card with a unique effect requires changes in two key locations: the data definition and the server-side logic implementation.

### 1. Define the Card Data

All card definitions are stored in `packages/common/src/game/data/card-data.ts`. To add a new card, create a new entry in the `cardData` object.

**Example: Adding a "Fireball" card.**

```javascript
// In packages/common/src/game/data/card-data.ts

export const cardData = {
  // ... existing cards
  'alpha-101-fireball': {
    id: 'alpha-101-fireball',
    name: 'Fireball',
    type: CardType.ACTION,
    rarity: 'Uncommon',
    attribute: Attribute.FIRE,
    speed: ActionSpeed.ACTION,
    description: 'Deals 20 fire damage to a target summon.',
  },
  // ...
};
```

### 2. Implement the Card's Logic

The server needs to know what to do when a card is played. This logic resides in `packages/server/src/rooms/GameRoom.ts`.

In the `handlePlayActionCard` method, add a new `case` to the `switch` statement for your new card's ID.

```typescript
// In packages/server/src/rooms/GameRoom.ts inside handlePlayActionCard

switch(card.cardId) {
    case '001-blast-bolt':
        // ... existing logic
        break;

    // Add your new card's logic here
    case 'alpha-101-fireball':
        if (!targets || targets.length === 0) return this.logToGame('Validation Error: Fireball requires a target.');
        const fireballTarget = this.state.board.get(targets[0]);
        if (!fireballTarget || fireballTarget.ownerId === player.sessionId) return this.logToGame('Validation Error: Invalid target for Fireball.');

        const caster = Array.from(this.state.board.values()).find(s => s.ownerId === player.sessionId);
        if (!caster) return this.logToGame('Validation Error: No summon available to cast the spell.');

        // Use the combat calculation utility for consistent mechanics
        this.handleAttack(caster, fireballTarget, { basePower: 20, baseAccuracy: 90, damageFormula: 'magical'});
        break;

    // ... other cases
}
```

## Game Logic Overview

-   **Game State:** The authoritative game state is defined in `packages/common/src/index.ts` using `@colyseus/schema`. The client receives this state and renders it.
-   **Turn Progression:** The game loop is controlled by the `tick()` method in `GameRoom.ts`, which acts as a state machine for the game phases (Draw, Level, End).
-   **Player Actions:** The `ACTION` phase is passive, waiting for messages from the client. All player actions (`playCard`, `moveSummon`, `attack`, `endTurn`) are handled by `onMessage` handlers in the `GameRoom`.
-   **Calculations:** All core mathematical formulas (stat growth, combat damage, etc.) are centralized in `packages/common/src/game/utils.ts`. To modify how the game calculates damage or stats, this is the place to look.

By following these patterns, you can add new cards, summons, and mechanics to expand the game toward the full vision outlined in the GDDs.
