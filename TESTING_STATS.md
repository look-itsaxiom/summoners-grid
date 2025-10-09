# Manual Testing Guide for Summon Stats System

## Overview
This guide walks through testing the newly implemented summon stats system.

## Test Cases

### Test 1: Verify Summon Starts at Level 5
**Steps:**
1. Load the game
2. Click "Next Phase" twice to advance to Action Phase
3. Select a summon card from your hand (e.g., Gignen Warrior)
4. Click "Play Card" button
5. Click on a highlighted territory cell (blue area at bottom)
6. Click on the placed summon token

**Expected Result:**
- A detail box appears on the left showing:
  - Name: "Gignen Warrior"
  - Level: 5
  - HP: 102/102
  - MV: 2
  - All 9 stats: STR 19, END 14, DEF 16, INT 15, SPI 14, MDF 11, SPD 13, LCK 21, ACC 12
  - Growth rate symbols next to each stat
  - To-Hit: 91%
  - Crit: 9%

### Test 2: Verify Leveling During Level Phase
**Setup:** Complete Test 1 first

**Steps:**
1. Click "Next Phase" to advance to End Phase
2. Click "Next Phase" to complete turn and advance to next turn's Draw Phase
3. Click "Next Phase" to advance to Level Phase (summon levels up automatically)
4. Click "Next Phase" to advance to Action Phase
5. Click on your summon token again

**Expected Result:**
- Detail box shows:
  - Level: 6 (increased from 5)
  - HP: 102/108 (max HP increased from 102 to 108)
  - MV: 2 (unchanged)
  - STR 20, END 15, DEF 17, INT 16, SPI 15, MDF 12, SPD 14, LCK 22, ACC 13
  - All stats increased by their growth rates
  - Current HP remained at 102 (damage retention working)

### Test 3: Verify HP Damage Retention
**Setup:** Complete Test 1 first

**Steps:**
1. Manually modify summon HP in console (for testing):
   ```javascript
   // This is a conceptual test - actual damage will come from combat
   ```
2. Level up the summon by advancing turns
3. Verify that damage taken remains the same

**Expected Result:**
- If summon had 80/102 HP at level 5:
  - After leveling to 6, should have 80/108 HP
  - The 22 damage taken is preserved
  - Max HP increased but current HP gained the difference

### Test 4: Verify Stat Formulas
**Manual Verification:**

For Gignen Warrior at Level 5:
- Base STR: 14, Growth: 1.0 → STR = 14 + floor(5 × 1.0) = 19 ✓
- Base END: 9, Growth: 1.0 → END = 9 + floor(5 × 1.0) = 14 ✓
- Base ACC: 9, Growth: 0.67 → ACC = 9 + floor(5 × 0.67) = 12 ✓
- Max HP = 50 + floor(14^1.5) = 50 + 52 = 102 ✓
- Movement = 2 + floor((13 - 10) / 5) = 2 + 0 = 2 ✓
- To-Hit = 90 + floor(12 / 10) = 90 + 1 = 91 ✓
- Crit = floor((21 × 0.3375) + 1.65) = floor(8.7375) = 8 ✓

For Fae Magician at Level 5:
- Base INT: 20, Growth: 1.0 → INT = 20 + floor(5 × 1.0) = 25 ✓
- Base SPI: 21, Growth: 1.0 → SPI = 21 + floor(5 × 1.0) = 26 ✓
- Base END: 8, Growth: 1.0 → END = 8 + floor(5 × 1.0) = 13 ✓
- Max HP = 50 + floor(13^1.5) = 50 + 46 = 96 ✓
- Base SPD: 10, Growth: 1.0 → SPD = 10 + floor(5 × 1.0) = 15 ✓
- Movement = 2 + floor((15 - 10) / 5) = 2 + 1 = 3 ✓

At Level 6:
- INT = 20 + floor(6 × 1.0) = 26 ✓
- SPI = 21 + floor(6 × 1.0) = 27 ✓ (matches Play Example)
- END = 8 + floor(6 × 1.0) = 14 ✓
- Max HP = 50 + floor(14^1.5) = 50 + 52 = 102 ✓ (matches Play Example)

## Known Issues
None

## Browser Console Testing

You can also test stat calculations directly in the browser console after loading the game:

```javascript
// The game should log stat calculations when summons level up
// Watch the console for messages like:
// "[SummonUnit] Gignen Warrior leveled up to 6. HP: 102/108"
```

## Automated Testing Script

For quick testing, paste this into the browser console:

```javascript
// Demo script to test summon actions
function clickCanvas(x, y) {
    const canvas = document.querySelector('canvas');
    const event = new MouseEvent('pointerdown', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true
    });
    canvas.dispatchEvent(event);
}

// Advance to Action Phase
console.log('Advancing to Action Phase...');
setTimeout(() => clickCanvas(1050, 548), 500);   // Draw -> Level
setTimeout(() => clickCanvas(1050, 548), 1500);  // Level -> Action

// Play a summon
setTimeout(() => {
    console.log('Playing summon card...');
    clickCanvas(550, 780);  // Select card
}, 3000);

setTimeout(() => {
    clickCanvas(550, 700);  // Click Play Card
}, 3500);

setTimeout(() => {
    clickCanvas(380, 600);  // Place on board
}, 4500);

setTimeout(() => {
    console.log('Clicking summon to view stats...');
    clickCanvas(380, 600);  // Click to view stats
}, 5500);
```

## Success Criteria
- ✓ Summons start at level 5 when played
- ✓ Stats are calculated correctly using base stats + (level × growth rate)
- ✓ Derived stats (HP, MV, To-Hit, Crit) are calculated using correct formulas
- ✓ Detail box displays all stats with growth rate symbols
- ✓ Level phase increases summon level by 1
- ✓ Stat recalculation occurs when leveling up
- ✓ HP damage is retained when max HP increases (not proportional)
- ✓ Stats match examples from Play Example.md
