# Summoner's Grid — Godot Dev Progress

Tracks web→Godot port status AND new Godot-only features.
Check this file every Ralph Loop iteration.

## Correctness (18 items) — ENGINE FORMULAS
| # | Item | Web | Godot | Notes |
|---|------|-----|-------|-------|
| 1 | Stat calculation formulas | done | done | 56 headless tests |
| 2 | Damage formulas (melee/ranged/magic/heal) | done | done | stats.gd verified |
| 3 | HP Damage Retention on level-up | done | done | headless test |
| 4 | Elemental advantage cycle | done | done | headless test |
| 5 | Critical hit chance formula | done | done | headless test |
| 6 | Growth rate values (6 tiers) | done | done | constants.gd |
| 7 | Role system (27 roles, convergence) | done | done | roles.gd |
| 8 | Species stat ranges (7 species) | done | done | species.gd |
| 9 | VP awards (Tier 1=1VP, Tier 2+=2VP) | done | done | game_manager.gd |
| 10 | Territory control VP | done | done | end_action_phase checks territory |
| 11 | Turn structure (draw skip T1, hand limit) | done | done | verified in playtest |
| 12 | Card play: Sharpened Blade +10 WP | done | done | _resolve_buff_effect checks id |
| 13 | Counter/reaction trigger system | done | done | check_triggers + Dramatic Return/Graverobbing/Iron Will |
| 14 | Quest completion + level rewards | done | done | +2 levels + VP award implemented |
| 15 | Role advancement stat recalc | done | done | headless test |
| 16 | AI vs AI games complete without crashes | done | done | spectator mode works |
| 17 | Effect stack (LIFO) | done | done | push/resolve/speed-lock + 16 tests, verified in-game via godot-mcp |
| 18 | Play Example card-by-card verification | done | done | Both engines agree (web=godot). Play Example doc has slightly different stat values than formulas produce — formulas are authoritative per GDD. 95 headless tests passing. |

## Content & Polish (22 items) — GAME FEATURES
| # | Item | Web | Godot | Notes |
|---|------|-----|-------|-------|
| 19 | 30 action cards | done | done | 32 actions (30 base + 2 named summon) |
| 20 | 5 building cards | done | done | 5 buildings including traps |
| 21 | 6 quest cards | done | done | 6 quests with VP + buff rewards |
| 22 | 5 counter + 3 reaction cards | done | done | 5 counters + 3 reactions in cards.gd |
| 23 | 14 advance cards (3 named summons) | done | done | 14 advances incl 3 named summons |
| 24 | 14 equipment items | done | done | 6 wpn + 4 armor + 4 acc |
| 25 | Procedural SFX | done | done | 12 sounds (sfx.gd), all wired to game events |
| 26 | Keyboard shortcuts | done | done | 1-9, E, Esc |
| 27 | Color blind mode | done | done | Blue/Orange palette for teams + territory, toggle in Settings |
| 28 | Card inspector (right-click) | done | done | Popup panel: name, role, species, element, HP, all 9 stats, equipment, movement |
| 29 | Match history | done | done | Scrollable table (result/mode/turns/date), W/L stats, alternating rows |
| 30 | Save/load game | done | done | JSON to user://savegame.json |
| 31 | Screen shake on crits | done | done | intensity 12 crit, 4 normal |
| 32 | Floating damage numbers | done | done | floating_number.gd + green heal numbers |
| 33 | SVG minimap | done | N/A | not needed in Godot |
| 34 | Turn transition banners | done | done | turn_banner.gd |
| 35 | Spectator mode + speed control | done | done | 1x/2x/4x buttons, all delays scaled by speed multiplier |
| 36 | Tutorial / How to Play | done | done | how_to_play.gd — objective, turns, cards, combat, VP, elements, tips |
| 37 | Coin flip turn order | done | done | |
| 38 | Deck preview screen | done | done | shows summons+stats, main deck by type, advance deck, START/BACK |
| 39 | Persistent settings | done | done | Settings screen (audio/gameplay toggles), ConfigFile save/load, volume via AudioServer |
| 40 | Weapon range visualization | done | done | Hover shows Chebyshev range overlay (orange tint) + sidebar stats |

## Visual Polish (15 items) — GAME LOOK
| # | Item | Web | Godot | Notes |
|---|------|-----|-------|-------|
| 41 | Card art (per species/rarity) | todo | TODO | |
| 42 | Grid tile textures | done | done | checkerboard pattern + territory borders, code-drawn |
| 43 | Summon sprites on board | todo | done | 7 species sprites loaded, 28px in 48px cells, text fallback for missing |
| 44 | Card play animations | todo | done | Summon appear (scale-in), action card target flash, SFX wired |
| 45 | Attack animations | todo | done | Lunge toward target + hit flash + screen shake |
| 46 | Movement trail | todo | done | Smooth slide tween between cells (0.2s) |
| 47 | Level-up VFX | todo | done | Golden ring expansion + "LV UP!" floating text + cell flash |
| 48 | Elemental VFX | todo | done | Element-colored cell flash + damage numbers (fire=orange, water=blue, etc.) |
| 49 | HP bar styling | done | done | Gradient highlight on top half, color-coded (green/yellow/red) |
| 50 | Card hover preview | todo | done | card detail panel in sidebar + unit stat panel |
| 51 | Board zoom + pan | todo | TODO | |
| 52 | Background music | todo | done | procedural BGM: menu, battle, victory, defeat (bgm.gd) |
| 53 | UI skin / theme | todo | done | dark fantasy theme, styled panels, per-type card colors, game over panel |
| 54 | Responsive layout | todo | TODO | |
| 55 | Turn timer visual | todo | TODO | |

## Infrastructure (18 items) — PLATFORM
| # | Item | Web | Godot | Notes |
|---|------|-----|-------|-------|
| 56 | Card DNA system (128-bit hex) | done | TODO | port from src/engine/dna.ts |
| 57 | DNA → SummonCard reconstruction | done | TODO | |
| 58 | DNA → NFT metadata (ERC-721) | done | N/A | backend concern |
| 59 | DNA → Art prompt (ComfyUI) | done | N/A | backend concern |
| 60 | DNA → Sprite prompt | done | N/A | backend concern |
| 61 | DNA validation + checksum | done | TODO | |
| 62 | Platform GDD document | done | done | exists |
| 63-68 | API routes, auth, NFT minting | various | N/A | backend/web concerns |
| 69 | ComfyUI art pipeline | done | N/A | separate service |
| 70 | Marketplace / Auction House | todo | TODO | |

## Production (16 items) — DEVOPS
All TODO — these are backend/platform concerns, not Godot-specific.

## Multiplayer (6 items)
All TODO — PvP matchmaking, real-time sync, anti-cheat, friends, leaderboards, chat.

## Economy (8 items)
All TODO — pack store, marketplace, trading, royalties, rewards.

---

## PRIORITY ORDER (Godot-specific, updated 2026-04-12)
~~1. Fix visual bugs~~ — DONE (menu layout, hand grid, card labels)
~~2. Wire remaining card effects~~ — DONE (effect stack LIFO, all cards)
~~3. Port remaining cards~~ — DONE (72 items)
~~4. Territory control VP~~ — DONE
~~5. UI theme~~ — DONE (dark fantasy, styled panels, card colors)
~~6. Card hover preview~~ — DONE (card detail + unit stat panels)
~~7. Screen shake~~ — DONE (crit=12, normal=4)
~~8. Save/load game~~ — DONE

### Current priorities (revenue-focused):
1. ~~**Card play + attack animations**~~ — DONE (lunge, hit flash, movement slide, summon appear)
2. ~~**Background music**~~ — DONE
3. ~~**Deck preview screen**~~ — DONE
4. ~~**Tutorial overlay**~~ — DONE
5. ~~**Export builds**~~ — DONE
6. ~~**Summon sprites**~~ — DONE
7. **HP bar glow/gradient** (polish)
8. **Level-up VFX** (particles/flash on level)
9. **Spectator speed control** (1x/2x/4x)
10. **Color blind mode**
