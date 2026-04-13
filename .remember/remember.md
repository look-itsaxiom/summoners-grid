# Handoff

## State
Branch `ralphs-here`, v0.1.6. 39 session commits. 127 tests. itch.io page at DRAFT (reverted from public — premature launch). Marketplace built with fees (5% list, 10% sale, featured 50 coins). Campaign mode (5 stages). Achievements (10). Daily challenges (7). AI difficulty (Easy/Normal/Hard). Butler authenticated. 3 devlogs written (pacing feedback: max 2/day at noon+midnight).

## Next
1. **Launch prep** — screenshots, itch.io page polish, branding before going public
2. **Supabase auth** — needed for real P2P marketplace trading
3. **Stripe** — real money coin purchases

## Context
- itch.io: skibbysoft-games.itch.io/summoners-grid — currently DRAFT, not public
- Devlog persona: "Hex" — don't spam, save for milestones
- CardStorage save method: `save_collection()` not `_save()`
- Marketplace is local-only with NPC seeds until Supabase accounts work
- `game_eval` uses `#` comments not `//`
- Axiom wants players selling cards to EACH OTHER (the greed), not just to void
