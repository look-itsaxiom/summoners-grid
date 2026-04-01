# Summoner's Grid — Godot 4

Tactical grid-based RPG card game. Ported from verified web prototype.

## Quick Start

1. Open `project.godot` in Godot 4.3
2. Hit F5 to play

## Game Modes

- **Play vs AI** — Standard decks, coin flip turn order
- **Random Deck Game** — Procedural summons every game
- **Watch AI vs AI** — Spectator mode with turn banners

## Controls

| Key | Action |
|-----|--------|
| 1-9 | Select card from hand |
| E | End turn |
| Esc | Deselect |
| Mouse | Click to place, move, attack, target |

## How to Play

1. Place summons in your territory (green zone)
2. Move toward enemies (blue highlights)
3. Attack when in weapon range (red highlights)
4. Play action cards from hand on targets
5. Advance roles when summons reach required level (purple cards)
6. First to 3 VP wins (defeat summons + control territory)

## Running Tests

```bash
godot --headless --script test/test_runner.gd
```

56 tests covering stats, damage, elements, game flow, placement, and combat.

## Project Structure

```
scripts/
  engine/    — Game logic (stats, game_manager, summon_factory, sfx, constants)
  data/      — Card database, species, roles
  ui/        — Board, game screen, menus, floating numbers, turn banner
scenes/      — menu.tscn (main), game.tscn, main.tscn (formula verification)
test/        — Headless test runner
```

## Stats

- 15 GDScript files, ~3,600 lines
- 8 autoloads
- 43 cards (6 summons, 23 actions, 2 quests, 2 buildings, 7 advances + 3 equipment types)
- 7 species, 27 roles across 3 families
- 12 procedural sound effects
