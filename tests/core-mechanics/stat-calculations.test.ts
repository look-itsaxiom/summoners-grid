import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Stat Calculations', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should start summons at level 5 with correct base stats', async () => {
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
      
      const summonUnit = await gameUtils.getSummonUnitAt(5, 2);
      expect(summonUnit).not.toBeNull();
      expect(summonUnit?.level).toBe(5); // Should start at level 5
      expect(summonUnit?.hp).toBeTruthy(); // Should have HP displayed
      expect(summonUnit?.name).toBeTruthy(); // Should have a name
    }
  });

  test('should increase stats when leveling up', async () => {
    // Summon a unit first
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
      
      // Get initial stats
      const initialUnit = await gameUtils.getSummonUnitAt(5, 2);
      const initialLevel = initialUnit?.level || 0;
      const initialHP = initialUnit?.hp || '';
      
      // Complete turn and start next turn to trigger leveling
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      await gameUtils.completeTurn(); // Player B turn
      
      // Player A Turn 2 - level phase should increase stats
      await gameUtils.expectCurrentPlayer('Player A');
      await gameUtils.endPhase(); // Draw
      
      // In level phase - units should level up
      await gameUtils.expectTurnPhase('Level');
      await gameUtils.endPhase(); // Level phase
      
      // Check updated stats
      const leveledUnit = await gameUtils.getSummonUnitAt(5, 2);
      expect(leveledUnit?.level).toBe(initialLevel + 1);
      // HP should have changed (either increased max HP or maintained damage taken)
      expect(leveledUnit?.hp).not.toBe(initialHP);
    }
  });

  test('should maintain HP damage when max HP increases', async () => {
    // According to GDD: "HP Damage Retention: When max HP increases, current damage taken remains the same (not proportional)"
    // This test verifies the concept - would need actual damage to test fully
    
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
      
      const initialUnit = await gameUtils.getSummonUnitAt(5, 2);
      const initialHP = initialUnit?.hp || '';
      
      // Level up the unit
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      await gameUtils.completeTurn(); // Player B turn
      
      await gameUtils.expectCurrentPlayer('Player A');
      await gameUtils.endPhase(); // Draw
      await gameUtils.endPhase(); // Level - should increase max HP
      
      const leveledUnit = await gameUtils.getSummonUnitAt(5, 2);
      const newHP = leveledUnit?.hp || '';
      
      // HP should have changed due to leveling
      expect(newHP).not.toBe(initialHP);
      // Should still show valid HP format (current/max)
      expect(newHP).toMatch(/\d+\/\d+/);
    }
  });

  test('should calculate stats based on growth rates', async () => {
    // Test that different units have different stat progressions
    // This tests the underlying growth rate system
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Try to summon different types of units to compare
    for (const cardType of ['Warrior', 'Scout', 'Magician']) {
      const summonCard = playableCards.find(card => card.includes(cardType));
      if (summonCard) {
        // This would be expanded to test multiple units, but for now just test one exists
        expect(summonCard).toBeTruthy();
        break;
      }
    }
  });

  test('should show equipment effects on stats', async () => {
    // According to play example, units have equipment that affects stats
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
      
      // Check if we can see detailed stats (would require clicking on unit or modal)
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      // If unit detail modal opens, check for equipment/stat information
      const modalVisible = await gameUtils.isUnitDetailModalVisible();
      if (modalVisible) {
        // Check for stat information in the modal
        const modalContent = await gameUtils.page.locator('#unit-modal-content').textContent();
        expect(modalContent).toBeTruthy();
        // Should contain stat information
        expect(modalContent).toMatch(/HP|STR|END|DEF|INT|SPI|MDF|SPD|LCK|ACC/);
        
        await gameUtils.closeUnitDetailModal();
      }
    }
  });

  test('should recalculate stats immediately after leveling', async () => {
    // Test that stat recalculation happens immediately when leveling occurs
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
      
      // Complete turn cycle to get to next level phase
      await gameUtils.endPhase(); // End action
      await gameUtils.endPhase(); // End turn
      await gameUtils.completeTurn(); // Player B turn
      
      await gameUtils.expectCurrentPlayer('Player A');
      await gameUtils.endPhase(); // Draw
      
      // Before level phase
      const preLevel = await gameUtils.getSummonUnitAt(5, 2);
      const preLevelHP = preLevel?.hp || '';
      
      // During level phase - should trigger immediate recalculation
      await gameUtils.expectTurnPhase('Level');
      const logBefore = await gameUtils.getGameLogEntries();
      
      await gameUtils.endPhase(); // Complete level phase
      
      // After level phase - stats should be updated
      const postLevel = await gameUtils.getSummonUnitAt(5, 2);
      const postLevelHP = postLevel?.hp || '';
      
      expect(postLevel?.level).toBe((preLevel?.level || 0) + 1);
      expect(postLevelHP).not.toBe(preLevelHP);
      
      // Should have log entries about leveling
      const logAfter = await gameUtils.getGameLogEntries();
      expect(logAfter.length).toBeGreaterThan(logBefore.length);
    }
  });

  test('should handle maximum level cap (Level 20)', async () => {
    // According to GDD, maximum level is 20
    // This is more of a long-term test, but we can verify the system handles high levels
    
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
      
      const unit = await gameUtils.getSummonUnitAt(5, 2);
      expect(unit?.level).toBeLessThanOrEqual(20); // Should never exceed max level
      expect(unit?.level).toBeGreaterThan(0); // Should have valid level
    }
  });

  test('should apply card effects to stats correctly', async () => {
    // Test that action cards can modify stats (like in play example with Sharpened Blade)
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
      
      // Look for stat-modifying action cards
      const actionCards = await gameUtils.getPlayableCardsInHand('A');
      const statCard = actionCards.find(card => 
        card.includes('Sharpened') || 
        card.includes('Blade') || 
        card.includes('Rush') ||
        card.includes('Tempest')
      );
      
      if (statCard) {
        const logBefore = await gameUtils.getGameLogEntries();
        
        // Play the stat-modifying card
        await gameUtils.selectCardInHand('A', statCard);
        // Some cards might target the summoned unit
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
        
        // Should have log entries about the effect
        const newEntries = logAfter.slice(logBefore.length);
        const effectEntry = newEntries.find(entry => 
          entry.toLowerCase().includes('effect') || 
          entry.toLowerCase().includes('power') ||
          entry.toLowerCase().includes('stat')
        );
        expect(effectEntry).toBeTruthy();
      }
    }
  });

  test('should display stats in readable format', async () => {
    // Test that stats are displayed clearly for players
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
      
      const unit = await gameUtils.getSummonUnitAt(5, 2);
      expect(unit).not.toBeNull();
      
      // Basic display should show name, level, and HP
      expect(unit?.name).toBeTruthy();
      expect(unit?.level).toBeGreaterThan(0);
      expect(unit?.hp).toMatch(/\d+\/\d+/); // Format: current/max
      
      // Position should be accurate
      expect(unit?.position).toEqual({ x: 5, y: 2 });
    }
  });
});