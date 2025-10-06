# Summoner's Grid - TCG Starter

A tactical grid-based RPG card game built with Phaser 3 and TypeScript.

## Overview

This is a starter implementation of Summoner's Grid, a 3v3 tactical combat card game with:
- Turn-based gameplay with 4 phases (Draw, Level, Action, End)
- 12x14 grid battlefield with territory control
- Multiple card types (Summons, Actions, Roles, Equipment, etc.)
- Complex stat and growth rate systems
- Species and role-based summon units

## Game Design Documentation

See the following files for complete game rules and mechanics:
- `Summoner's Grid GDD.md` - Complete game design document
- `Alpha Cards.md` - Card reference and examples
- `Summoner's Grid Play Example.md` - Detailed gameplay walkthrough

## Technology Stack

- **Phaser 3** - Game framework
- **TypeScript** - Type-safe JavaScript
- **Webpack** - Module bundling and build system
- **Node.js** - Development environment

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server with hot-reload:
```bash
npm run dev
```

The game will be available at `http://localhost:8080`

### Building

Build for production:
```bash
npm run build
```

Output will be in the `dist/` directory.

## Project Structure

```
src/
├── index.ts           # Game entry point and Phaser configuration
├── index.html         # HTML template
├── GameScene.ts       # Main game scene with board and gameplay
├── types.ts           # TypeScript type definitions
├── constants.ts       # Game constants and configuration
├── cardData.ts        # Sample card data based on Alpha Cards
├── gameUtils.ts       # Game mechanics and calculations
```

## Current Features

### Implemented
- ✅ Game board (12x14 grid) with territory visualization
- ✅ Basic UI with turn/phase tracking
- ✅ Victory point counters
- ✅ Summon placement and visualization
- ✅ Turn phase progression (Draw → Level → Action → End)
- ✅ Level-up system with stat recalculation
- ✅ Stat calculation based on growth rates
- ✅ Click to select summons and view details
- ✅ Sample summon cards for both players
- ✅ HP, movement, and stat tracking

### Not Yet Implemented (Next Steps)
- ❌ Card drawing from deck
- ❌ Playing cards from hand
- ❌ Movement system with range visualization
- ❌ Combat system (attacks, damage calculation)
- ❌ Effect stack and resolution
- ❌ Role advancement system
- ❌ Equipment system
- ❌ Building and quest cards
- ❌ AI opponent
- ❌ Multiplayer networking
- ❌ Card animations and visual effects
- ❌ Sound effects and music
- ❌ Menu system and deck builder

## Game Mechanics

### Turn Structure
1. **Draw Phase**: Draw a card from the main deck (skipped on first turn)
2. **Level Phase**: All summons gain 1 level and recalculate stats
3. **Action Phase**: Play cards, move summons, attack
4. **End Phase**: Resolve end-of-turn effects

### Victory Conditions
- First player to reach 3 Victory Points wins
- VP sources:
  - Defeating Tier 1 summons: 1 VP
  - Defeating Tier 2+ summons: 2 VP
  - Territory control attacks: 1 VP
  - Quest completions: Variable VP

### Stats System
- **STR**: Strength (physical attack)
- **END**: Endurance (HP calculation)
- **DEF**: Defense (physical damage reduction)
- **INT**: Intelligence (magical attack)
- **SPI**: Spirit (healing effectiveness)
- **MDF**: Magic Defense (magical damage reduction)
- **SPD**: Speed (movement calculation)
- **ACC**: Accuracy (hit chance)
- **LCK**: Luck (critical hits)

### Growth Rates
- **SLOW**: 0.75 stat increase per level
- **NORMAL**: 1.0 stat increase per level
- **FAST**: 1.25 stat increase per level

## Controls

- **Click**: Select summon to view details
- **Space** or **Next Phase Button**: Advance to next phase/turn

## Development Notes

This is a foundational starter that implements:
- Core game loop and turn structure
- Type-safe data models matching the GDD
- Visual representation of the game board and summons
- Basic UI for game state tracking

The architecture is designed to be extensible for adding the remaining game mechanics documented in the GDD. Each system (combat, effects, advancement, etc.) can be added as separate modules that integrate with the existing type system and game state.

## License

ISC
