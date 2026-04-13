# Handoff

## State
Branch `ralphs-here` (~72 commits, all pushed). Complete F2P tactical card game: 9 screens (splash, menu w/particles+stats, pack store w/coins, dopamine pack opening w/click reveals, collection w/card detail popup+sprites+frames, deck builder→gameplay, deck preview, combat board w/AI pacing, tutorial). 387 tests. Coin economy (500 start, win+150/lose+50, packs 300/1000). Free starter pack (3 uncommon cards on first launch). Card stats w/power levels (70-129). 210 species-themed names w/legendary titles. Fade transitions. 12 AI art assets. Procedural audio. Auth+login ready for Supabase. Export builds (71MB Linux, 103MB Windows).

## Next
1. **Supabase** — `! npx supabase login` or create project at supabase.com. Auth code ready: `godot/scripts/engine/auth.gd`.
2. **Stripe** — for coin purchases. Security model: `docs/SECURITY_ARCHITECTURE.md`.
3. **Steam** — $100 at partner.steamgames.com. Store page: `docs/STEAM_STORE_PAGE.md`.

## Context
- Immutable abandoned. Own stack: Supabase+Stripe+Steam. See `docs/PLATFORM_OPTIONS.md`.
- All UI in Godot. No web frontend. Next.js is API-only.
- Pack opening uses invisible Button click catcher (z_index=10).
- `BLOCKED.md` has Supabase request. 5-day sprint started 2026-04-13.
- User wants: production-grade, secure, dopamine, soul+greed, everything in-game.
