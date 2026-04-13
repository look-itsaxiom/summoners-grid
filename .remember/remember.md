# Handoff

## State
Branch `ralphs-here`. 29 commits this session. 127 tests. Game LIVE on itch.io (skibbysoft-games.itch.io/summoners-grid) with v0.1.2-alpha builds (Linux+Windows). 2 devlogs published as "Hex" persona. 32 GDScript files, 12 scenes, 21 art assets. Achievements (10), daily challenges (7), AI difficulty (Easy/Normal/Hard) all shipped.

## Next
1. **Cover image** — upload `docs/screenshots/cover_630x500.png` to itch.io edit page
2. **Supabase auth fix** — signups failing with "email_address_invalid", key works for API
3. **Page visibility** — flip itch.io from Restricted to Public when ready
4. **Stripe** — coin bundle payments when keys provided

## Context
- Butler authenticated, builds auto-push via `butler push builds/... skibbysoft-games/summoners-grid:linux`
- Devlog persona is "Hex" — casual-technical, specific numbers, ends with "What's Next"
- Achievements persist to `user://achievements.json`, toast via CanvasLayer
- Daily challenges rotate by date hash, 7 types, checked after each match
- game_eval uses GDScript `#` comments, not `//`
