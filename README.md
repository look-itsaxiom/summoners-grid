# Summoner's Grid - Tactical Grid-Based Card Game

A tactical grid-based RPG card game with fantasy theme, featuring 3v3 combat, role advancement, and complex card interactions.

## 🎮 Demo Screenshot

![Summoner's Grid Demo](https://github.com/user-attachments/assets/b3b0a9eb-fb7e-46a7-9bef-12df9fd34fe3)

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm

### Installation & Running
```bash
# Clone the repository
git clone https://github.com/look-itsaxiom/summoners-grid.git
cd summoners-grid

# Install dependencies
npm install

# Start the development server
npm run dev
```

The game will open automatically in your browser at `http://localhost:5173`.

### 🌐 Live Demo
Play the latest version at: **[https://look-itsaxiom.github.io/summoners-grid/](https://look-itsaxiom.github.io/summoners-grid/)**

The demo is automatically updated on every push to the main branch via GitHub Actions.

## 🎯 Current Status: Vertical Slice Demo

This repository contains a **fully playable vertical slice demo** that implements all core Summoner's Grid mechanics:

### ✅ Implemented Features
- **12x14 tactical grid board** with proper territory visualization
- **Turn-based gameplay** with Draw/Level/Action/End phases  
- **3v3 combat format** with identical starter decks
- **Complete card system** including Summon, Action, Equipment, and Role cards
- **Movement and positioning** with range validation
- **Combat system** with hit calculation, critical hits, and damage formulas per GDD
- **Role advancement and equipment** modifying stats and abilities
- **Victory conditions** through 3 Victory Points
- **Real-time UI** with responsive design

### 🎮 How to Play
1. **Card Selection**: Click cards in your hand to select them
2. **Summon Placement**: Click valid board positions to place summons
3. **Unit Actions**: Click your units to select them, then click targets or destinations
4. **Turn Management**: Use "End Phase" button to progress through turn phases
5. **Victory**: First player to reach 3 Victory Points wins!

## 🏗️ Architecture

Built with clean, extensible TypeScript architecture:

```
src/
├── types.ts           # Core game types and enums
├── cards.ts           # Card base classes and hierarchy  
├── card-definitions.ts # Alpha set card implementations
├── summon-unit.ts     # Individual unit logic with stats/combat
├── game-board.ts      # 12x14 grid management and validation
├── player.ts          # Hand/deck/VP management
├── game.ts            # Main game controller and turn logic
├── ui-controller.ts   # Interface between game logic and DOM
└── main.ts            # Application entry point
```

### Key Design Principles
- **TypeScript First**: Strong typing throughout for maintainability
- **Modular Design**: Clean separation between game logic and UI
- **Extensible Card System**: Easy to add new card types and effects
- **GDD Compliance**: All formulas and mechanics match the Game Design Document
- **Developer Friendly**: Clear code structure accessible to average developers

## 📋 Implementation Plans

This repository includes detailed implementation plans:

- **[Vertical Slice Plan](VERTICAL_SLICE_PLAN.md)**: How the current demo was built (COMPLETED ✅)
- **[Full Implementation Plan](FULL_IMPLEMENTATION_PLAN.md)**: Roadmap to complete game (6-month plan)

## 🎴 Card System

### Current Alpha Set Cards
- **Summon Cards**: Gignen Warrior, Magician, Scout with unique stats
- **Action Cards**: Blast Bolt, Healing Hands, Sharpened Blade, Rush
- **Role Cards**: Warrior, Magician, Scout with stat modifiers
- **Equipment Cards**: Heirloom Sword, Apprentice's Wand, Hunting Bow

### Effect System
Cards use a flexible effect system that supports:
- Role-based requirements (e.g., "requires Warrior-family summon")
- Target validation and selection
- Complex stat calculations with equipment bonuses
- Extensible for future advanced card types

## 🎯 Game Mechanics

### Combat System
Based on the GDD specifications:
- **Hit Calculation**: Base accuracy + (Accuracy stat / 10)
- **Critical Hits**: Luck-based formula with 1.5x damage multiplier
- **Damage Types**: Physical (STR-based) and Magical (INT-based)
- **Equipment Impact**: Weapons define attack type, power, and range

### Turn Structure
1. **Draw Phase**: Draw 1 card (skipped on turn 1)
2. **Level Phase**: All controlled summons gain 1 level
3. **Action Phase**: Play cards, move units, attack
4. **End Phase**: Discard excess cards, check victory conditions

### Victory Conditions
- **3 Victory Points** wins the game
- **1 VP** for defeating Tier 1 summons
- **2 VP** for defeating Tier 2+ summons
- Additional VP sources from quests and special effects

## 🛠️ Development

### Building
```bash
npm run build    # Build for production
npm run dev      # Start development server
npm run preview  # Preview production build locally
```

### 🚀 Deployment
The project uses GitHub Actions for automatic deployment to GitHub Pages:
- **Triggers**: Push to main branch
- **Build**: Vite production build with correct base path
- **Deploy**: Automatic deployment to `https://look-itsaxiom.github.io/summoners-grid/`

Configuration files:
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vite.config.ts` - Build configuration with GitHub Pages support

### Project Structure
- `src/` - TypeScript source files
- `dist/` - Compiled JavaScript and assets
- `*.md` - Documentation and implementation plans

### Adding New Cards
1. Create card definition in `card-definitions.ts`
2. Implement effect function with game state modifications
3. Add to appropriate deck initialization
4. Test through UI

Example:
```typescript
export const newActionCard = new ActionCard(
    'id',
    'Card Name',
    Attribute.Fire,
    'Common',
    'Card description',
    Speed.Action,
    {
        description: 'Effect description',
        execute: (game, caster, target) => {
            // Implement card effect here
        }
    },
    RoleFamily.Warrior // Optional role requirement
);
```

## 🔮 Future Development

### Next Phase: Advanced Card Types
The foundation is ready for implementing:
- **Counter Cards**: Reactive defense with automatic triggers
- **Reaction Cards**: Flexible responses during either player's turn
- **Building Cards**: Persistent board effects occupying multiple spaces
- **Quest Cards**: Objective-based rewards with completion tracking

### Full Game Features
See [Full Implementation Plan](FULL_IMPLEMENTATION_PLAN.md) for the complete roadmap including:
- Online multiplayer with matchmaking
- Card collection and pack opening
- Deck building interface
- Trading and auction house
- Multiple game formats
- Campaign and tournament modes

## 📖 Documentation

- **[Game Design Document](Summoner's%20Grid%20GDD.md)**: Complete game mechanics specification
- **[Play Example](Summoner's%20Grid%20Play%20Example.md)**: Detailed gameplay walkthrough
- **[Alpha Cards Reference](Alpha%20Cards.md)**: All cards in the alpha set

## 🤝 Contributing

This project demonstrates a complete implementation approach for Summoner's Grid. The codebase is designed to be:
- **Understandable**: Clear architecture and naming conventions
- **Extensible**: Easy to add new features and card types
- **Maintainable**: Strong typing and modular design
- **Testable**: Clean separation of concerns

## 📄 License

This project implements the game mechanics described in the Summoner's Grid Game Design Document.

---

**Play the demo now** and experience the complete Summoner's Grid gameplay!