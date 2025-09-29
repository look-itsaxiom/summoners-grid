# Summoner's Grid Engine CLI Tool

Interactive command-line interface for testing and exploring the Summoner's Grid game engine. This "soft" client allows manual testing of various engine components with dynamic command execution.

## Installation & Usage

### Quick Start
```bash
npm install
npm run cli
```

### Development Mode (with TypeScript)
```bash
npm run dev-cli
```

### After Building
```bash
npm run build
node dist/cli.js
```

## Commands Overview

### Game Management
- `new` / `create` - Create a new game engine instance
- `player <id> [name]` - Add a player to the game
- `deck <playerId> [cards...]` - Load deck for player
- `start` - Start the game
- `current <playerId>` - Set current player context

### Game State Inspection
- `state` / `status` - Show current game state summary
- `summons [playerId]` - Show summons for player
- `events` - Show recent game events
- `serialize` / `save` - Export game state as JSON

### Turn Management
- `phase` / `advance` - Advance to next phase
- `actions [playerId]` - Show legal actions for player
- `pass [playerId]` - Pass priority

### Game Actions
- `play <cardId> [x] [y] [targetId]` - Play a card
- `move <summonId> <x> <y>` - Move a summon
- `attack <attackerId> <targetId>` - Attack with summon

### Card Database
- `cards [filter]` - List available cards
- `list-cards [filter]` - Same as cards

### Utilities
- `clear` - Clear screen
- `help` / `h` - Show help

## Example Session

```
🎮 Summoner's Grid Engine CLI Tool
=====================================
summoners-grid> new
✅ Created new game engine

summoners-grid> player alice "Alice Player"
✅ Added player: Alice Player (alice)
🎯 Set current player context to: alice

summoners-grid> player bob "Bob Player"
✅ Added player: Bob Player (bob)

summoners-grid> deck alice
✅ Loaded default deck for alice (8 cards)

summoners-grid> deck bob
✅ Loaded default deck for bob (8 cards)

summoners-grid> start
✅ Game started!

🎮 Game State:
  Game ID: 12345678-1234-4567-8901-123456789012
  Turn: 1
  Phase: draw
  Current Player: alice
  Effect Stack: 0 effects
  Priority Queue: 0 windows

👥 Players:
  🎯 Alice Player (alice): 0 VP, 0 summons, 0 cards in hand
     Bob Player (bob): 0 VP, 0 summons, 0 cards in hand

summoners-grid> phase
✅ Advanced to next phase

summoners-grid> phase
✅ Advanced to next phase

summoners-grid> actions alice
🎯 Legal Actions for alice:
  1. passPriority - Pass priority
  2. advancePhase - Advance from action to end

summoners-grid> cards summon
📚 Available Cards (8 total):
  gignen-warrior-001 - Gignen Warrior (summon) - neutral
  gignen-scout-001 - Gignen Scout (summon) - neutral
  wilderling-scout-001 - Wilderling Scout (summon) - earth

summoners-grid> play gignen-warrior-001 5 2
✅ Played card: gignen-warrior-001

summoners-grid> summons alice
⚔️  Summons for Alice Player:
  ✨ summon_1234567890_abc123def - Level 5 - HP: 96/96 - Position: (5, 2)
```

## Features

### Dynamic Command Execution
- Real-time command processing with immediate feedback
- Context-aware commands with current player tracking
- Comprehensive error handling and validation

### Game State Inspection
- Live game state monitoring with formatted output
- Detailed summon and player information
- Effect stack and priority queue visualization
- Event history tracking

### Card Database Integration
- Automatic loading of card data from JSON files
- Card filtering and search capabilities
- Default deck generation for quick testing

### Action Testing
- All engine actions supported (play, move, attack, etc.)
- Legal action enumeration and validation
- Real-time action execution with state updates

### Developer-Friendly
- Clear command syntax with examples
- Comprehensive help system
- Auto-completion context hints
- Error messages with usage instructions

## Testing Scenarios

### Basic Game Flow
```bash
new
player alice "Alice"
player bob "Bob"
deck alice
deck bob
start
phase  # Level phase
phase  # Action phase
actions alice
play gignen-warrior-001 5 2
summons alice
```

### Combat Testing
```bash
# After deploying summons for both players
attack summon_123_abc summon_456_def
events
state
```

### TRR System Testing
```bash
# Play cards to build effect stack
play 005-sharpened-blade summon_123_abc
play 001-blast-bolt summon_456_def
actions bob  # Check response options
pass bob
state  # See effect resolution
```

### Priority System Testing
```bash
play 006-healing-hands summon_123_abc
actions bob  # Non-turn player gets first response
pass bob
pass alice  # Both pass, effects resolve
```

This CLI tool provides comprehensive access to all engine functionality for thorough manual testing and exploration of the TRR system, game mechanics, and edge cases.