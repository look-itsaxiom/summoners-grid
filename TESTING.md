# Manual Testing Guide for Summon Play Mechanic

## How to Test

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the game in your browser:**
   Navigate to `http://localhost:8080`

3. **Test the Summon Play Flow:**
   
   a. **Select a Summon Card:**
   - Click on any of the three summon cards in your hand (Wilderling Scout, Fae Magician, or Gignen Warrior)
   - The selected card should highlight with a blue color and scale up slightly
   - A "Play Card" button should appear above the selected card
   
   b. **Click "Play Card":**
   - Click the "Play Card" button
   - The card will be removed from your hand
   - The remaining cards will reposition themselves
   
   c. **Select Grid Position:**
   - After clicking "Play Card", you should see:
     - Yellow instruction text: "Select a valid territory space to summon"
     - The bottom 3 rows (rows 0, 1, 2) of the grid will highlight with a pulsing yellow overlay
     - These are the valid territory spaces for Player A
   
   d. **Hover Over Valid Cells:**
   - Hover your mouse over any of the highlighted cells in rows 0-2
   - The cell border should change to bright yellow (3px stroke)
   
   e. **Place the Summon:**
   - Click on any valid cell in rows 0-2
   - A blue circular token should appear in that grid space with a scale-up animation
   - The yellow highlights and instruction text should disappear
   - The summon has been successfully placed!

4. **Check Console Logs:**
   Open the browser console (F12) to see detailed logs:
   - `[GameScene] Playing card: [Card Name] (Summon)`
   - `[SummonPlayHandler] Playing summon: [Card Name]`
   - `[SummonPlayHandler] Placing summon at (col, row)`
   - `[SummonPlayHandler] Token placed at (col, row)`
   - `[GameScene] Card played successfully: [Card Name]`

## Expected Behavior

- ✅ Only summon cards trigger the grid selection mechanic
- ✅ Only the player's territory (bottom 3 rows) can be selected
- ✅ A colored circle token appears at the selected position
- ✅ The token color matches the player color (blue for Player A)
- ✅ The system is extensible for other card types (Action, Building, etc.)

## Known Limitations

- This is a basic implementation focused on the summon placement mechanic
- Stats calculation, response windows, and advanced game logic are not yet implemented
- Only Player A's territory is currently supported (easily extendable for Player B)
- No validation for occupied spaces (to be implemented later)

## Architecture Notes

The implementation follows SOLID principles:

1. **Single Responsibility Principle:** Each handler class has one job (e.g., SummonPlayHandler only handles summon placement)
2. **Open/Closed Principle:** New card types can be added by creating new handlers without modifying existing code
3. **Dependency Inversion Principle:** GameScene depends on the abstract ICardPlayHandler interface, not concrete implementations

Future card types (Action, Building, Quest, etc.) can be easily added by:
1. Creating a new handler class that implements ICardPlayHandler
2. Registering it in the CardPlayHandlerRegistry
3. No changes needed to GameScene or existing handlers
