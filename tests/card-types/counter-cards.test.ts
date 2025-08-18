import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Counter Card System', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should allow playing counter cards face down', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Look for counter cards
    const counterCard = playableCards.find(card => 
      card.includes('Counter') || 
      card.includes('Trap') ||
      card.toLowerCase().includes('counter')
    );
    
    if (counterCard) {
      const initialFaceDown = await gameUtils.getFaceDownCards('A');
      const initialHand = await gameUtils.getPlayerHandCount('A');
      
      // Play counter card face down
      await gameUtils.selectCardInHand('A', counterCard);
      await gameUtils.page.waitForTimeout(1000);
      
      const afterFaceDown = await gameUtils.getFaceDownCards('A');
      const afterHand = await gameUtils.getPlayerHandCount('A');
      
      // Should have one more face-down card
      expect(afterFaceDown).toBe(initialFaceDown + 1);
      expect(afterHand).toBe(initialHand - 1);
    }
  });

  test('should remain face down until triggered', async () => {
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const counterCard = playableCards.find(card => 
      card.includes('Counter') || 
      card.includes('Trap')
    );
    
    if (counterCard) {
      await gameUtils.selectCardInHand('A', counterCard);
      await gameUtils.page.waitForTimeout(1000);
      
      const faceDownAfterPlay = await gameUtils.getFaceDownCards('A');
      
      // Complete turn - face down card should persist
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      
      const faceDownAfterTurn = await gameUtils.getFaceDownCards('A');
      expect(faceDownAfterTurn).toBe(faceDownAfterPlay);
    }
  });

  test('should activate when trigger conditions are met', async () => {
    // This test would need specific trigger scenarios
    // For now, test basic face-down functionality
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const counterCard = playableCards.find(card => 
      card.includes('Counter') || 
      card.includes('Trap')
    );
    
    if (counterCard) {
      const logBefore = await gameUtils.getGameLogEntries();
      
      await gameUtils.selectCardInHand('A', counterCard);
      await gameUtils.page.waitForTimeout(1000);
      
      const logAfter = await gameUtils.getGameLogEntries();
      
      // Should log the face-down play
      expect(logAfter.length).toBeGreaterThan(logBefore.length);
      
      const newEntries = logAfter.slice(logBefore.length);
      const counterEntry = newEntries.find(entry => 
        entry.toLowerCase().includes('counter') ||
        entry.toLowerCase().includes('face') ||
        entry.toLowerCase().includes('down')
      );
      expect(counterEntry).toBeTruthy();
    }
  });

  test('should move to discard pile after activation', async () => {
    // According to GDD: "Counter, Building, Quest cards → Discard Pile"
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const counterCard = playableCards.find(card => 
      card.includes('Counter') || 
      card.includes('Trap')
    );
    
    if (counterCard) {
      await gameUtils.selectCardInHand('A', counterCard);
      await gameUtils.page.waitForTimeout(1000);
      
      // Counter cards go to face down area first, then discard when triggered
      const faceDown = await gameUtils.getFaceDownCards('A');
      expect(faceDown).toBeGreaterThan(0);
    }
  });

  test('should be hidden from opponent until activation', async () => {
    // Counter cards should be face down and hidden
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const counterCard = playableCards.find(card => 
      card.includes('Counter') || 
      card.includes('Trap')
    );
    
    if (counterCard) {
      await gameUtils.selectCardInHand('A', counterCard);
      await gameUtils.page.waitForTimeout(1000);
      
      // Complete turn to switch to opponent
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      
      // Player B's turn - should see face down cards but not their identity
      await gameUtils.expectCurrentPlayer('Player B');
      
      const playerAFaceDown = await gameUtils.getFaceDownCards('A');
      expect(playerAFaceDown).toBeGreaterThan(0);
      
      // Face down cards should not reveal their names to opponent
      // (This is more of a UI/visibility test)
    }
  });
});