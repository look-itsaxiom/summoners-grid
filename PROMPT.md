# Summoner's Grid — Ralph Loop Prompt (Godot Edition)

You are porting **Summoner's Grid** from a verified web prototype to a polished Godot 4 game. The complete game design is defined in two documents in this repo:

- `Summoner's Grid GDD.md` — The authoritative game design document
- `Summoner's Grid Play Example.md` — A full 10-turn play-through demonstrating every mechanic

The web prototype in `src/` has a **fully verified game engine** (280 tests, all formulas matching the Play Example). Your job: **rebuild this as a native Godot 4 game** using the web engine as your reference implementation. Every iteration, diagnose what exists, identify the highest-priority gap, implement it, test it via Godot MCP, and commit.

---

## Tech Stack

- **Engine:** Godot 4.x (GDScript)
- **Project root:** `godot/` directory (keep web prototype in `src/` as reference)
- **Testing:** GUT (Godot Unit Testing) for formula verification
- **Art style target:** HD-2D (Octopath Traveler) — pixel sprites on 3D-lit boards
- **Audio:** Procedural + asset-based
- **MCP:** Use `godot-mcp` tools for live testing, scene inspection, property manipulation

---

## Reference Implementation

The web prototype (`src/engine/`) contains verified formulas you must match exactly:

- `src/engine/stats.ts` — Stat calculation, growth rates, damage formulas
- `src/engine/ai.ts` — AI opponent logic (5-priority card evaluation)
- `src/engine/cardEffects.ts` — Card effect resolution
- `src/engine/elements.ts` — Elemental advantage cycle
- `src/engine/sound.ts` — Procedural SFX (port to Godot AudioServer)
- `src/store/gameStore.ts` — Game state machine (turn phases, VP tracking, effect stack)
- `src/data/cards.ts` — All 72 card definitions
- `src/types/index.ts` — Type definitions → GDScript classes

Use these as your source of truth. When in doubt, read the web code.

---

## Iteration Protocol

Every iteration, follow this exact sequence:

### Step 1: Diagnose Current State

1. Check if `godot/project.godot` exists — if not, this is a fresh start
2. Run `git log --oneline -20` to see recent work
3. Use Godot MCP tools to inspect the running project if possible
4. Read through the Godot source files to understand what's implemented
5. Compare against the priority list below to identify gaps

### Step 2: Identify Highest-Priority Gap

Use this priority order (work top-to-bottom, don't skip ahead):

#### Phase 1: Godot Foundation
1. Project scaffold (Godot 4 project, folder structure, autoloads)
2. Core data classes (Card, Summon, Equipment, Role, Species as Resources/RefCounted)
3. Game state autoload (players, board, hands, decks, zones, turn phases)
4. Stat calculation (port stats.ts — base stats + growth rates + level + role + equipment)
5. Damage formulas (port all 4: physical melee, physical bow, magical, healing)

#### Phase 2: Game Rules Engine
6. Turn structure (Draw → Level → Action → End phases)
7. Summon placement and territory validation (12x14 grid)
8. Movement system (Chebyshev distance, movement speed from SPD)
9. Basic attack resolution (hit calc, crit calc, damage calc)
10. Card play system (requirements checking, effect resolution)
11. Effect stack (LIFO resolution, speed levels, counter > reaction > action)
12. Victory point tracking and win condition (first to 3 VP)

#### Phase 3: Card Content
13. Species templates (all 7 species with stat ranges from GDD)
14. Role system (3 families, tier 1-3, advancement trees, 27 roles)
15. Equipment cards (weapons, armor, offhand, accessories)
16. Action cards (port all 30 from web)
17. Building cards (placement, dimensions, ongoing effects)
18. Quest cards (objectives, completion, level rewards)
19. Counter and Reaction cards (face-down, trigger system)
20. Advance cards (role changes, Named Summons)

#### Phase 4: Godot Scenes & UI
21. Game board scene (12x14 TileMap or GridContainer, territory highlighting)
22. Card scene (PackedScene with stats, art frame, rarity border)
23. Hand display (card fan, selection, play targets)
24. Turn phase HUD (indicator, action controls, End Turn button)
25. Summon unit scene (sprite, HP bar, level label, status indicators)
26. Effect stack panel (LIFO stack display during resolution)
27. Combat popup (hit rolls, damage numbers, floating text)
28. Deck zone displays (deck counts, discard pile, recharge pile)

#### Phase 5: AI Opponent
29. Basic AI (port ai.ts — summon placement, movement, attacks)
30. Card play AI (5-priority evaluation: emergency heal → buff → damage → heal → quest)
31. Response AI (counter/reaction face-down and trigger decisions)
32. Strategic AI (target selection, positioning, advance timing)

#### Phase 6: Game Flow Scenes
33. Main menu scene
34. Deck builder / selection scene
35. Pre-game setup (coin flip, turn order)
36. Game over screen (victory/defeat, stats summary)
37. Pack opening scene (procedural summon generation with DNA system)

#### Phase 7: Polish & Art
38. Pixel art summon sprites (per species, idle animation)
39. Board tile art (territory themes, neutral zone)
40. Card art frames (rarity borders, element icons, equipment slots)
41. Attack/spell VFX (particles, shader effects)
42. Movement trails and placement effects
43. Level-up VFX (glow burst, stat popup)
44. Sound effects (port procedural SFX or use asset-based)
45. Background music (menu, battle, victory/defeat stingers)
46. Screen transitions and juice (shake, flash, bounce)

---

## Key GDD Rules to Get Right

These are the most important mechanics — get them exactly right per the GDD:

### Stat Calculation
```
FinalStat = (BaseStat + Floor(Level * GrowthRate)) * RoleModifier + EquipmentBonus
Max HP = 50 + Floor(END^1.5)
Movement Speed = 2 + Floor((SPD - 10) / 5)
Critical Hit Chance = Floor((LCK * 0.3375) + 1.65)
```

### Growth Rate Types
- Minimal (--): 0.5/level
- Steady (-): 0.67/level
- Normal (_): 1.0/level
- Gradual (+): 1.33/level
- Accelerated (++): 1.5/level
- Exceptional (*): 2.0/level

### Damage Formulas
```
Physical Melee: STR * (1 + WeaponPower/100) * (STR/TargetDEF) * CritMult
Physical Bow: ((STR+ACC)/2) * (1 + WeaponPower/100) * (STR/TargetDEF) * CritMult
Magical: INT * (1 + BasePower/100) * (INT/TargetMDF) * CritMult
Healing: SPI * (1 + BasePower/100) * CritMult
```

### Turn Structure
Draw Phase → Level Phase → Action Phase → End Phase

### Victory Points
- Tier 1 Summon defeat: 1 VP
- Tier 2+ Summon defeat: 2 VP
- Direct territory attack: 1 VP
- First to 3 VP wins

### HP Damage Retention
Damage is retained on level-up, not HP percentage.

---

## Godot MCP Testing

Use the `godot-mcp` tools to verify your work:

- `mcp__godot-mcp__run_project` — Launch the game
- `mcp__godot-mcp__game_get_scene_tree` — Inspect node hierarchy
- `mcp__godot-mcp__game_get_property` — Read node properties
- `mcp__godot-mcp__game_set_property` — Modify values live
- `mcp__godot-mcp__game_call_method` — Call methods on nodes
- `mcp__godot-mcp__game_screenshot` — Capture visual state
- `mcp__godot-mcp__game_eval` — Run arbitrary GDScript

### Formula Verification via MCP
```
# Example: verify stat calculation matches web prototype
game_eval: "Stats.calculate_final_stat(10, 5, 1.0, 1.1, 0)"
# Should return: (10 + floor(5 * 1.0)) * 1.1 + 0 = 16.5 → 16
```

---

## Validation Against Play Example

The Play Example document is your **acceptance test**. Port these exact checks to GUT:

- Turn 1: Gignen Warrior at (5,2), Level 5, HP 96, stats match
- Turn 2: Blast Bolt deals exactly 52 damage
- Turn 3: Healing Hands crits for 31 healing
- Turn 5: Berserker deals 326 total damage
- Turn 10: Blast Bolt deals 502 damage, winning the game

---

## When You Think You're Done

1. **Play test** — Run via Godot MCP, watch for rule violations
2. **Compare to web** — Run same scenarios in both, numbers must match
3. **Add art** — Pixel sprites, tile textures, card frames
4. **Improve AI** — Port all 5 priority levels, make it strategic
5. **Polish** — Particles, screen shake, transitions, juice
6. **Sound** — SFX for every action, BGM for every scene
7. **Mobile** — Touch input, responsive scaling
8. **Export** — Build for desktop (Windows/Linux/Mac) and mobile (Android/iOS)

---

## Important Reminders

- READ THE GDD before implementing any mechanic. The GDD is authoritative.
- READ THE WEB CODE (`src/engine/`) for verified formulas. Port, don't re-derive.
- Test formulas against the Play Example numbers. They must match exactly.
- Use Godot MCP tools to inspect and test the running game.
- Commit frequently with descriptive messages.
- Don't over-engineer early phases. Get it working, then make it pretty.
- The web prototype stays in `src/` as reference — don't delete it.
