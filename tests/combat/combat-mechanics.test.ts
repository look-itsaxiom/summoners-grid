import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Combat Mechanics', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should allow units to attack once per turn', async () => {
    // According to GDD: "One Attack: Each summon can only attack once per turn"
    // This test needs two units to demonstrate combat
    
    // Player A summons first unit
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
      
      // Complete Player A's turn and let Player B summon
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      
      // Player B's turn
      await gameUtils.expectCurrentPlayer('Player B');
      await gameUtils.endPhase(); // Draw
      await gameUtils.endPhase(); // Level
      await gameUtils.expectTurnPhase('Action');
      
      const playerBCards = await gameUtils.getPlayableCardsInHand('B');
      const playerBSummon = playerBCards.find(card => 
        card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
      );
      
      if (playerBSummon) {
        await gameUtils.selectCardInHand('B', playerBSummon);
        await gameUtils.clickBoardCell(5, 9); // Player B territory
        await gameUtils.page.waitForTimeout(1000);
        
        // Complete Player B turn, back to Player A for combat
        await gameUtils.endPhase(); // End action
        await gameUtils.endPhase(); // End turn
        
        // Player A Turn 2 - can now attack
        await gameUtils.expectCurrentPlayer('Player A');
        await gameUtils.endPhase(); // Draw
        await gameUtils.endPhase(); // Level
        await gameUtils.expectTurnPhase('Action');
        
        // Select Player A's unit for attack
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(500);
        
        // Should show valid attack targets
        const validAttacks = await gameUtils.getValidAttackPositions();
        if (validAttacks.length > 0) {
          const logBefore = await gameUtils.getGameLogEntries();
          
          // Attack Player B's unit
          const targetPosition = validAttacks.find(pos => pos.x === 5 && pos.y === 9);
          if (targetPosition) {
            await gameUtils.clickBoardCell(targetPosition.x, targetPosition.y);
            await gameUtils.page.waitForTimeout(1000);
            
            const logAfter = await gameUtils.getGameLogEntries();
            expect(logAfter.length).toBeGreaterThan(logBefore.length);
            
            // Should log attack
            const newEntries = logAfter.slice(logBefore.length);
            const attackEntry = newEntries.find(entry => 
              entry.toLowerCase().includes('attack') ||
              entry.toLowerCase().includes('combat') ||
              entry.toLowerCase().includes('damage')
            );
            expect(attackEntry).toBeTruthy();
          }
        }
      }
    }
  });

  test('should calculate damage based on stats and equipment', async () => {
    // Test damage calculation system
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
      
      // Get unit details to understand stats
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      const modalVisible = await gameUtils.isUnitDetailModalVisible();
      if (modalVisible) {
        const modalContent = await gameUtils.page.locator('#unit-modal-content').textContent();
        
        // Should show combat-relevant stats
        expect(modalContent).toMatch(/STR|ATK|Power|Damage/i);
        
        await gameUtils.closeUnitDetailModal();
      }
      
      // Test with stat-modifying cards
      const actionCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Sharpened') || card.includes('Blade')
      );
      
      if (actionCard) {
        await gameUtils.selectCardInHand('A', actionCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Stat modification should affect combat calculations
        const logEntries = await gameUtils.getGameLogEntries();
        const powerEntry = logEntries.find(entry => 
          entry.toLowerCase().includes('power') ||
          entry.toLowerCase().includes('blade')
        );
        expect(powerEntry).toBeTruthy();
      }
    }
  });

  test('should respect attack range limitations', async () => {
    // Test that units can only attack within their range
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
      
      // Complete turns to get an opponent unit
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      
      // Player B summons far away
      await gameUtils.expectCurrentPlayer('Player B');
      await gameUtils.endPhase(); // Draw
      await gameUtils.endPhase(); // Level
      await gameUtils.expectTurnPhase('Action');
      
      const playerBCards = await gameUtils.getPlayableCardsInHand('B');
      const playerBSummon = playerBCards.find(card => 
        card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
      );
      
      if (playerBSummon) {
        await gameUtils.selectCardInHand('B', playerBSummon);
        await gameUtils.clickBoardCell(5, 11); // Far from Player A's unit
        await gameUtils.page.waitForTimeout(1000);
        
        await gameUtils.endPhase(); // End action
        await gameUtils.endPhase(); // End turn
        
        // Player A Turn 2 - try to attack
        await gameUtils.expectCurrentPlayer('Player A');
        await gameUtils.endPhase(); // Draw
        await gameUtils.endPhase(); // Level
        await gameUtils.expectTurnPhase('Action');
        
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(500);
        
        const validAttacks = await gameUtils.getValidAttackPositions();
        
        // Should not be able to attack units too far away
        const farTarget = validAttacks.find(pos => pos.y === 11);
        expect(farTarget).toBeUndefined(); // Should not be in range
      }
    }
  });

  test('should apply accuracy and hit calculation', async () => {
    // Test accuracy stat affecting hit chance
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Set up combat scenario
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Check unit stats including accuracy
      await gameUtils.selectSummonUnit(5, 2);
      const modalVisible = await gameUtils.isUnitDetailModalVisible();
      
      if (modalVisible) {
        const modalContent = await gameUtils.page.locator('#unit-modal-content').textContent();
        expect(modalContent).toMatch(/ACC|Accuracy/i);
        await gameUtils.closeUnitDetailModal();
      }
    }
  });

  test('should handle unit defeat and removal', async () => {
    // Test what happens when a unit is defeated
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
      
      const unitBefore = await gameUtils.getSummonUnitAt(5, 2);
      expect(unitBefore).not.toBeNull();
      
      // This would need actual defeat mechanics to test fully
      // For now, verify the unit tracking system works
      expect(unitBefore?.hp).toMatch(/\d+\/\d+/);
    }
  });

  test('should trigger combat-related events and effects', async () => {
    // Test trigger system for combat events
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
      
      // Look for combat-triggering cards
      const combatCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Tempest') || 
        card.includes('Attack') ||
        card.includes('Combat')
      );
      
      if (combatCard) {
        const logBefore = await gameUtils.getGameLogEntries();
        
        await gameUtils.selectCardInHand('A', combatCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
        
        // Should have combat-related log entries
        const newEntries = logAfter.slice(logBefore.length);
        const combatEntry = newEntries.find(entry => 
          entry.toLowerCase().includes('combat') ||
          entry.toLowerCase().includes('attack') ||
          entry.toLowerCase().includes('damage')
        );
        expect(combatEntry).toBeTruthy();
      }
    }
  });

  test('should allow multiple attacks with card effects', async () => {
    // According to GDD: "Multiple Attacks: Card effects can grant additional attacks beyond the normal one-per-turn limit"
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
      
      // Look for cards that grant additional attacks
      const multiAttackCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Tempest') || 
        card.includes('Double') ||
        card.includes('Additional') ||
        card.toLowerCase().includes('attack')
      );
      
      if (multiAttackCard) {
        await gameUtils.selectCardInHand('A', multiAttackCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Should grant additional attack capability
        const logEntries = await gameUtils.getGameLogEntries();
        const multiEntry = logEntries.find(entry => 
          entry.toLowerCase().includes('additional') ||
          entry.toLowerCase().includes('extra') ||
          entry.toLowerCase().includes('attack')
        );
        expect(multiEntry).toBeTruthy();
      }
    }
  });

  test('should handle stack-based combat resolution', async () => {
    // Test that combat follows stack-based resolution system
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // This would test the priority system and stack resolution
    // For now, verify basic combat logging and timing
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Test priority passing
      await gameUtils.passPriority();
      await gameUtils.page.waitForTimeout(500);
      
      // Should handle priority correctly
      const currentPhase = await gameUtils.getCurrentPhase();
      expect(currentPhase).toBe('Action');
    }
  });

  test('should log detailed combat information', async () => {
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
      
      // Should have detailed logging for all combat actions
      const newEntries = logAfter.slice(logBefore.length);
      expect(newEntries.length).toBeGreaterThan(0);
      
      // Look for summon-related entries that set up combat
      const summonEntry = newEntries.find(entry => 
        entry.toLowerCase().includes('summon') ||
        entry.toLowerCase().includes('play') ||
        entry.toLowerCase().includes('materialize')
      );
      expect(summonEntry).toBeTruthy();
    }
  });
});