# Handoff

## State
Branch `ralphs-here` (~80 commits, all pushed). Production-ready F2P tactical card game. 9 screens, 387 tests, full coin economy (starter pack + daily bonus + win/loss rewards + ranks), dopamine pack opening, collection with card detail popup, deck builder with total power, smart AI targeting, 210 species-themed names, 12 AI art assets, procedural audio, fade transitions, particles. Export builds: Linux 71MB, Windows 103MB. Auth coded but needs Supabase credentials.

## Next
1. **Supabase** — `! npx supabase login` or supabase.com project → `user://supabase_config.json`
2. **Stripe** — coin purchases with real money
3. **Steam** — $100 at partner.steamgames.com, store page draft ready

## Context
- Own stack (not Immutable). `docs/PLATFORM_OPTIONS.md`.
- All UI in Godot. No web frontend. `BLOCKED.md` has credential requests.
- 5-day sprint started 2026-04-13. User checks in hourly.
