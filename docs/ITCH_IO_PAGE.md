# Summoner's Grid — itch.io Page Draft

## Title
Summoner's Grid

## Short Description
Tactical grid-based RPG card game. Build decks, summon creatures, and battle AI opponents on a 12x14 board.

## Classification
- **Kind:** Game
- **Genre:** Strategy, Card Game, RPG
- **Tags:** tactics, grid-based, card-game, deck-building, turn-based, pixel-art, f2p, godot
- **Platform:** Windows, Linux
- **Made with:** Godot 4.6

## Pricing
Free (with optional coin bundles when Stripe is configured)

## Description

### Summoner's Grid
A tactical grid-based RPG card game where you build decks, summon creatures, and fight for territory on a 12x14 board.

**Features:**
- 72 unique cards: summons, actions, quests, buildings, counters, reactions, advances
- 7 species with unique art and stat profiles
- 26 roles with convergence advancement system
- 5 rarity tiers from Common to Myth
- 7 elemental types with advantage cycling
- Smart AI opponent with 5-priority card evaluation
- Pack opening with dopamine-driven reveal ceremony
- Deck builder with collection management
- Procedural audio (BGM + 12 SFX)
- Match history and persistent stats
- Color blind mode (accessibility)

**Game Modes:**
- Battle vs AI — standard deck vs AI opponent
- Random Deck — procedurally generated summons
- Watch AI vs AI — spectator mode with 1x/2x/4x speed

### Early Access Alpha
This is an alpha build. All core mechanics are implemented and 124 automated tests pass. Economy, card collection, and deck building are fully functional in offline mode. Online features (accounts, cloud save, marketplace) coming soon.

## Uploads
- `summoners-grid-linux.x86_64` — Linux x86_64 build
- `summoners-grid-windows.exe` — Windows build

## Butler Upload Commands
```bash
butler push builds/summoners-grid-linux.x86_64 skibbysoft/summoners-grid:linux
butler push builds/summoners-grid-windows.exe skibbysoft/summoners-grid:windows
```

## Cover Image
Use `godot/assets/title_logo.png` or generate a 630x500 cover via ComfyUI.

## Screenshots
Capture via godot-mcp: menu, gameplay, pack opening, collection, deck builder.
