# Handoff

## State
Branch `ralphs-here` (~65 commits, all pushed to GitHub). Complete F2P card game: 9 screens (login/splash, menu with particles, pack store with coin economy, dopamine pack opening with click-to-reveal, collection with species sprites + card frames, deck builder → gameplay connection, deck preview, full tactical combat board, how-to-play tutorial). 107 Godot + 280 web = 387 tests. Coin economy (start 500, win +150, lose +50, standard pack 300, premium 1000). Card stats with power levels (70-129 based on rarity). Species-themed names with legendary titles. Fade transitions, procedural audio (12 SFX + 4 BGM), 12 AI art assets. Auth system coded but needs Supabase credentials.

## Next
1. **Supabase credentials** — run `! npx supabase login` or create project at supabase.com → save URL + anon key to `user://supabase_config.json`. Auth code ready in `godot/scripts/engine/auth.gd`.
2. **Stripe integration** — for real pack purchases. Security architecture in `docs/SECURITY_ARCHITECTURE.md`.
3. **Steamworks account** — $100 at partner.steamgames.com. Store page draft ready: `docs/STEAM_STORE_PAGE.md`.

## Context
- Immutable abandoned (Hub gated). Decision: own stack (Supabase + Stripe + Steam). See `docs/PLATFORM_OPTIONS.md`.
- All UI in Godot, no web frontend. Next.js is API-only backend (`app/api/`).
- Pack opening uses full-screen invisible Button as click catcher (z_index=10).
- `BLOCKED.md` has Supabase login request. Axiom checks in hourly, 5-day sprint (started 2026-04-13).
- User wants: production-grade, secure, dopamine pack opening, everything in game client, the soul of game design with the greed of monetization.
