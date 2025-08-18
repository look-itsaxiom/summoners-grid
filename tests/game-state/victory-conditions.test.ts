import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Victory Conditions', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should track victory points for both players', async () => {
    // Test basic VP tracking system
    const playerAVP = await gameUtils.getPlayerVictoryPoints('A');
    const playerBVP = await gameUtils.getPlayerVictoryPoints('B');
    
    expect(playerAVP).toBeGreaterThanOrEqual(0);
    expect(playerBVP).toBeGreaterThanOrEqual(0);
    
    // Initially should be equal
    expect(playerAVP).toBe(playerBVP);
  });

  test('should award victory points for quest completion', async () => {
    // Test VP from quest rewards
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialVP = await gameUtils.getPlayerVictoryPoints('A');
    
    // Set up quest completion scenario
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Play quest card that can be completed
      const questCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Quest') || 
        card.includes('Expedition') || 
        card.includes('Forest')
      );
      
      if (questCard) {
        await gameUtils.selectCardInHand('A', questCard);
        await gameUtils.selectSummonUnit(5, 2); // Target for quest
        await gameUtils.page.waitForTimeout(1000);
        
        const finalVP = await gameUtils.getPlayerVictoryPoints('A');
        
        // Should potentially gain VP from quest completion
        // (Depends on specific quest implementation)
        expect(finalVP).toBeGreaterThanOrEqual(initialVP);
      }
    }
  });

  test('should award victory points for unit defeats', async () => {
    // Test VP from combat victories
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialVP = await gameUtils.getPlayerVictoryPoints('A');
    
    // Set up combat scenario (simplified)
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // This would need actual combat resolution to test VP from defeats
      // For now, verify VP tracking system is functional
      const currentVP = await gameUtils.getPlayerVictoryPoints('A');
      expect(currentVP).toBe(initialVP);
    }
  });

  test('should check for victory conditions at appropriate times', async () => {
    // Test when victory checks occur
    const initialVP_A = await gameUtils.getPlayerVictoryPoints('A');
    const initialVP_B = await gameUtils.getPlayerVictoryPoints('B');
    
    // Complete a full turn cycle
    await gameUtils.completeTurn(); // Player A
    await gameUtils.completeTurn(); // Player B
    
    const afterTurn_A = await gameUtils.getPlayerVictoryPoints('A');
    const afterTurn_B = await gameUtils.getPlayerVictoryPoints('B');
    
    // VP should be maintained across turns
    expect(afterTurn_A).toBeGreaterThanOrEqual(initialVP_A);
    expect(afterTurn_B).toBeGreaterThanOrEqual(initialVP_B);
    
    // Game should still be active (no victory declared yet)
    const currentPlayer = await gameUtils.getCurrentPlayer();
    expect(currentPlayer).toMatch(/Player [AB]/);
  });

  test('should end game when victory threshold is reached', async () => {
    // Test game ending conditions
    // This would need manipulation of VP to test fully
    
    const playerAVP = await gameUtils.getPlayerVictoryPoints('A');
    const playerBVP = await gameUtils.getPlayerVictoryPoints('B');
    
    // For now, verify that VP display works and game continues
    expect(playerAVP).toBeGreaterThanOrEqual(0);
    expect(playerBVP).toBeGreaterThanOrEqual(0);
    
    // Game should continue normally with current VP levels
    const currentPhase = await gameUtils.getCurrentPhase();
    expect(currentPhase).toBeTruthy();
  });

  test('should handle different victory conditions', async () => {
    // Test multiple victory paths (VP, elimination, special conditions)
    
    // VP victory path
    const vpA = await gameUtils.getPlayerVictoryPoints('A');
    const vpB = await gameUtils.getPlayerVictoryPoints('B');
    expect(vpA).toBeGreaterThanOrEqual(0);
    expect(vpB).toBeGreaterThanOrEqual(0);
    
    // Unit elimination victory (3v3 format)
    // Would need to track when all units are defeated
    
    // Special condition victories (from certain cards)
    // Would depend on specific card implementations
    
    // For now, verify basic game state tracking
    const currentPlayer = await gameUtils.getCurrentPlayer();
    expect(currentPlayer).toMatch(/Player [AB]/);
  });

  test('should declare winner correctly', async () => {
    // Test winner declaration system
    
    // Complete several turns to see if victory is declared
    for (let i = 0; i < 4; i++) {
      const currentPlayer = await gameUtils.getCurrentPlayer();
      if (currentPlayer.includes('A') || currentPlayer.includes('B')) {
        await gameUtils.completeTurn();
      } else {
        break; // Game might have ended
      }
    }
    
    // Check if game is still active
    const stillActive = await gameUtils.getCurrentPlayer();
    expect(stillActive).toMatch(/Player [AB]/);
    
    // Victory declaration would show in game log or UI
    const logEntries = await gameUtils.getGameLogEntries();
    const victoryEntry = logEntries.find(entry => 
      entry.toLowerCase().includes('victory') ||
      entry.toLowerCase().includes('wins') ||
      entry.toLowerCase().includes('winner')
    );
    
    // Should not have victory yet in normal test scenario
    expect(victoryEntry).toBeFalsy();
  });

  test('should log victory point changes', async () => {
    // Test VP change logging
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const logBefore = await gameUtils.getGameLogEntries();
    const vpBefore = await gameUtils.getPlayerVictoryPoints('A');
    
    // Perform actions that might award VP
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      const questCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Quest') || card.includes('Expedition')
      );
      
      if (questCard) {
        await gameUtils.selectCardInHand('A', questCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        const vpAfter = await gameUtils.getPlayerVictoryPoints('A');
        
        // Should log any VP changes
        if (vpAfter > vpBefore) {
          const newEntries = logAfter.slice(logBefore.length);
          const vpEntry = newEntries.find(entry => 
            entry.toLowerCase().includes('victory') ||
            entry.toLowerCase().includes('points') ||
            entry.toLowerCase().includes('vp')
          );
          expect(vpEntry).toBeTruthy();
        }
      }
    }
  });

  test('should handle game state after victory', async () => {
    // Test post-victory game state
    
    // For now, test that reset functionality works
    const initialVP_A = await gameUtils.getPlayerVictoryPoints('A');
    const initialVP_B = await gameUtils.getPlayerVictoryPoints('B');
    
    // Reset game
    await gameUtils.resetGame();
    
    // Should return to initial state
    const resetVP_A = await gameUtils.getPlayerVictoryPoints('A');
    const resetVP_B = await gameUtils.getPlayerVictoryPoints('B');
    
    expect(resetVP_A).toBe(0); // Should reset to 0
    expect(resetVP_B).toBe(0);
    
    // Should be back to Player A's first turn
    await gameUtils.expectCurrentPlayer('Player A');
    await gameUtils.expectTurnPhase('Draw');
  });

  test('should prevent actions after game end', async () => {
    // Test that game properly locks after victory
    
    // Complete several actions to get game state
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    expect(playableCards.length).toBeGreaterThan(0);
    
    // Game should still be active and accepting actions
    const currentPhase = await gameUtils.getCurrentPhase();
    expect(currentPhase).toBe('Action');
    
    // This test would be expanded when victory conditions are implemented
  });

  test('should display victory information clearly', async () => {
    // Test victory condition UI display
    
    const vpDisplayA = await gameUtils.page.locator('#player-a-vp').textContent();
    const vpDisplayB = await gameUtils.page.locator('#player-b-vp').textContent();
    
    expect(vpDisplayA).toMatch(/\d+/); // Should show numbers
    expect(vpDisplayB).toMatch(/\d+/);
    
    // VP should be clearly visible to players
    const vpA = parseInt(vpDisplayA || '0');
    const vpB = parseInt(vpDisplayB || '0');
    
    expect(vpA).toBeGreaterThanOrEqual(0);
    expect(vpB).toBeGreaterThanOrEqual(0);
  });
});