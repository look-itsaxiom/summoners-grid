# Testing Summon Action Mechanics

## Overview
This document describes how to test the newly implemented summon action mechanics (Move and Attack).

## Prerequisites
- Start the development server: `npm run dev`
- Open http://localhost:8080 in a browser

## Test Scenario 1: Place a Summon

### Steps:
1. The game should start with 3 summon cards in hand at the bottom
2. Click on any summon card (e.g., "Gignen Warrior")
3. The card should become highlighted/selected
4. A "Play Card" button should appear above the selected card
5. Click the "Play Card" button
6. The game should show yellow highlights on the bottom 3 rows (player territory)
7. Instruction text should appear: "Select a valid territory space to summon"
8. Click on any cell in the highlighted area
9. A blue circle token should appear on that cell with an animation
10. The card should be removed from hand

**Expected Result**: Summon token is placed on the board

## Test Scenario 2: Open Action Menu

### Steps:
1. After placing a summon (from Scenario 1)
2. Click on the placed summon token (blue circle)
3. The token should scale up slightly on hover
4. An action menu should appear above the token with two buttons:
   - "Move" button
   - "Attack" button

**Expected Result**: Action menu with Move and Attack buttons is displayed

## Test Scenario 3: Move Action

### Steps:
1. After opening the action menu (from Scenario 2)
2. Click the "Move" button
3. The action menu should close
4. Green highlights should appear on all empty cells
5. Instruction text should appear: "Select a space to move to"
6. Hover over an empty cell - it should highlight in green
7. Click on an empty cell
8. The summon token should animate to the new position
9. The highlights and instructions should disappear

**Expected Result**: Summon moves to the selected cell with animation

## Test Scenario 4: Attack Action

### Steps:
1. After opening the action menu
2. Click the "Attack" button
3. The action menu should close
4. An attack notification should appear in the center: "[Summon Name] attacks!"
5. The notification should fade out after 2 seconds

**Expected Result**: Attack notification is displayed (stubbed implementation)

## Test Scenario 5: Action Availability

### Steps:
1. Place a summon and perform a Move action
2. Click on the summon again
3. The Move button might show if movement is still available
4. Perform an Attack action
5. Click on the summon again
6. The Attack button should not appear (summon has already attacked)

**Expected Result**: Actions are only available when they can be executed

## Code Structure

### New Classes:
- **SummonUnit**: Tracks summon state (position, has attacked, movement used)
- **ISummonAction**: Interface for all summon actions
- **MoveAction**: Implements move logic with cell highlighting
- **AttackAction**: Implements attack (currently stubbed)
- **SummonActionMenu**: UI component for action buttons

### SOLID Principles:
- Each action is a separate class (Single Responsibility)
- New actions can be added without modifying existing code (Open/Closed)
- All actions implement ISummonAction interface (Liskov Substitution, Interface Segregation)
- Handler depends on ISummonAction abstraction (Dependency Inversion)

## Known Limitations
- Move action currently allows movement to any empty space (no range restriction)
- Attack action is stubbed (no target selection or damage calculation)
- Only one summon can be placed at a time in current test setup
- No turn management yet (actions can be performed repeatedly)

## Future Enhancements
- Add movement range restrictions based on summon stats
- Implement full attack system with target selection
- Add action restrictions based on turn rules
- Implement action undo/cancel functionality
- Add visual feedback for action states (e.g., grayed out if unavailable)
