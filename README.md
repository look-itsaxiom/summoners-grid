# Summoner's Grid - Phaser 3 Tactical Card Game

A tactical card game built with Phaser 3 and TypeScript, implementing the Summoner's Grid game design.

## Overview

Summoner's Grid is a strategic 3v3 tactical card game where players summon units onto a battlefield grid, equip them with weapons and abilities, and command them in turn-based combat. This implementation provides the foundational game mechanics with interactive summon placement and action systems.

## Project Structure

```
summoners-grid/
├── src/                          # TypeScript source files
│   ├── main.ts                   # Entry point and game configuration
│   ├── GameScene.ts              # Main game scene with board and hand
│   ├── Card.ts                   # Card class and interface
│   ├── Deck.ts                   # Deck management
│   ├── types/                    # Type definitions
│   │   ├── GameTypes.ts          # Core game type definitions
│   │   └── SummonUnit.ts         # Summon state management
│   ├── cardHandlers/             # Card play handlers
│   │   ├── ICardPlayHandler.ts   # Handler interface
│   │   ├── SummonPlayHandler.ts  # Summon placement logic
│   │   ├── CardPlayHandlerRegistry.ts
│   │   └── index.ts
│   ├── summonActions/            # Summon action system
│   │   ├── ISummonAction.ts      # Action interface
│   │   ├── MoveAction.ts         # Movement logic
│   │   ├── AttackAction.ts       # Attack logic (stubbed)
│   │   └── index.ts
│   └── ui/                       # UI components
│       └── SummonActionMenu.ts   # Action menu component
├── public/                       # Static assets
│   └── index.html                # HTML template
├── assets/                       # Game assets (images, sounds)
├── dist/                         # Build output (generated)
├── webpack.config.js             # Webpack configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # NPM dependencies and scripts
```

## Implemented Features

### Core Game Board
- **12x14 Grid Board** with coordinate system from (0,0) at bottom-left
- **Territory Control Visualization**:
  - Bottom 3 rows: Player territory (blue)
  - Middle rows: Neutral territory (gray)
  - Top 3 rows: Opponent territory (red)

### Card System
- **Deck Management**: 12 cards with various types (Action, Summon, Counter, Quest, Building)
- **Hand Management**: Up to 6 cards in hand
- **Interactive Cards**: Hover effects and click selection
- **Card Types**: Sample cards representing all major card categories

### Summon Placement System
- **Select summon cards** by clicking on them in hand
- **"Play Card" button** appears for selected cards
- **Territory validation**: Valid placement cells highlight in player territory
- **Summon materialization**: Colored tokens appear on board with animations
- **State management**: Cards removed from hand after placement

### Summon Action Mechanics ✅
- **Interactive Tokens**: Click placed summons to open action menu
- **Action Menu System**: 
  - Hovering menu above selected summon
  - Dynamic buttons based on available actions
  - Styled with consistent blue theme
- **Move Action**: 
  - Highlights all empty cells in green
  - Smooth animation to destination
  - Updates summon position state
  - Currently allows movement to any empty space
- **Attack Action** (Stubbed):
  - Shows attack notification
  - Marks summon as having attacked
  - Framework ready for full implementation

### Architecture Highlights
- **SOLID Principles**: Clean, maintainable, and extensible code
  - Single Responsibility: Each class has one clear purpose
  - Open/Closed: New actions can be added without modifying existing code
  - Liskov Substitution: All actions are interchangeable via interface
  - Interface Segregation: Minimal interface with only essential methods
  - Dependency Inversion: Dependencies on abstractions, not concrete classes
- **Action System**: Interface-based design for easy extension
- **State Management**: Centralized summon state tracking
- **Event Handling**: Proper cleanup to prevent memory leaks

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation
```bash
npm install
```

### Development
Run the development server with hot reload:
```bash
npm run dev
```
The game will be available at `http://localhost:8080`

### Build
Build the production bundle:
```bash
npm run build
```
The output will be in the `dist/` directory.

## Testing

For comprehensive testing instructions, see [TESTING.md](TESTING.md).

### Quick Start Testing
1. Start dev server: `npm run dev`
2. Open http://localhost:8080
3. Click a summon card → Click "Play Card" → Click a highlighted cell
4. Click the placed summon token → Try "Move" and "Attack" actions

### Automated Demo
Open browser console and paste contents of [demo-actions.js](demo-actions.js) to see an automated workflow demonstration.

## Game Design

This implementation follows the Summoner's Grid Game Design Document:

- **3v3 Tactical Combat**: Foundation for fielding up to 3 summons per player
- **Turn-Based Phases**: Structure for Draw, Level, Action, and End phases
- **Card Types**: Support for Action, Summon, Counter, Quest, and Building cards
- **Hand Management**: 6-card hand limit as per game rules

For complete game rules and mechanics, see [Summoner's Grid GDD.md](Summoner's%20Grid%20GDD.md).

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)**: Detailed architecture documentation with class diagrams, SOLID principles, and extension points
- **[TESTING.md](TESTING.md)**: Comprehensive testing guide with step-by-step scenarios
- **[Summoner's Grid GDD.md](Summoner's%20Grid%20GDD.md)**: Complete game design document
- **[Alpha Cards.md](Alpha%20Cards.md)**: Reference for all Alpha set cards
- **[Summoner's Grid Play Example.md](Summoner's%20Grid%20Play%20Example.md)**: Detailed gameplay example

## Development Roadmap

### Completed ✅
- Grid board with territory control
- Card and deck systems
- Hand management
- Summon placement system
- Summon action mechanics (Move and Attack framework)
- Interactive summon tokens with action menus

### In Progress / Next Steps
- Full attack system with target selection and damage calculation
- Movement range restrictions based on summon stats
- Turn phase management (Draw, Level, Action, End phases)
- Action restrictions based on turn rules
- Card effect implementation for Action, Quest, Building cards
- Role advancement system
- Equipment system
- Victory conditions
- Multiplayer support

## Code Quality

### Clean Code Practices
- ✅ Descriptive variable and function names
- ✅ Clear separation of concerns
- ✅ Proper encapsulation
- ✅ Minimal coupling between components
- ✅ Comments where necessary
- ✅ Consistent coding style

### TypeScript Best Practices
- ✅ Strong typing throughout
- ✅ Interface-driven design
- ✅ Proper use of access modifiers
- ✅ No type assertion hacks
- ✅ Compiles without errors

### Phaser Best Practices
- ✅ Proper event handler cleanup
- ✅ Efficient use of tweens and animations
- ✅ Proper depth management for layering
- ✅ No memory leaks from event listeners

## Technologies Used

- **[Phaser 3](https://phaser.io/)**: Game framework for rendering and game loop
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development
- **[Webpack](https://webpack.js.org/)**: Module bundling
- **[Webpack Dev Server](https://webpack.js.org/configuration/dev-server/)**: Development server with hot reload

## Contributing

When adding new features:
1. Follow SOLID principles
2. Add appropriate tests and documentation
3. Ensure TypeScript compilation succeeds
4. Update relevant documentation files

### Adding New Actions

Example of adding a new "Defend" action:

```typescript
// 1. Create new action class
export class DefendAction implements ISummonAction {
  getName(): string { return 'Defend'; }
  canExecute(summon: SummonUnit): boolean { return !summon.isDefending; }
  execute(summon: SummonUnit, scene: Phaser.Scene, onComplete: Function): void {
    // Implement defend logic
    summon.markDefending();
    onComplete(true);
  }
}

// 2. Register in SummonPlayHandler constructor
this.availableActions = [
  new MoveAction(this.grid, this.placedSummons),
  new AttackAction(),
  new DefendAction() // Add here!
];
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed extension guidelines.

## License

ISC
