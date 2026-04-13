# Handoff

## State
Branch `ralphs-here`, v0.3.0-alpha. 70 session commits. 127 tests. itch.io DRAFT (web+linux+windows). Visual overhaul: CardWidget, Kenney theme, ComfyUI art, Cinzel/Lato fonts, 479+ art assets. Board has 36px sprites + purple arena bg. Marketplace, forge, campaign, achievements, daily challenges built.

## Next
1. **Visual quality** — keep improving board, card rendering, screen polish toward MTG Arena tier
2. **itch.io launch** — screenshots, GIF, custom CSS page, then go public properly
3. **Supabase** — P2P marketplace needs accounts
4. **Game hook** — define what makes this game unique in one sentence

## Context
- CardWidget: `scripts/ui/card_widget.gd` — used in hand/collection/pack/forge
- ThemeLoader: global Kenney textures on all Button/Panel/Label
- ComfyUI: 30 steps, cfg 8.0 for quality. Animagine XL 4.0 on RTX 4070
- Art: dark stone + warm gold + purple magic. v2 species portraits
- itch.io DRAFT — Axiom: don't go public until ready
- Compare to: MTG Arena, Marvel Snap, Pokemon TCG Live
- `save_collection()` not `_save()`, `game_eval` uses `#` not `//`
