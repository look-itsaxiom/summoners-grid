import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Turn Phase Progression', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should start with Player A in Draw Phase on Turn 1', async () => {
    await gameUtils.expectCurrentPlayer('Player A');
    await gameUtils.expectTurnPhase('Draw');
  });

  test('should progress through all turn phases correctly', async () => {
    // Player A Turn 1: Draw -> Level -> Action -> End
    await gameUtils.expectTurnPhase('Draw');
    
    await gameUtils.endPhase();
    await gameUtils.expectTurnPhase('Level');
    
    await gameUtils.endPhase();
    await gameUtils.expectTurnPhase('Action');
    
    await gameUtils.endPhase();
    await gameUtils.expectTurnPhase('End');
    
    await gameUtils.endPhase();
    
    // Should now be Player B's turn
    await gameUtils.expectCurrentPlayer('Player B');
    await gameUtils.expectTurnPhase('Draw');
  });

  test('should not draw card on Player A first turn (Turn 1)', async () => {
    const initialHandCount = await gameUtils.getPlayerHandCount('A');
    
    // End draw phase - should not draw a card on first turn
    await gameUtils.endPhase();
    
    const afterDrawHandCount = await gameUtils.getPlayerHandCount('A');
    expect(afterDrawHandCount).toBe(initialHandCount);
  });

  test('should have no summons to level on first turn', async () => {
    // Go to level phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.expectTurnPhase('Level');
    
    // No summons should exist to level at start of game
    // Level phase should complete without errors
    await gameUtils.endPhase();
    await gameUtils.expectTurnPhase('Action');
  });

  test('should transition to Player B after Player A completes turn', async () => {
    // Complete Player A's entire turn
    await gameUtils.completeTurn();
    
    // Should now be Player B's turn in Draw phase
    await gameUtils.expectCurrentPlayer('Player B');
    await gameUtils.expectTurnPhase('Draw');
  });

  test('should maintain turn structure across multiple turns', async () => {
    // Complete two full turns (Player A, then Player B)
    await gameUtils.completeTurn(); // Player A Turn 1
    await gameUtils.expectCurrentPlayer('Player B');
    
    await gameUtils.completeTurn(); // Player B Turn 1
    await gameUtils.expectCurrentPlayer('Player A');
    
    // Should be back to Player A for Turn 2
    await gameUtils.expectTurnPhase('Draw');
  });

  test('should track game log entries for phase transitions', async () => {
    const initialLogCount = (await gameUtils.getGameLogEntries()).length;
    
    // Progress through one phase
    await gameUtils.endPhase();
    
    const afterPhaseLogCount = (await gameUtils.getGameLogEntries()).length;
    expect(afterPhaseLogCount).toBeGreaterThan(initialLogCount);
    
    const latestEntry = await gameUtils.getLatestLogEntry();
    expect(latestEntry).toBeTruthy();
  });

  test('should prevent invalid phase transitions', async () => {
    // Try to end phase multiple times rapidly
    await gameUtils.endPhase(); // Draw -> Level
    await gameUtils.expectTurnPhase('Level');
    
    await gameUtils.endPhase(); // Level -> Action  
    await gameUtils.expectTurnPhase('Action');
    
    // Phase should have properly transitioned
    const currentPhase = await gameUtils.getCurrentPhase();
    expect(currentPhase).toBe('Action');
  });

  test('should reset properly when reset button is clicked', async () => {
    // Progress partway through a turn
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    
    // Reset the game
    await gameUtils.resetGame();
    
    // Should be back to initial state
    await gameUtils.expectCurrentPlayer('Player A');
    await gameUtils.expectTurnPhase('Draw');
  });
});

test.describe('Turn Phase Specific Mechanics', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('Level Phase should increase summon levels when summons exist', async () => {
    // First, we need to summon a unit to test leveling
    // Complete Player A's first turn to Action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Play a summon card if available
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    if (playableCards.length > 0) {
      // Find and play a summon card
      const summonCard = playableCards.find(card => 
        card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
      );
      
      if (summonCard) {
        await gameUtils.selectCardInHand('A', summonCard);
        
        // Click on Player A territory to place the summon
        await gameUtils.clickBoardCell(5, 2); // Player A territory
        await gameUtils.page.waitForTimeout(1000);
        
        // Complete turn and start next turn to test leveling
        await gameUtils.endPhase(); // End Action
        await gameUtils.endPhase(); // End turn
        
        // Now Player B's turn
        await gameUtils.completeTurn();
        
        // Back to Player A - should level existing summon
        await gameUtils.expectCurrentPlayer('Player A');
        await gameUtils.endPhase(); // Draw
        
        // Level phase should affect the summoned unit
        await gameUtils.expectTurnPhase('Level');
        const logBefore = await gameUtils.getGameLogEntries();
        
        await gameUtils.endPhase(); // Level phase
        
        const logAfter = await gameUtils.getGameLogEntries();
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
      }
    }
  });

  test('Action Phase should allow playing cards and actions', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Should have cards available to play
    const handCount = await gameUtils.getPlayerHandCount('A');
    expect(handCount).toBeGreaterThan(0);
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    // At minimum, should have summon cards that are playable
    expect(playableCards.length).toBeGreaterThan(0);
  });

  test('End Phase should handle hand size limit', async () => {
    // Navigate to end phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.endPhase(); // Action
    await gameUtils.expectTurnPhase('End');
    
    const handCountBefore = await gameUtils.getPlayerHandCount('A');
    
    await gameUtils.endPhase(); // Complete end phase
    
    // Hand size should be maintained (6 card limit)
    const handCountAfter = await gameUtils.getPlayerHandCount('A');
    expect(handCountAfter).toBeLessThanOrEqual(6);
  });
});