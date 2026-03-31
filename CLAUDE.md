# Summoner's Grid

Tactical grid-based RPG card game built for the browser.

## Tech Stack

Vite + React 18 + TypeScript (strict) + Zustand + Vitest

## Project Structure

- `Summoner's Grid GDD.md` — Game Design Document (authoritative rules reference)
- `Summoner's Grid Play Example.md` — 10-turn play example with exact numbers for verification
- `PROMPT.md` — Ralph Loop iteration prompt
- `src/engine/` — Pure TypeScript game logic (stats, AI, elements, sound, card gen, simulator)
- `src/components/` — React UI components (25 components)
- `src/store/` — Zustand state management
- `src/data/` — Card data, roles, species definitions
- `src/types/` — TypeScript type definitions

## Development

```bash
npm install
npx vite --port 5174   # Dev server (port 5173 used by another project)
npm test                # Run 58 Vitest tests
npm run build           # Production build (~300KB JS, 33KB CSS)
```

## Key Conventions

- Game engine in `src/engine/` — pure TypeScript, no React dependencies
- All GDD formulas must match exactly (verified by 31 formula tests)
- Card effects resolved in `src/store/gameStore.ts` where `set()` is available
- AI logic in `src/engine/ai.ts` — 5-priority card evaluation system
- Sound effects are procedural via Web Audio API (no external files)

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
