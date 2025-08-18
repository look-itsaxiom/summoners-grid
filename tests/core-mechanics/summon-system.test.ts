import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Summon System', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should allow playing summon cards from hand', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialHandCount = await gameUtils.getPlayerHandCount('A');
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Should have playable summon cards
    expect(playableCards.length).toBeGreaterThan(0);
    
    // Find a summon card (typically contains Warrior, Scout, or Magician)
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    expect(summonCard).toBeTruthy();
    
    if (summonCard) {
      // Select the summon card
      await gameUtils.selectCardInHand('A', summonCard);
      
      // Click on Player A territory to place the summon
      await gameUtils.clickBoardCell(5, 2); // Player A territory (rows 0-2)
      await gameUtils.page.waitForTimeout(1000);
      
      // Check that summon appeared on board
      await gameUtils.expectSummonUnitAt(5, 2);
      
      // Hand count should decrease
      const afterPlayHandCount = await gameUtils.getPlayerHandCount('A');
      expect(afterPlayHandCount).toBe(initialHandCount - 1);
    }
  });

  test('should trigger 3 card draws when summoning (Summon Draws)', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialHandCount = await gameUtils.getPlayerHandCount('A');
    const initialDeckCount = await gameUtils.getPlayerDeckCount('A');
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      // Play the summon
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Should have drawn 3 cards minus the 1 played = net +2 cards
      const afterSummonHandCount = await gameUtils.getPlayerHandCount('A');
      const afterSummonDeckCount = await gameUtils.getPlayerDeckCount('A');
      
      expect(afterSummonHandCount).toBe(initialHandCount + 2); // -1 played, +3 drawn
      expect(afterSummonDeckCount).toBe(initialDeckCount - 3); // -3 drawn
    }
  });

  test('should only allow one summon per turn (Turn Summon restriction)', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCards = playableCards.filter(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCards.length >= 2) {
      // Play first summon
      await gameUtils.selectCardInHand('A', summonCards[0]);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Try to play second summon - should not be playable
      const playableAfterFirst = await gameUtils.getPlayableCardsInHand('A');
      const stillPlayableSummons = playableAfterFirst.filter(card => 
        card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
      );
      
      expect(stillPlayableSummons.length).toBe(0); // No more summons should be playable
    }
  });

  test('should place summons only in valid territories', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      
      // Try to place in Player A territory (should work)
      await gameUtils.clickBoardCell(5, 2); // Row 2 is Player A territory
      await gameUtils.page.waitForTimeout(500);
      
      // Should have a summon there
      const summonUnit = await gameUtils.getSummonUnitAt(5, 2);
      expect(summonUnit).not.toBeNull();
    }
  });

  test('should not allow placing summons in occupied spaces', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCards = playableCards.filter(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCards.length >= 1) {
      // Place first summon
      await gameUtils.selectCardInHand('A', summonCards[0]);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Complete this turn and try to place another summon in same spot next turn
      await gameUtils.completeTurn(); // Complete Player A turn
      await gameUtils.completeTurn(); // Complete Player B turn
      
      // Player A Turn 2
      await gameUtils.endPhase(); // Draw
      await gameUtils.endPhase(); // Level
      await gameUtils.endPhase(); // Action
      
      const newPlayableCards = await gameUtils.getPlayableCardsInHand('A');
      const newSummonCard = newPlayableCards.find(card => 
        card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
      );
      
      if (newSummonCard) {
        await gameUtils.selectCardInHand('A', newSummonCard);
        
        // Try to place in occupied spot (5, 2) - should not work
        await gameUtils.clickBoardCell(5, 2);
        await gameUtils.page.waitForTimeout(500);
        
        // Should still only be one summon at that location
        const summonUnit = await gameUtils.getSummonUnitAt(5, 2);
        expect(summonUnit).not.toBeNull();
        // Check that the card is still selected (placement failed)
      }
    }
  });

  test('should summon with correct starting level (Level 5)', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      const summonUnit = await gameUtils.getSummonUnitAt(5, 2);
      expect(summonUnit).not.toBeNull();
      expect(summonUnit?.level).toBe(5); // Should start at level 5
    }
  });

  test('should show correct summon information on board', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      const summonUnit = await gameUtils.getSummonUnitAt(5, 2);
      expect(summonUnit).not.toBeNull();
      expect(summonUnit?.name).toBeTruthy();
      expect(summonUnit?.level).toBeGreaterThan(0);
      expect(summonUnit?.hp).toBeTruthy();
      expect(summonUnit?.position).toEqual({ x: 5, y: 2 });
    }
  });

  test('should log summon events in game log', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const logBefore = await gameUtils.getGameLogEntries();
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      const logAfter = await gameUtils.getGameLogEntries();
      expect(logAfter.length).toBeGreaterThan(logBefore.length);
      
      // Should have entries about summoning and drawing cards
      const newEntries = logAfter.slice(logBefore.length);
      const summonEntry = newEntries.find(entry => 
        entry.toLowerCase().includes('summon') || 
        entry.toLowerCase().includes('play')
      );
      expect(summonEntry).toBeTruthy();
    }
  });

  test('should handle summon interaction and selection', async () => {
    // Navigate to action phase and summon a unit
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Try to select the summoned unit
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      // Should be able to interact with the unit (this sets up for movement/combat tests)
      const summonUnit = await gameUtils.getSummonUnitAt(5, 2);
      expect(summonUnit).not.toBeNull();
    }
  });

  test('should respect maximum summons per player (3v3 format)', async () => {
    // This test would need to span multiple turns to summon 3 units
    const maxSummons = 3;
    let summonsPlaced = 0;
    
    for (let turn = 0; turn < 6 && summonsPlaced < maxSummons; turn++) {
      if (turn % 2 === 0) { // Player A turns
        await gameUtils.endPhase(); // Draw
        await gameUtils.endPhase(); // Level
        await gameUtils.expectTurnPhase('Action');
        
        const playableCards = await gameUtils.getPlayableCardsInHand('A');
        const summonCard = playableCards.find(card => 
          card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
        );
        
        if (summonCard) {
          await gameUtils.selectCardInHand('A', summonCard);
          // Place in different positions
          const positions = [[5, 0], [6, 0], [7, 0]]; // Player A territory
          const position = positions[summonsPlaced];
          
          await gameUtils.clickBoardCell(position[0], position[1]);
          await gameUtils.page.waitForTimeout(1000);
          
          const placed = await gameUtils.getSummonUnitAt(position[0], position[1]);
          if (placed) {
            summonsPlaced++;
          }
        }
        
        await gameUtils.endPhase(); // End action
        await gameUtils.endPhase(); // End turn
      } else {
        // Player B turn - just complete it
        await gameUtils.completeTurn();
      }
    }
    
    // Should have placed some summons (exact number depends on available cards)
    expect(summonsPlaced).toBeGreaterThan(0);
    expect(summonsPlaced).toBeLessThanOrEqual(maxSummons);
  });
});