# Handoff

## State
Branch `ralphs-here` (~90 commits this session, all pushed). Production-ready F2P card game: 9 screens, 387 tests. Features: coin economy (starter pack, daily bonus, win/loss rewards, greyed-out unaffordable packs, coins-to-next-pack counter), dopamine pack opening (click-to-reveal, sprites, rarity glow), collection (detail popup, NEW badges, filter counts, rarity breakdown), deck builder (total power, gameplay connection), smart AI targeting (HP-weighted), player rank system (Novice→Legend with RANK UP celebration), 210 species-themed names, 12 AI art assets, procedural audio, fade transitions, particles. Builds: Linux 71MB, Windows 103MB.

## Next
1. **Supabase** — `! npx supabase login` or supabase.com → `user://supabase_config.json`
2. **Stripe** — real money coin purchases
3. **Steam** — $100 at partner.steamgames.com, store page ready: `docs/STEAM_STORE_PAGE.md`

## Context
- Own stack, not Immutable. `BLOCKED.md` + `docs/PLATFORM_OPTIONS.md`.
- All UI in Godot. Pack opening uses invisible Button click catcher (z_index=10).
- 5-day sprint from 2026-04-13. User wants production-grade, dopamine, soul+greed.
