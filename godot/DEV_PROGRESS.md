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
| 17 | Effect stack (LIFO) | done | done | push/resolve/speed-lock + 16 tests |
| 18 | Play Example card-by-card verification | done | TODO | need GUT tests |

## Content & Polish (22 items) — GAME FEATURES
| # | Item | Web | Godot | Notes |
|---|------|-----|-------|-------|
| 19 | 30 action cards | done | done | 32 actions (30 base + 2 named summon) |
| 20 | 5 building cards | done | done | 5 buildings including traps |
| 21 | 6 quest cards | done | done | 6 quests with VP + buff rewards |
| 22 | 5 counter + 3 reaction cards | done | done | 5 counters + 3 reactions in cards.gd |
| 23 | 14 advance cards (3 named summons) | done | done | 14 advances incl 3 named summons |
| 24 | 14 equipment items | done | done | 6 wpn + 4 armor + 4 acc |
| 25 | Procedural SFX | done | done | 12 sounds (sfx.gd) |
| 26 | Keyboard shortcuts | done | done | 1-9, E, Esc |
| 27 | Color blind mode | done | TODO | |
| 28 | Card inspector (right-click) | done | TODO | |
| 29 | Match history | done | TODO | |
| 30 | Save/load game | done | done | JSON to user://savegame.json |
| 31 | Screen shake on crits | done | done | intensity 12 crit, 4 normal |
| 32 | Floating damage numbers | done | done | floating_number.gd |
| 33 | SVG minimap | done | N/A | not needed in Godot |
| 34 | Turn transition banners | done | done | turn_banner.gd |
| 35 | Spectator mode + speed control | done | PARTIAL | spectator works, no speed control |
| 36 | Tutorial / How to Play | done | TODO | |
| 37 | Coin flip turn order | done | done | |
| 38 | Deck preview screen | done | TODO | |
| 39 | Persistent settings | done | TODO | |
| 40 | Weapon range visualization | done | TODO | |

## Visual Polish (15 items) — GAME LOOK
| # | Item | Web | Godot | Notes |
|---|------|-----|-------|-------|
| 41 | Card art (per species/rarity) | todo | TODO | |
| 42 | Grid tile textures | done | PARTIAL | colored rects, no texture |
| 43 | Summon sprites on board | todo | TODO | text labels currently |
| 44 | Card play animations | todo | TODO | |
| 45 | Attack animations | todo | TODO | |
| 46 | Movement trail | todo | TODO | |
| 47 | Level-up VFX | todo | TODO | |
| 48 | Elemental VFX | todo | TODO | |
| 49 | HP bar styling | done | PARTIAL | basic bar, no glow/gradient |
| 50 | Card hover preview | todo | TODO | |
| 51 | Board zoom + pan | todo | TODO | |
| 52 | Background music | todo | TODO | |
| 53 | UI skin / theme | todo | TODO | code-generated, no theme resource |
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

## PRIORITY ORDER (Godot-specific)
1. **Fix visual bugs** (text truncation, centering, highlights) — IN PROGRESS
2. **Wire remaining card effects** (Sharpened Blade, counters, quests)
3. **Port remaining cards** (7 actions, 3 buildings, 4 quests, 8 counters/reactions, 7 advances)
4. **Territory control VP** (end-of-turn check)
5. **UI theme** (StyleBoxFlat dark fantasy theme resource)
6. **Card hover preview** (enlarged tooltip)
7. **Screen shake + attack animations** (juice)
8. **Save/load game** (ResourceSaver)
9. **Deck preview screen** (pre-game)
10. **Tutorial overlay**
