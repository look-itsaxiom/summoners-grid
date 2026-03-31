# Summoner's Grid

Tactical grid-based RPG card game built for the browser.

## Project Structure

- `Summoner's Grid GDD.md` — Game Design Document (authoritative rules reference)
- `Summoner's Grid Play Example.md` — 10-turn play example with exact numbers for verification
- `PROMPT.md` — Ralph Loop iteration prompt
- `src/` — Source code (Vite + React + TypeScript + Zustand)

## Development

```bash
npm install
npm run dev     # Start dev server (usually http://localhost:5173)
npm test        # Run Vitest tests
```

## Key Conventions

- Game engine logic lives in `src/engine/` — pure TypeScript, no React
- UI components live in `src/components/` — React components
- State management via Zustand in `src/store/`
- Card data defined in `src/data/`
- All formulas must match the GDD exactly
- Verify calculations against the Play Example document
