# Handoff

## State
Branch `ralphs-here`, v0.2.8-alpha. 64 session commits. 127 tests. itch.io DRAFT with web+linux+windows builds. Major visual overhaul: CardWidget renders cards consistently across hand/collection/pack opening/forge. Global Kenney theme (ThemeLoader autoload). ComfyUI backgrounds on 6 screens + board arena. Cinzel+Lato fonts. 479+ art assets.

## Next
1. **Keep polishing visuals** — board units need CardWidget treatment, more ComfyUI art quality passes
2. **itch.io launch prep** — screenshots, GIF cover, custom CSS page, THEN go public
3. **Supabase auth** — P2P marketplace needs accounts
4. **Define the hook** — what sells this game in one sentence?

## Context
- CardWidget at `scripts/ui/card_widget.gd` — reusable card renderer (mini+full modes)
- ThemeLoader autoload applies Kenney textures globally to all Button/Panel/Label
- Art direction: dark stone + warm gold + purple magic (ComfyUI + Kenney brown)
- ComfyUI: 30 steps, cfg 8.0 for better quality
- itch.io DRAFT — don't go public until properly ready
- `save_collection()` not `_save()`, `game_eval` uses `#` not `//`
- Axiom: compare to MTG Arena/Marvel Snap/Pokemon TCG Live — that's the bar
