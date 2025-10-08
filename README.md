# Summoner's Grid - Phaser 3 Game Starter

A tactical card game built with Phaser 3 and TypeScript.

## Project Structure

```
summoners-grid/
├── src/                    # TypeScript source files
│   ├── main.ts            # Entry point and game configuration
│   ├── GameScene.ts       # Main game scene with board and hand
│   ├── Card.ts            # Card class and interface
│   └── Deck.ts            # Deck management
├── public/                # Static assets
│   └── index.html         # HTML template
├── assets/                # Game assets (images, sounds, etc.)
├── dist/                  # Build output (generated)
├── webpack.config.js      # Webpack configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # NPM dependencies and scripts
```

## Features

- **12x14 Grid Board**: The game board with territory control visualization
  - Bottom 3 rows: Player territory (blue)
  - Middle rows: Neutral territory (gray)
  - Top 3 rows: Opponent territory (red)
  - Coordinate system from (0,0) at bottom-left

- **Card System**:
  - Deck of 12 cards with various types (Action, Summon, Counter, Quest, Building)
  - Hand of up to 6 cards
  - Interactive card selection with hover effects
  - Click to select/deselect cards

- **Summon Play System**:
  - Select a summon card by clicking on it
  - Click "Play Card" button to initiate placement
  - Valid placement cells are highlighted in player territory
  - Summon units materialize on the board as colored tokens
  - Card is removed from hand and discarded

- **Summon Action Mechanics**:
  - Click on placed summon tokens to open action menu
  - **Move Action**: Move summons to any empty space on the board
    - Green highlights show valid movement destinations
    - Smooth animation to new position
  - **Attack Action**: Initiate attacks (currently stubbed for testing)
    - Shows attack notification message
  - Action availability based on summon state
  - Hover effects on summons and action buttons

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

## Game Design

This starter implements the basic structure for Summoner's Grid based on the Game Design Document:

- **3v3 Tactical Combat**: The foundation for fielding up to 3 summons per player
- **12x14 Grid Board**: The battlefield with coordinate system and territory control
- **Turn-Based Phases**: Placeholder for Draw, Level, Action, and End phases
- **Card Types**: Sample cards representing Action, Summon, Counter, Quest, and Building types
- **Hand Management**: 6-card hand limit as per game rules

## Next Steps for Development

### Implemented Features:
- ✅ Summon placement on the board
- ✅ Summon action mechanics (Move and Attack)
- ✅ Interactive summon tokens with action menus

### Remaining Development Areas:

The game foundation is now in place with basic summon interactions. Future enhancements include:

- Full attack system with target selection and damage calculation
- Movement range restrictions based on summon stats
- Turn phase management (Draw, Level, Action, End phases)
- Action restrictions based on turn rules (one attack per turn, movement limits)
- Card effect implementation for Action, Quest, Building cards
- Role advancement system
- Equipment system
- Victory conditions
- Multiplayer support

## Testing

See [TESTING_SUMMON_ACTIONS.md](TESTING_SUMMON_ACTIONS.md) for detailed testing instructions for the summon action mechanics.

## Technologies Used

- **Phaser 3**: Game framework
- **TypeScript**: Type-safe development
- **Webpack**: Module bundling
- **Webpack Dev Server**: Development server with hot reload

## License

ISC
