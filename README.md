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

- **Card Play Mechanic**:
  - Select a card by clicking on it
  - Click "Play Card" button to play the selected card
  - Playing a card calls a stubbed `onPlayCard()` function
  - Card is removed from hand and a new card is drawn from deck

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

The stubbed `onPlayCard()` function in `GameScene.ts` is where you can add:

- Card effect implementation
- Summon placement on the board
- Combat mechanics
- Turn phase management
- Role advancement system
- Equipment system
- Victory conditions

## Technologies Used

- **Phaser 3**: Game framework
- **TypeScript**: Type-safe development
- **Webpack**: Module bundling
- **Webpack Dev Server**: Development server with hot reload

## License

ISC
