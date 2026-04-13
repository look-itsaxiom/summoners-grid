# QA — Last Run

**Date:** 2026-04-12
**Iteration:** 6 (Ralph Loop QA Rotation)
**Type:** Full — headless tests + visual QA via godot-mcp

## Headless Test Results

**107 passed, 0 failed** (up from 95 — added 12 Play Example formula tests)

## Visual QA: AI vs AI Full Game

Watched a complete AI vs AI game via godot-mcp (6 turns, Player B wins 4-2 VP).

### Verified Working
- Menu: title, subtitle, all 3 buttons, alpha build text — all centered and readable
- Game start: coin flip, turn order, draw phase skip on T1
- Summon placement: territory validation, unit appears on board with HP/level/role
- Card play: effect stack push → resolve → effect application (Sharpened Blade, Obliterate, etc.)
- Combat: to-hit rolls, crit checks, damage calculation, elemental advantage
- Healing: base + crit healing (Healing Hands verified)
- Role advancement: Warrior → Knight, Magician → Warlock (both visible on board)
- VP system: defeat VP (tier-based), territory VP
- Win condition: first to 3 VP triggers game over
- Game over screen: DEFEAT/VICTORY banner, stats summary, New Game + Main Menu buttons
- Hand display: 3-column grid, all 6 cards visible with full names and type labels
- Floating damage numbers and "DEFEATED!" text
- HP bars with color coding (green/yellow/red)
- Game log: all actions logged with turn numbers

### Visual Issues Found (not blocking, for future polish)
1. Turn banner overlay text ("Player B — Turn 3") overlaps board grid numbers at top-left
2. Board unit names truncated to 10 chars (expected at 48px cells — needs sprites eventually)
3. No card play or attack animations
4. No background music or ambient sound
5. Board uses colored rects, no tile textures

### No Bugs Found
Zero crashes, zero formula errors, zero game flow issues. The game is functionally complete for single-player.
