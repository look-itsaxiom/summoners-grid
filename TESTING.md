# Testing Guide for Summoner's Grid

This document provides comprehensive testing instructions for the Summoner's Grid game mechanics.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the game in your browser:**
   Navigate to `http://localhost:8080`

3. **Open browser console (F12)** to see detailed logs during testing

---

## Test Scenario 1: Place a Summon

### Steps:
1. The game should start with 3 summon cards in hand at the bottom
2. Click on any summon card (e.g., "Gignen Warrior", "Wilderling Scout", or "Fae Magician")
3. The card should become highlighted with blue color and scale up slightly
4. A "Play Card" button should appear above the selected card
5. Click the "Play Card" button
6. Yellow instruction text should appear: "Select a valid territory space to summon"
7. The bottom 3 rows (rows 0, 1, 2) of the grid will highlight with a pulsing yellow overlay
8. Hover over any highlighted cell - the border should change to bright yellow (3px stroke)
9. Click on any cell in the highlighted area
10. A blue circular token should appear on that cell with a scale-up animation
11. The card should be removed from hand and remaining cards reposition

**Expected Result:** 
- ✅ Summon token is placed on the board
- ✅ Only summon cards trigger the grid selection mechanic
- ✅ Only the player's territory (bottom 3 rows) can be selected
- ✅ Token color matches player color (blue for Player A)

**Console Logs:**
```
[GameScene] Playing card: [Card Name] (Summon)
[SummonPlayHandler] Playing summon: [Card Name]
[SummonPlayHandler] Placing summon at (col, row)
[SummonPlayHandler] Token placed at (col, row)
[GameScene] Card played successfully: [Card Name]
```

---

## Test Scenario 2: Open Action Menu

### Steps:
1. After placing a summon (from Scenario 1)
2. Click on the placed summon token (blue circle)
3. The token should scale up slightly on hover (yellow border appears)
4. An action menu should appear above the token with two buttons:
   - "Move" button
   - "Attack" button

**Expected Result:** Action menu with Move and Attack buttons is displayed

---

## Test Scenario 3: Move Action

### Steps:
1. After opening the action menu (from Scenario 2)
2. Click the "Move" button
3. The action menu should close
4. Green highlights should appear on all empty cells
5. Instruction text should appear: "Select a space to move to"
6. Hover over an empty cell - it should highlight in green
7. Click on an empty cell
8. The summon token should animate smoothly to the new position
9. The highlights and instructions should disappear

**Expected Result:** 
- ✅ Summon moves to the selected cell with animation
- ✅ Movement is currently allowed to any empty space (no range restriction yet)

**Console Logs:**
```
[SummonPlayHandler] Summon clicked: [Summon Name]
[MoveAction] Moving summon: [Summon Name]
[MoveAction] Summon moved to position (col, row)
```

---

## Test Scenario 4: Attack Action

### Steps:
1. After opening the action menu
2. Click the "Attack" button
3. The action menu should close
4. An attack notification should appear in the center: "[Summon Name] attacks!"
5. The notification should fade out after 2 seconds

**Expected Result:** 
- ✅ Attack notification is displayed (stubbed implementation)
- ✅ Attack system is ready for expansion with target selection and damage

---

## Test Scenario 5: Action Availability

### Steps:
1. Place a summon and perform a Move action
2. Click on the summon again
3. The Move button should still appear (movement currently unrestricted)
4. Perform an Attack action
5. Click on the summon again
6. The Attack button should not appear (summon has already attacked)

**Expected Result:** 
- ✅ Actions are only available when they can be executed
- ✅ Attack action properly tracks "has attacked" state

---

## Test Scenario 6: Multiple Summons (Bug Prevention)

### Steps:
1. Place two summons on the board
2. Click first summon → Action menu appears
3. Click "Move" → Green highlights appear
4. Click second summon → First move is canceled, second action menu appears
5. Only one action is active at a time
6. Click any destination → Only the selected summon moves

**Expected Result:** 
- ✅ Multiple summons cannot be moved simultaneously
- ✅ Clicking a new summon cancels any active action

**Console Logs:**
```
[SummonPlayHandler] Summon clicked: [First Summon]
[MoveAction] Moving summon: [First Summon]
[SummonPlayHandler] Summon clicked: [Second Summon]
[SummonPlayHandler] Canceling previous active action
[MoveAction] Canceling active move action
```

---

## Known Limitations

Current implementation scope:
- Move action allows movement to any empty space (no range restriction)
- Attack action is stubbed (no target selection or damage calculation)
- Stats calculation and response windows not yet implemented
- Only Player A's territory is currently supported
- No validation for occupied spaces yet
- No turn management (actions can be performed repeatedly)

These are intentional limitations that will be addressed in future development.

---

## Architecture Notes

The implementation follows SOLID principles:

1. **Single Responsibility Principle:** Each class has one job
   - `SummonPlayHandler`: Manages summon placement and interactions
   - `SummonUnit`: Tracks summon state
   - `MoveAction`: Handles movement logic
   - `AttackAction`: Handles attack logic
   - `SummonActionMenu`: Manages action menu UI

2. **Open/Closed Principle:** New actions can be added without modifying existing code
   - Create new class implementing `ISummonAction`
   - Register in `SummonPlayHandler` constructor

3. **Liskov Substitution:** All actions are interchangeable via `ISummonAction` interface

4. **Interface Segregation:** Minimal interface with only essential methods

5. **Dependency Inversion:** `SummonPlayHandler` depends on `ISummonAction` abstraction

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.
