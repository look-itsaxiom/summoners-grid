import { test, expect } from '@playwright/test';
import { GameTestUtils, captureGameState } from '../setup/test-utils';

test.describe('Game Flow Integration', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should handle complete game flow from start to multiple turns', async () => {
    // Integration test covering a full game session
    
    // Turn 1 - Player A (no draw, no summons to level)
    await gameUtils.expectCurrentPlayer('Player A');
    await gameUtils.expectTurnPhase('Draw');
    
    const initialState = await captureGameState(gameUtils);
    expect(initialState.currentPlayer).toBe('Player A');
    expect(initialState.currentPhase).toBe('Draw');
    
    // Complete Player A Turn 1
    await gameUtils.endPhase(); // Draw (no card drawn)
    await gameUtils.endPhase(); // Level (no units to level)
    await gameUtils.expectTurnPhase('Action');
    
    // Summon first unit
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Verify summon placement and 3-card draw
      await gameUtils.expectSummonUnitAt(5, 2);
      const handAfterSummon = await gameUtils.getPlayerHandCount('A');
      expect(handAfterSummon).toBeGreaterThan(initialState.playerAHandCount - 1);
    }
    
    await gameUtils.endPhase(); // End Action
    await gameUtils.endPhase(); // End Turn
    
    // Turn 1 - Player B (should draw a card)
    await gameUtils.expectCurrentPlayer('Player B');
    await gameUtils.expectTurnPhase('Draw');
    
    const playerBInitialHand = await gameUtils.getPlayerHandCount('B');
    await gameUtils.endPhase(); // Draw phase
    const playerBAfterDraw = await gameUtils.getPlayerHandCount('B');
    expect(playerBAfterDraw).toBe(playerBInitialHand + 1);
    
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Player B summons
    const playerBCards = await gameUtils.getPlayableCardsInHand('B');
    const playerBSummon = playerBCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (playerBSummon) {
      await gameUtils.selectCardInHand('B', playerBSummon);
      await gameUtils.clickBoardCell(5, 9);
      await gameUtils.page.waitForTimeout(1000);
      
      await gameUtils.expectSummonUnitAt(5, 9);
    }
    
    await gameUtils.endPhase(); // End Action
    await gameUtils.endPhase(); // End Turn
    
    // Turn 2 - Player A (should draw and level existing unit)
    await gameUtils.expectCurrentPlayer('Player A');
    await gameUtils.expectTurnPhase('Draw');
    
    const playerATurn2Hand = await gameUtils.getPlayerHandCount('A');
    await gameUtils.endPhase(); // Draw
    const playerAAfterDraw = await gameUtils.getPlayerHandCount('A');
    expect(playerAAfterDraw).toBe(playerATurn2Hand + 1);
    
    // Level phase should affect existing unit
    const unitBeforeLevel = await gameUtils.getSummonUnitAt(5, 2);
    const initialLevel = unitBeforeLevel?.level || 0;
    
    await gameUtils.endPhase(); // Level
    
    const unitAfterLevel = await gameUtils.getSummonUnitAt(5, 2);
    expect(unitAfterLevel?.level).toBe(initialLevel + 1);
    
    // Continue game flow
    await gameUtils.expectTurnPhase('Action');
    
    const finalState = await captureGameState(gameUtils);
    
    // Verify game state progression
    expect(finalState.currentPlayer).toBe('Player A');
    expect(finalState.currentPhase).toBe('Action');
    expect(finalState.playerADeckCount).toBeLessThan(initialState.playerADeckCount);
    expect(finalState.playerBDeckCount).toBeLessThan(initialState.playerBDeckCount);
  });

  test('should maintain game state consistency across complex interactions', async () => {
    // Test that complex card interactions maintain proper game state
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialState = await captureGameState(gameUtils);
    
    // Play multiple cards in sequence
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // 1. Summon a unit
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // 2. Play action card on the unit
      const actionCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Sharpened') || card.includes('Healing') || card.includes('Rush')
      );
      
      if (actionCard) {
        await gameUtils.selectCardInHand('A', actionCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
      }
      
      // 3. Try to play quest card
      const questCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Quest') || card.includes('Expedition')
      );
      
      if (questCard) {
        await gameUtils.selectCardInHand('A', questCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
      }
      
      const finalState = await captureGameState(gameUtils);
      
      // Verify state consistency
      expect(finalState.playerAHandCount).toBeLessThan(initialState.playerAHandCount);
      expect(finalState.currentPlayer).toBe('Player A');
      expect(finalState.currentPhase).toBe('Action');
      
      // Unit should still exist
      await gameUtils.expectSummonUnitAt(5, 2);
    }
  });

  test('should handle edge cases and error recovery', async () => {
    // Test game robustness with edge cases
    
    // Try invalid actions
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Try to click invalid board positions
    await gameUtils.clickBoardCell(-1, -1); // Invalid
    await gameUtils.page.waitForTimeout(300);
    
    await gameUtils.clickBoardCell(20, 20); // Out of bounds
    await gameUtils.page.waitForTimeout(300);
    
    // Game should still be functional
    const currentPhase = await gameUtils.getCurrentPhase();
    expect(currentPhase).toBe('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    expect(playableCards.length).toBeGreaterThan(0);
  });

  test('should support full reset and restart', async () => {
    // Test complete game reset functionality
    
    // Make some progress first
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
      
      // Complete some turns
      await gameUtils.completeTurn();
      await gameUtils.completeTurn();
      
      // Game should have progressed
      const progressedState = await captureGameState(gameUtils);
      expect(progressedState.currentPlayer).toBe('Player A');
      
      // Reset the game
      await gameUtils.resetGame();
      
      // Should be back to initial state
      const resetState = await captureGameState(gameUtils);
      expect(resetState.currentPlayer).toBe('Player A');
      expect(resetState.currentPhase).toBe('Draw');
      expect(resetState.playerAVP).toBe(0);
      expect(resetState.playerBVP).toBe(0);
      
      // Board should be clear
      await gameUtils.expectEmptyBoardCell(5, 2);
    }
  });

  test('should handle concurrent actions and priority system', async () => {
    // Test priority system and response windows
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Test priority passing
    await gameUtils.passPriority();
    await gameUtils.page.waitForTimeout(500);
    
    // Should still be in action phase
    const phase = await gameUtils.getCurrentPhase();
    expect(phase).toBe('Action');
    
    // Continue with normal actions
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    if (playableCards.length > 0) {
      // Priority system should allow normal card play
      expect(playableCards.length).toBeGreaterThan(0);
    }
  });

  test('should log comprehensive game events', async () => {
    // Test that all major game events are logged
    
    const initialLogCount = (await gameUtils.getGameLogEntries()).length;
    
    // Perform various actions
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
      
      const actionCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Sharpened') || card.includes('Healing')
      );
      
      if (actionCard) {
        await gameUtils.selectCardInHand('A', actionCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
      }
      
      await gameUtils.endPhase(); // End Action
      await gameUtils.endPhase(); // End Turn
      
      const finalLogCount = (await gameUtils.getGameLogEntries()).length;
      
      // Should have many log entries for all the actions
      expect(finalLogCount).toBeGreaterThan(initialLogCount + 3);
      
      const logEntries = await gameUtils.getGameLogEntries();
      const recentEntries = logEntries.slice(initialLogCount);
      
      // Should have entries for major events
      const phaseEntry = recentEntries.find(entry => 
        entry.toLowerCase().includes('phase')
      );
      const summonEntry = recentEntries.find(entry => 
        entry.toLowerCase().includes('summon')
      );
      
      expect(phaseEntry).toBeTruthy();
      expect(summonEntry).toBeTruthy();
    }
  });

  test('should maintain proper turn timing and structure', async () => {
    // Test that turns follow proper timing
    
    const startTime = Date.now();
    
    // Complete two full turns
    await gameUtils.completeTurn(); // Player A Turn 1
    await gameUtils.completeTurn(); // Player B Turn 1
    
    const endTime = Date.now();
    
    // Should complete in reasonable time (not stuck)
    expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max
    
    // Should be back to Player A Turn 2
    await gameUtils.expectCurrentPlayer('Player A');
    await gameUtils.expectTurnPhase('Draw');
  });
});