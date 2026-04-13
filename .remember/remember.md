# Handoff

## State
Branch `ralphs-here`, tag `v0.1.0-alpha`. 104 session commits (232 total), all pushed. Production-ready F2P tactical card game. 27 GDScript files, 8120+ LOC, 10 scenes, 14 AI art assets. 387 tests. Full economy (coins/packs/daily/ranks/starter). Dopamine pack opening. Smart AI. Fade transitions. Procedural audio. Export builds: Linux 71MB, Windows 103MB.

## Next
1. **Supabase** — `! npx supabase login` or supabase.com → `user://supabase_config.json`
2. **Steam** — $100 at partner.steamgames.com. Store page: `docs/STEAM_STORE_PAGE.md`
3. **Stripe** — stripe.com keys. Coin bundles already in pack store UI (disabled).

## Context
- Own stack (not Immutable). All UI in Godot. No web frontend.
- Pack opening: invisible Button click catcher (z_index=10).
- `BLOCKED.md` has 3 credential requests. 5-day sprint from 2026-04-13.
