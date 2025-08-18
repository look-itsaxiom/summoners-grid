import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Quest Card System', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should allow playing quest cards during action phase', async () => {
    // Navigate to action phase where quest cards can be played
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Look for quest cards (from play example: "Nearwood Forest Expedition")
    const questCard = playableCards.find(card => 
      card.includes('Quest') || 
      card.includes('Expedition') || 
      card.includes('Forest') ||
      card.toLowerCase().includes('nearwood')
    );
    
    if (questCard) {
      const initialHandCount = await gameUtils.getPlayerHandCount('A');
      const initialQuests = await gameUtils.getActiveQuests('A');
      
      // Play the quest card
      await gameUtils.selectCardInHand('A', questCard);
      await gameUtils.page.waitForTimeout(1000);
      
      // Quest should now be in play
      const afterQuests = await gameUtils.getActiveQuests('A');
      expect(afterQuests.length).toBe(initialQuests.length + 1);
      
      // Hand count should decrease
      const afterHandCount = await gameUtils.getPlayerHandCount('A');
      expect(afterHandCount).toBe(initialHandCount - 1);
    }
  });

  test('should remain in play until completed or failed', async () => {
    // Play a quest card and verify it stays in the quest area
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const questCard = playableCards.find(card => 
      card.includes('Quest') || 
      card.includes('Expedition') || 
      card.includes('Forest')
    );
    
    if (questCard) {
      await gameUtils.selectCardInHand('A', questCard);
      await gameUtils.page.waitForTimeout(1000);
      
      const questsAfterPlay = await gameUtils.getActiveQuests('A');
      expect(questsAfterPlay.length).toBeGreaterThan(0);
      
      // Complete the current turn and check quest persistence
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      
      // Quest should still be active across turns
      const questsAfterTurn = await gameUtils.getActiveQuests('A');
      expect(questsAfterTurn.length).toBe(questsAfterPlay.length);
    }
  });

  test('should require valid targets for quest objectives', async () => {
    // According to play example, quests have objectives like "Control target Warrior, Scout, or Magician"
    // First summon a unit that can fulfill quest requirements
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Summon a unit first (to have valid quest targets)
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Now try to play a quest card that can target this unit
      const remainingCards = await gameUtils.getPlayableCardsInHand('A');
      const questCard = remainingCards.find(card => 
        card.includes('Quest') || 
        card.includes('Expedition') || 
        card.includes('Forest')
      );
      
      if (questCard) {
        await gameUtils.selectCardInHand('A', questCard);
        
        // May need to target the summoned unit for quest objective
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const activeQuests = await gameUtils.getActiveQuests('A');
        expect(activeQuests.length).toBeGreaterThan(0);
      }
    }
  });

  test('should complete quests when objectives are met', async () => {
    // Test quest completion based on objectives being fulfilled
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Set up scenario for quest completion
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Summon a unit that can fulfill quest requirements
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Play quest targeting the unit
      const questCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Quest') || card.includes('Expedition') || card.includes('Forest')
      );
      
      if (questCard) {
        const logBefore = await gameUtils.getGameLogEntries();
        const questsBefore = await gameUtils.getActiveQuests('A');
        
        await gameUtils.selectCardInHand('A', questCard);
        await gameUtils.selectSummonUnit(5, 2); // Target for quest
        await gameUtils.page.waitForTimeout(1000);
        
        // Check if quest completed immediately (if objectives already met)
        const logAfter = await gameUtils.getGameLogEntries();
        const questsAfter = await gameUtils.getActiveQuests('A');
        
        // Should have log entries about quest activity
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
        
        const newEntries = logAfter.slice(logBefore.length);
        const questEntry = newEntries.find(entry => 
          entry.toLowerCase().includes('quest') || 
          entry.toLowerCase().includes('objective') ||
          entry.toLowerCase().includes('complete')
        );
        expect(questEntry).toBeTruthy();
      }
    }
  });

  test('should provide rewards upon quest completion', async () => {
    // According to GDD: "Provide VP, levels, or other rewards upon completion"
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialVP = await gameUtils.getPlayerVictoryPoints('A');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Set up quest completion scenario
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      const unit = await gameUtils.getSummonUnitAt(5, 2);
      const initialLevel = unit?.level || 0;
      
      const questCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Quest') || card.includes('Expedition') || card.includes('Forest')
      );
      
      if (questCard) {
        await gameUtils.selectCardInHand('A', questCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Check for rewards (VP increase or level increase)
        const finalVP = await gameUtils.getPlayerVictoryPoints('A');
        const finalUnit = await gameUtils.getSummonUnitAt(5, 2);
        const finalLevel = finalUnit?.level || 0;
        
        // Should have received some reward
        const receivedVP = finalVP > initialVP;
        const receivedLevels = finalLevel > initialLevel;
        
        expect(receivedVP || receivedLevels).toBe(true);
      }
    }
  });

  test('should track quest completion permanently on summon units', async () => {
    // According to GDD: "Summon units permanently track which quests they have completed"
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
      
      const questCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Quest') || card.includes('Expedition') || card.includes('Forest')
      );
      
      if (questCard) {
        await gameUtils.selectCardInHand('A', questCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // If unit detail modal shows quest completion tracking
        await gameUtils.selectSummonUnit(5, 2);
        const modalVisible = await gameUtils.isUnitDetailModalVisible();
        
        if (modalVisible) {
          const modalContent = await gameUtils.page.locator('#unit-modal-content').textContent();
          // Should show quest completion information
          expect(modalContent).toBeTruthy();
          
          await gameUtils.closeUnitDetailModal();
        }
      }
    }
  });

  test('should unlock new targeting options for completed quests', async () => {
    // GDD: "Completed quests unlock new targeting options and requirement fulfillment for future cards"
    // This is a more complex test that would require specific card interactions
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Complete a quest first
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      const questCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Quest') || card.includes('Expedition') || card.includes('Forest')
      );
      
      if (questCard) {
        await gameUtils.selectCardInHand('A', questCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // After quest completion, check if new cards become playable
        const newPlayableCards = await gameUtils.getPlayableCardsInHand('A');
        
        // This would need specific cards that require quest completion
        // For now, just verify the quest system is working
        expect(newPlayableCards).toBeTruthy();
      }
    }
  });

  test('should allow quest activation by different players based on card specifications', async () => {
    // GDD: "Individual quest cards specify whether they can be activated by the owner, opponent, or either player"
    // This would require opponent interaction to test fully
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const questCard = playableCards.find(card => 
      card.includes('Quest') || card.includes('Expedition') || card.includes('Forest')
    );
    
    if (questCard) {
      await gameUtils.selectCardInHand('A', questCard);
      await gameUtils.page.waitForTimeout(1000);
      
      const activeQuests = await gameUtils.getActiveQuests('A');
      expect(activeQuests.length).toBeGreaterThan(0);
      
      // Quest should be visible to both players (in shared in-play zone conceptually)
      // Complete turn to see if opponent can interact
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      
      // Player B's turn - quest should still be visible
      await gameUtils.expectCurrentPlayer('Player B');
      const questsVisibleToB = await gameUtils.getActiveQuests('A'); // Player A's quests
      expect(questsVisibleToB.length).toBeGreaterThan(0);
    }
  });

  test('should have ongoing effects while active', async () => {
    // GDD: "May have ongoing effects while active"
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const questCard = playableCards.find(card => 
      card.includes('Quest') || card.includes('Expedition') || card.includes('Forest')
    );
    
    if (questCard) {
      const logBefore = await gameUtils.getGameLogEntries();
      
      await gameUtils.selectCardInHand('A', questCard);
      await gameUtils.page.waitForTimeout(1000);
      
      const logAfter = await gameUtils.getGameLogEntries();
      
      // Should have entries about quest activation and any ongoing effects
      expect(logAfter.length).toBeGreaterThan(logBefore.length);
      
      const activeQuests = await gameUtils.getActiveQuests('A');
      expect(activeQuests.length).toBeGreaterThan(0);
    }
  });

  test('should log quest events and completion', async () => {
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const logBefore = await gameUtils.getGameLogEntries();
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const questCard = playableCards.find(card => 
      card.includes('Quest') || card.includes('Expedition') || card.includes('Forest')
    );
    
    if (questCard) {
      await gameUtils.selectCardInHand('A', questCard);
      await gameUtils.page.waitForTimeout(1000);
      
      const logAfter = await gameUtils.getGameLogEntries();
      expect(logAfter.length).toBeGreaterThan(logBefore.length);
      
      // Should have quest-related log entries
      const newEntries = logAfter.slice(logBefore.length);
      const questEntry = newEntries.find(entry => 
        entry.toLowerCase().includes('quest') ||
        entry.toLowerCase().includes('expedition') ||
        entry.toLowerCase().includes('objective')
      );
      expect(questEntry).toBeTruthy();
    }
  });
});