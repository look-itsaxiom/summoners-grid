# Changelog

## v0.1.0-alpha — First Playable (2026-04-13)

### Gameplay
- Full tactical grid combat on 12×14 board with territory control
- 72 unique cards: 32 actions, 5 buildings, 6 quests, 5 counters, 3 reactions, 14 advances, 7 equipment types
- 7 species: Gignen, Fae, Stoneheart, Wilderling, Angar, Demar, Creptilis
- 26 roles across 3 families (Warrior/Magician/Scout) with Tier 1-3 advancement
- Effect stack with LIFO resolution and speed lock (Counter > Reaction > Action)
- Elemental advantage cycle: Fire > Wind > Earth > Water > Fire, Light ↔ Dark
- Smart AI opponent with HP-weighted targeting and 5-priority card evaluation
- AI turn pacing — visible delays between actions for readability
- 3 game modes: Battle vs AI, Random Deck, Watch AI vs AI

### Economy
- Coin system: earn by playing (Win +150, Lose +50), daily login bonus (+100)
- Pack Store: Standard Pack (300 coins, 5 cards) and Premium Pack (1,000 coins, 10 cards)
- 5 card rarities: Common, Uncommon, Rare, Legend, Myth — rarer = stronger stats
- Free starter pack: 3 Uncommon cards on first launch (Warrior, Magician, Scout)
- Coin bundle placeholders: $0.99–$9.99 (coming with payment integration)
- Player rank system: Novice → Apprentice → Warrior → Champion → Master → Legend

### Collection & Deck Building
- Card collection gallery with species/rarity filters and card counts
- Card detail popup: species sprite, stats grid, power level, DNA
- NEW badge on recently acquired cards
- Deck builder: select 3 summons from collection for battle
- Total deck power display
- Collected cards used in gameplay with rarity stat bonuses (1.0x–1.3x)
- 210 species-themed card names with legendary titles

### Pack Opening
- Dopamine-driven reveal ceremony: face-down mystery cards
- Click to reveal one at a time, sorted rarest-last for anticipation
- Rarity-scaled feedback: sound escalation, screen shake on Legend/Myth
- Species pixel art sprites on revealed cards
- Rarity summary on completion

### Visual & Audio
- 7 AI-generated species sprites (ComfyUI pixel art)
- 5 rarity card frame backgrounds (Common→Myth)
- Dark fantasy UI theme with styled panels and rarity-colored borders
- Checkerboard board with territory borders and unit card backgrounds
- Cell flash animations (blue=summon, light blue=move, red/gold=attack)
- Floating damage and heal numbers with screen shake on crits
- Procedural audio: 12 SFX (all game events) + 4 BGM tracks (menu/battle/victory/defeat)
- Fade transitions between all screens
- Ambient golden particles on menu

### Screens (9 total)
1. Login / Splash (Supabase-ready, guest mode)
2. Main Menu (PLAY/COLLECT columns, rank, stats, daily bonus, particles)
3. Pack Store (coin prices, affordability indicators, coin bundles)
4. Pack Opening (click-to-reveal ceremony)
5. My Collection (filters, detail popup, NEW badges, rarity breakdown)
6. Deck Builder (3-slot selection, total power, gameplay connection)
7. Deck Preview (full deck review before battle)
8. Game Board (tactical combat with all mechanics)
9. How to Play (8-section tutorial including economy)

### Technical
- 107 Godot headless tests + 280 web prototype tests = 387 total
- Persistent card storage (user:// JSON)
- Auth system ready for Supabase (email/password + session management)
- Export builds: Linux x86_64 (71MB), Windows x86_64 (103MB)
- API backend (Next.js): pack opening, collection, health endpoints
- SQLite database layer for server-side persistence
