# Summoner's Grid - Multiplayer Browser Demo

A tactical grid-based RPG card game with multiplayer support, built with Node.js, Express, and Socket.IO.

## Overview

Summoner's Grid is a competitive multiplayer game where players summon units, cast spells, and engage in strategic battles on a 12x14 grid battlefield. The game features:

- **Turn-based tactical combat** with a 3v3 format
- **Real-time multiplayer** using Socket.IO
- **Card-based gameplay** with different card types (Summons, Actions, Roles, Equipment)
- **Strategic depth** with positioning, range, and stat-based combat
- **Victory Points system** - first to 3 VP wins

## Game Design Documents

This implementation is based on the comprehensive Game Design Documents:
- `Summoner's Grid GDD.md` - Complete game mechanics and rules
- `Alpha Cards.md` - Card reference for the Alpha set
- `Summoner's Grid Play Example.md` - Detailed gameplay walkthrough

## Features Implemented

### Core Mechanics
- ✅ 12x14 grid battlefield with territory control
- ✅ Turn structure (Draw, Level, Action, End phases)
- ✅ Stat calculation system with growth rates
- ✅ Combat system (hit calculation, damage, critical hits)
- ✅ Victory Points tracking

### Multiplayer
- ✅ Room creation and joining system
- ✅ Real-time game synchronization
- ✅ Player ready system
- ✅ Turn-based gameplay

### Game Content
- ✅ Summon cards with species and roles
- ✅ Equipment system (weapons)
- ✅ Action cards (basic attacks and abilities)
- ✅ Starter decks for demo play

## Installation

1. **Prerequisites**: Node.js (v14 or higher)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## How to Play

### Starting a Game

1. **Create or Join a Room**:
   - Enter a room name and click "Create Room", OR
   - Click "Refresh Rooms" and join an existing room

2. **Wait for Opponent**:
   - Once both players are in the room, click "Ready"
   - Game starts when both players are ready

### Gameplay

1. **Summon Phase**:
   - On your first turn, click a summon card from your hand
   - Click a position in your territory (green area for Player 1, red area for Player 2)
   - You'll draw 3 cards after summoning

2. **Moving Units**:
   - Click on your unit (green for Player 1, red for Player 2)
   - Click the "Move" button
   - Click a highlighted position to move

3. **Attacking**:
   - Click on your unit
   - Click the "Attack" button
   - Click an enemy unit within range (shown in red)

4. **End Turn**:
   - Click "End Turn" when you're done
   - Your units will level up and reset for the next turn

### Victory Conditions

- First player to reach **3 Victory Points** wins!
- Earn VP by defeating enemy units:
  - Tier 1 units: 1 VP
  - Tier 2+ units: 2 VP

## Game Controls

- **Click card in hand**: Select card to play
- **Click board cell**: Place summon or move/attack target
- **Click unit**: Select your unit
- **Move button**: Enter movement mode
- **Attack button**: Enter attack mode
- **Clear Selection**: Cancel current action
- **End Turn**: Finish your turn

## Architecture

```
summoners-grid/
├── client/               # Frontend (HTML, CSS, JavaScript)
│   ├── index.html       # Main game UI
│   └── game.js          # Client-side game logic
├── server/              # Backend (Node.js, Express, Socket.IO)
│   └── index.js         # Server and game state management
├── shared/              # Shared game logic
│   ├── constants.js     # Game constants
│   ├── cards.js         # Card definitions
│   └── game.js          # Core game mechanics
└── package.json         # Dependencies and scripts
```

## Technical Details

### Technologies Used
- **Node.js**: Server runtime
- **Express**: Web server framework
- **Socket.IO**: Real-time bidirectional communication
- **Vanilla JavaScript**: Client-side game logic
- **CSS3**: Modern styling with gradients and animations

### Communication Protocol

The game uses Socket.IO events for client-server communication:

**Client → Server**:
- `createRoom(roomId)`: Create a new game room
- `joinRoom(roomId)`: Join an existing room
- `playerReady()`: Mark player as ready
- `playSummon(cardId, x, y)`: Play a summon card
- `moveUnit(unitId, toX, toY)`: Move a unit
- `attack(attackerId, targetId)`: Attack with a unit
- `endTurn()`: End current turn

**Server → Client**:
- `roomList(rooms)`: Available rooms
- `gameStart(initialState)`: Game initialization
- `gameUpdate(action, state)`: Game state updates
- `gameOver(winner)`: Game conclusion

## Demo Limitations

This is a minimal viable demo focused on core mechanics:

- Simplified deck building (fixed starter decks)
- Limited card pool (basic Alpha set cards)
- No advanced features (quests, buildings, counters)
- No AI opponent
- No save/load functionality
- No persistent accounts

## Future Enhancements

Potential additions based on the full GDD:
- Complete Alpha card set implementation
- Building and Quest cards
- Counter and Reaction card mechanics
- Equipment system expansion
- Role advancement trees
- AI opponent
- Deck builder interface
- Persistent game state
- Spectator mode
- Game replay system

## Troubleshooting

**Server won't start**:
- Check that port 3000 is available
- Ensure Node.js is installed correctly

**Can't connect to game**:
- Verify the server is running
- Check browser console for errors
- Try refreshing the page

**Game desync issues**:
- Refresh both browser windows
- Recreate the room

## License

ISC

## Credits

Based on the Summoner's Grid Game Design Documents by the original game designers.
