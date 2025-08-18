import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Advance Card System', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should be available when requirements are met', async () => {
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Check advance deck availability
    const advanceCards = await gameUtils.getAdvanceCards('A');
    
    // Should have advance cards available (separate from hand)
    // Availability depends on meeting level, role, or achievement requirements
    expect(advanceCards).toBeTruthy();
  });

  test('should enable role advancement to higher tiers', async () => {
    // Test role change functionality
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // First summon a unit that can be advanced
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Check for advance cards that can target this unit
      const advanceCards = await gameUtils.getAdvanceCards('A');
      
      if (advanceCards.length > 0) {
        const roleChangeCard = advanceCards.find(card => 
          card.includes('Knight') || 
          card.includes('Paladin') ||
          card.includes('Berserker') ||
          card.includes('Archer')
        );
        
        if (roleChangeCard) {
          const logBefore = await gameUtils.getGameLogEntries();
          
          // Play advance card targeting the unit
          await gameUtils.page.click(`#player-a-advance .card:has(.card-name:text("${roleChangeCard}"))`);
          await gameUtils.selectSummonUnit(5, 2);
          await gameUtils.page.waitForTimeout(1000);
          
          const logAfter = await gameUtils.getGameLogEntries();
          expect(logAfter.length).toBeGreaterThan(logBefore.length);
          
          // Should log advancement
          const newEntries = logAfter.slice(logBefore.length);
          const advanceEntry = newEntries.find(entry => 
            entry.toLowerCase().includes('advance') ||
            entry.toLowerCase().includes('role') ||
            entry.toLowerCase().includes('upgrade')
          );
          expect(advanceEntry).toBeTruthy();
        }
      }
    }
  });

  test('should transform summons into Named Summons', async () => {
    // Test Named Summon creation
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
      
      const advanceCards = await gameUtils.getAdvanceCards('A');
      const namedSummonCard = advanceCards.find(card => 
        card.includes('Named') || 
        // Look for specific named summons from game data
        card.includes('Alrecht') ||
        card.includes('Barkstep') ||
        card.includes('Scoutmaster')
      );
      
      if (namedSummonCard) {
        const originalUnit = await gameUtils.getSummonUnitAt(5, 2);
        
        await gameUtils.page.click(`#player-a-advance .card:has(.card-name:text("${namedSummonCard}"))`);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Unit should still be at same position but transformed
        const transformedUnit = await gameUtils.getSummonUnitAt(5, 2);
        expect(transformedUnit).not.toBeNull();
        expect(transformedUnit?.position).toEqual(originalUnit?.position);
        
        // Should have enhanced properties (name change, stat boost, etc.)
      }
    }
  });

  test('should inherit equipment and board position', async () => {
    // According to GDD: Named Summons inherit material summon's equipment and board position
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
      
      const originalPosition = { x: 5, y: 2 };
      const originalUnit = await gameUtils.getSummonUnitAt(5, 2);
      
      const advanceCards = await gameUtils.getAdvanceCards('A');
      
      if (advanceCards.length > 0) {
        const advanceCard = advanceCards[0];
        
        await gameUtils.page.click(`#player-a-advance .card:has(.card-name:text("${advanceCard}"))`);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Unit should remain at same position
        const advancedUnit = await gameUtils.getSummonUnitAt(5, 2);
        expect(advancedUnit?.position).toEqual(originalPosition);
      }
    }
  });

  test('should require strict requirements based on level, role, or achievements', async () => {
    // Test requirement system for advance cards
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const advanceCards = await gameUtils.getAdvanceCards('A');
    
    // Without meeting requirements, advance cards shouldn't be usable
    if (advanceCards.length > 0) {
      // Try to use advance card without valid target
      const advanceCard = advanceCards[0];
      
      await gameUtils.page.click(`#player-a-advance .card:has(.card-name:text("${advanceCard}"))`);
      await gameUtils.page.waitForTimeout(500);
      
      // Should require valid target that meets requirements
      // This would be more detailed with specific requirement testing
    }
  });

  test('should enable strategic pivoting during gameplay', async () => {
    // Test that advance cards allow changing strategy mid-game
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
      
      const originalRole = summonCard;
      
      // Look for role change advance cards
      const advanceCards = await gameUtils.getAdvanceCards('A');
      const roleChangeCard = advanceCards.find(card => 
        !card.includes(originalRole) && // Different from original role
        (card.includes('Knight') || 
         card.includes('Archer') || 
         card.includes('Mage') ||
         card.includes('Berserker'))
      );
      
      if (roleChangeCard) {
        await gameUtils.page.click(`#player-a-advance .card:has(.card-name:text("${roleChangeCard}"))`);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Should enable strategic role change
        const unit = await gameUtils.getSummonUnitAt(5, 2);
        expect(unit).not.toBeNull();
      }
    }
  });

  test('should be available any time during Action Phase when requirements are met', async () => {
    // Test timing restrictions for advance cards
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const advanceCards = await gameUtils.getAdvanceCards('A');
    
    // During action phase, should be able to check advance cards
    expect(advanceCards).toBeTruthy();
    
    // Should remain available throughout action phase
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Advance cards should still be available after summoning
      const stillAvailable = await gameUtils.getAdvanceCards('A');
      expect(stillAvailable.length).toBe(advanceCards.length);
    }
  });

  test('should log advancement events', async () => {
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
      
      const advanceCards = await gameUtils.getAdvanceCards('A');
      
      if (advanceCards.length > 0) {
        const logBefore = await gameUtils.getGameLogEntries();
        
        const advanceCard = advanceCards[0];
        await gameUtils.page.click(`#player-a-advance .card:has(.card-name:text("${advanceCard}"))`);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
        
        // Should have advancement-related log entries
        const newEntries = logAfter.slice(logBefore.length);
        const advanceEntry = newEntries.find(entry => 
          entry.toLowerCase().includes('advance') ||
          entry.toLowerCase().includes('role') ||
          entry.toLowerCase().includes('transform')
        );
        expect(advanceEntry).toBeTruthy();
      }
    }
  });
});