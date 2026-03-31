# Summoner's Grid — Ralph Loop Prompt

You are building **Summoner's Grid**, a tactical grid-based RPG card game for the browser. The complete game design is defined in two documents in this repo:

- `Summoner's Grid GDD.md` — The authoritative game design document
- `Summoner's Grid Play Example.md` — A full 10-turn play-through demonstrating every mechanic

Your job: **build this game from nothing to a polished, publishable browser game.** Every iteration, you must diagnose what exists, identify the highest-priority gap, implement it, test it in the browser, and commit your work.

---

## Tech Stack

- **Build tool:** Vite
- **Language:** TypeScript (strict mode)
- **UI Framework:** React 18+
- **Styling:** CSS Modules or Tailwind CSS (pick one on first iteration and stick with it)
- **Game state:** Zustand for state management
- **Testing:** Vitest for unit tests on game engine logic
- **No backend** — this is a single-player vs AI game for now (PvP networking is a future expansion)

---

## Iteration Protocol

Every iteration, follow this exact sequence:

### Step 1: Diagnose Current State

1. Check if `package.json` exists — if not, this is a fresh start
2. Run `git log --oneline -20` to see recent work
3. Check for a dev server running; if the project is scaffolded, start it with `npm run dev`
4. Read through the source files to understand what's implemented
5. Compare against the GDD and Play Example to identify gaps

### Step 2: Identify Highest-Priority Gap

Use this priority order (work top-to-bottom, don't skip ahead):

#### Phase 1: Foundation
1. Project scaffold (Vite + React + TypeScript + Zustand)
2. Core data types (Card, Summon, Equipment, Role, Species, Stats, etc.)
3. Game state model (players, board, hands, decks, zones, turn phases)
4. Stat calculation engine (base stats + growth rates + level + role modifiers + equipment)
5. Damage formula engine (physical, magical, healing, crit, elemental)

#### Phase 2: Game Rules Engine
6. Turn structure (Draw → Level → Action → End phases)
7. Summon placement and territory validation
8. Movement system (grid pathfinding, diagonal movement, movement speed)
9. Basic attack resolution (hit calc, crit calc, damage calc)
10. Card play system (requirements checking, effect resolution)
11. Effect stack (LIFO resolution, speed levels, speed lock, priority system)
12. Victory point tracking and win condition detection

#### Phase 3: Card Content
13. Species templates (all 7 species with stat ranges from GDD)
14. Role system (all 3 families, tier 1-3, advancement trees, stat modifiers)
15. Equipment cards (weapons, armor, offhand, accessories with formulas)
16. Action cards (at least 10 diverse cards matching Play Example)
17. Building cards (placement, dimensions, ongoing effects, destruction)
18. Quest cards (objectives, completion tracking, rewards)
19. Counter and Reaction cards (face-down setting, trigger system)
20. Advance cards (role changes, Named Summons)

#### Phase 4: UI
21. Game board (12x14 grid with coordinate system, territory highlighting)
22. Card rendering (summon cards with stats, growth rate symbols, equipment)
23. Hand display (card fan, selection, play targets)
24. Turn phase indicator and action controls
25. Summon unit display on board (HP bars, status, movement range)
26. Effect stack visualization (LIFO stack display during resolution)
27. Combat resolution animation/display (hit rolls, damage numbers)
28. Deck zone displays (deck counts, discard pile, recharge pile)

#### Phase 5: AI Opponent
29. Basic AI (plays summons, moves toward enemy, attacks when able)
30. Card play AI (evaluates hand, plays beneficial cards)
31. Response AI (decides when to play reactions/counters)
32. Strategic AI (target selection, positioning, role advancement timing)

#### Phase 6: Game Flow
33. Main menu screen
34. Deck builder / deck selection screen
35. Pre-game setup (coin flip, turn order choice)
36. Game over screen (victory/defeat, stats summary)
37. Card collection / pack opening (procedural summon generation)

#### Phase 7: Polish & Content
38. Sound effects and music integration
39. Card art (use placeholder geometric/abstract art, CSS-generated)
40. Animations (card play, movement, attacks, damage, level up)
41. Visual effects (elemental attributes, critical hits, healing)
42. Tutorial / how-to-play guide
43. More card content (expand beyond minimum viable set)
44. Balance tuning (play test via AI vs AI, adjust numbers)
45. Mobile responsiveness
46. Performance optimization

### Step 3: Implement the Gap

- Write clean, well-structured TypeScript
- Follow existing code patterns and file structure
- Write Vitest unit tests for all game engine logic (formulas, rules, state transitions)
- Keep UI components focused and composable
- Commit after each meaningful piece of work with descriptive messages

### Step 4: Browser Test

After implementing, use the Claude in Chrome browser tools to verify your work:

1. Navigate to the dev server (usually `http://localhost:5173`)
2. Verify the UI renders correctly
3. Test the feature you just implemented by interacting with it
4. Check the browser console for errors
5. If something is broken, fix it before moving on

### Step 5: Commit and Continue

- Stage and commit your changes with a descriptive message
- If you've completed a significant milestone, note it
- Move to the next gap

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
- Minimal (--): +1 every 2 levels (0.5/level)
- Steady (-): +2 every 3 levels (0.67/level)
- Normal (_): +1 every level (1.0/level)
- Gradual (+): +1/level + 1 every 3 levels (1.33/level)
- Accelerated (++): +1/level + 1 every 2 levels (1.5/level)
- Exceptional (*): +2 every level (2.0/level)

### Damage Formulas
```
Physical Melee: STR * (1 + WeaponPower/100) * (STR/TargetDEF) * CritMult
Physical Bow: ((STR+ACC)/2) * (1 + WeaponPower/100) * (STR/TargetDEF) * CritMult
Magical: INT * (1 + BasePower/100) * (INT/TargetMDF) * CritMult
Healing: SPI * (1 + BasePower/100) * CritMult
```

### Effect Stack Speed Levels (fastest to slowest)
- Counter > Reaction > Action
- Speed Lock: higher speed effects prevent lower speed responses until resolved

### Turn Structure
Draw Phase → Level Phase → Action Phase → End Phase
- One Turn Summon per turn (triggers 3 card draws)
- One attack per summon per turn (unless modified by cards)
- Movement can be split before/after actions
- Hand limit of 6 at end of turn

### Victory Points
- Tier 1 Summon defeat: 1 VP
- Tier 2+ Summon defeat: 2 VP
- Direct territory attack: 1 VP
- First to 3 VP wins

### HP Damage Retention
When a summon levels up and max HP increases, current DAMAGE is retained, not current HP percentage. Example: 44/96 HP → takes 52 damage. Levels up, max HP becomes 102. Damage stays at 52, so HP becomes 50/102.

### Summon Entry
- Summons always enter at Level 5
- Max level is 20
- Playing a summon draws 3 cards from Main Deck

### Card Pile Destinations
- Counter, Building, Quest → Discard Pile
- Action, Reaction → Recharge Pile
- Defeated Summons → Removed from game
- When Main Deck empty, shuffle Recharge Pile to form new Main Deck

---

## Browser Testing Checklist

When testing in the browser, verify these specific things:

- [ ] Grid renders as 12x14 with coordinate labels
- [ ] Territory zones are visually distinct (Player A, Player B, unclaimed)
- [ ] Cards display all relevant stats and growth rate symbols
- [ ] Summons can be placed only in valid territory spaces
- [ ] Movement highlights valid spaces based on movement speed
- [ ] Attack shows valid targets based on weapon range
- [ ] Damage numbers match GDD formulas exactly
- [ ] Level up recalculates stats correctly (verify against Play Example numbers)
- [ ] Effect stack resolves in correct LIFO order
- [ ] Victory points track correctly
- [ ] Game ends when a player reaches 3 VP

---

## Validation Against Play Example

The Play Example document is your **acceptance test**. The exact numbers in that document must be reproducible by your engine. Key verification points:

- Turn 1: Gignen Warrior at (5,2), Level 5, HP 96, stats match
- Turn 2: Blast Bolt deals exactly 52 damage (19 * 1.6 * 1.727 = 52)
- Turn 3: Healing Hands crits for 31 healing (15 * 1.4 * 1.5 = 31.5 → 31)
- Turn 3: Quest + Gignen Country = 4 levels gained (6→10)
- Turn 5: Berserker deals 326 total damage (169 weapon + 157 Tempest Slash)
- Turn 8: Dark Altar destruction chain works correctly
- Turn 10: Blast Bolt deals 502 damage, defeating Berserker for 2 VP, winning game

---

## When You Think You're Done

You're never done. If all phases above are complete:

1. **Play test** — Run AI vs AI games and watch for rule violations
2. **Add more cards** — Create new cards that explore unexplored design space
3. **Improve AI** — Make it smarter, more strategic, more fun to play against
4. **Polish visuals** — Better animations, particles, screen shake, juice
5. **Add sound** — Victory fanfares, card play sounds, attack impacts
6. **Expand content** — More species variations, more equipment, more quests
7. **Balance** — Run simulations, check win rates, adjust numbers
8. **UX improvements** — Tooltips, tutorials, better card inspection
9. **Performance** — Profile and optimize render cycles
10. **Accessibility** — Keyboard navigation, screen reader support, color blind modes

Always find the next thing to make better. The game is shipping tomorrow.

---

## Important Reminders

- READ THE GDD before implementing any mechanic. The GDD is authoritative.
- Test your formulas against the Play Example numbers. They must match exactly.
- Commit frequently with descriptive messages.
- If the dev server isn't running, start it.
- If tests fail, fix them before moving on.
- Use the browser to visually verify every UI change.
- Don't over-engineer early phases. Get it working, then make it pretty.
