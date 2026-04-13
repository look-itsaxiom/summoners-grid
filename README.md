# Summoner's Grid

**Tactical grid-based RPG card game.** Collect cards, build decks, and command summons on a 12x14 battlefield.

## Play

Download the latest build from `builds/` or run from source:

```bash
# Godot 4.6+ required
cd godot/
godot --path .
```

## Features

- **Tactical Combat** — Turn-based grid battles with 72 unique cards, 7 species, 26 roles
- **Card Collection** — Open packs, build your collection, chase rare and mythic cards
- **Deck Building** — Select 3 summons from your collection and take them into battle
- **F2P Economy** — Earn coins by playing, spend on packs, daily login bonus
- **Pack Opening** — Dopamine-driven card reveal with rarity escalation
- **Player Rank** — Novice to Legend progression based on wins
- **AI Opponent** — Smart targeting with 5-priority card evaluation
- **Procedural Audio** — 12 SFX + 4 background music tracks, all generated in code

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Game Client | Godot 4.6 (GDScript) |
| Web Reference | TypeScript + React + Zustand |
| API Backend | Next.js (App Router) |
| Database | SQLite (better-sqlite3) |
| Art Pipeline | ComfyUI (Animagine XL 4.0) |
| Auth | Supabase (ready, needs credentials) |

## Tests

```bash
# Godot engine tests (107)
cd godot/ && godot --headless --script test/test_runner.gd

# Web prototype tests (280)
npx vitest run
```

## Project Structure

```
godot/           — Godot 4 game client (active development)
  scripts/
    engine/      — Game logic, stats, cards, auth, storage
    data/        — Card data, species, roles
    ui/          — All 9 screen scripts
  scenes/        — Scene files (.tscn)
  assets/        — Sprites, card frames
  test/          — GUT test runner
src/             — Web prototype (reference implementation, 280 tests)
app/api/         — Next.js API routes
docs/            — Architecture, security, Steam store page, etc.
builds/          — Export builds (Linux + Windows)
```

## Documentation

- [Game Design Document](Summoner's%20Grid%20GDD.md) — Authoritative game rules
- [Product Architecture](docs/PRODUCT_ARCHITECTURE.md) — Full system overview
- [Security Architecture](docs/SECURITY_ARCHITECTURE.md) — Threat model
- [Steam Store Page](docs/STEAM_STORE_PAGE.md) — Draft listing
- [Changelog](CHANGELOG.md) — v0.1.0-alpha release notes

## License

Proprietary. Copyright 2026 SkibbySoft.
