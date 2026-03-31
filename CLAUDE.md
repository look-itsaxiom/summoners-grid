# Summoner's Grid

Tactical grid-based RPG card game. Porting from a verified web prototype to Godot 4.

## Tech Stack

- **Target:** Godot 4.x (GDScript) in `godot/`
- **Reference:** Web prototype in `src/` (Vite + React + TypeScript + Zustand + Vitest)
- **Testing:** GUT for Godot, Vitest for web reference (280 tests, all passing)
- **MCP:** `godot-mcp` for live testing and scene inspection

## Project Structure

- `Summoner's Grid GDD.md` — Game Design Document (authoritative rules reference)
- `Summoner's Grid Play Example.md` — 10-turn play example with exact numbers for verification
- `PROMPT.md` — Ralph Loop iteration prompt (Godot edition)
- `godot/` — Godot 4 project (active development)
- `src/engine/` — Verified TypeScript game logic (reference implementation, DO NOT DELETE)
- `src/components/` — React UI components (web prototype, reference only)
- `src/store/` — Zustand state management (reference only)
- `src/data/` — Card data, roles, species definitions (port to GDScript)
- `src/types/` — TypeScript type definitions (port to GDScript classes)

## Development

```bash
# Web reference (keep available for formula verification)
npm install --legacy-peer-deps
npx vite --port 5174
npm test                # 280 Vitest tests

# Godot (active development)
# Use godot-mcp tools for testing
# GUT tests in godot/test/
```

## Key Conventions

- **Port formulas exactly** from `src/engine/stats.ts` — don't re-derive
- **GDD is authoritative** for rules; web code is authoritative for formula implementation
- All Play Example numbers must match in both web and Godot
- Game engine in Godot should be autoloads/pure scripts, separate from scene tree
- AI logic ports from `src/engine/ai.ts` — 5-priority card evaluation system
- Art style target: HD-2D (Octopath Traveler) — pixel sprites on 3D-lit boards

## Game Content (72 items)

- 27 action cards, 5 buildings, 4 quests, 5 counters, 3 reactions, 9 advances
- 6 weapons, 4 armor, 4 accessories
- 7 species, 26 roles, 5 rarities, 7 elements
- 3 named summons with unique action cards

## Game Modes

1. Play vs AI (standard decks, coin flip, deck preview)
2. Random Deck Game (procedural summons)
3. Watch AI vs AI (spectator mode)
4. Pack Opening (card collection)
