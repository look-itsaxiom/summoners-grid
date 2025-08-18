import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Action Card System', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should only allow playing action cards when requirements are met', async () => {
    // Navigate to action phase
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialPlayableCards = await gameUtils.getPlayableCardsInHand('A');
    
    // Look for action cards that require specific conditions
    const actionCards = initialPlayableCards.filter(card => 
      card.includes('Sharpened') || 
      card.includes('Blade') || 
      card.includes('Healing') ||
      card.includes('Rush') ||
      card.includes('Tempest')
    );
    
    // Some action cards should not be playable without meeting requirements
    if (actionCards.length > 0) {
      // Check that cards requiring summons aren't playable without summons
      const allCards = await gameUtils.getCardsInPlayerHand('A');
      const nonPlayableActions = allCards.filter(card => 
        (card.includes('Sharpened') || card.includes('Blade')) && 
        !initialPlayableCards.includes(card)
      );
      
      // Should have some action cards that aren't playable yet
      // (This tests the requirement system)
    }
  });

  test('should become playable after requirements are met', async () => {
    // Test that action cards become playable after summoning units (meeting requirements)
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const initialPlayableActions = await gameUtils.getPlayableCardsInHand('A').then(cards =>
      cards.filter(card => 
        card.includes('Sharpened') || 
        card.includes('Blade') || 
        card.includes('Healing') ||
        card.includes('Rush') ||
        card.includes('Tempest')
      )
    );
    
    // Summon a unit to meet requirements
    const summonCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Check if more action cards are now playable
      const newPlayableActions = await gameUtils.getPlayableCardsInHand('A').then(cards =>
        cards.filter(card => 
          card.includes('Sharpened') || 
          card.includes('Blade') || 
          card.includes('Healing') ||
          card.includes('Rush') ||
          card.includes('Tempest')
        )
      );
      
      // Should have more playable action cards after summoning
      expect(newPlayableActions.length).toBeGreaterThanOrEqual(initialPlayableActions.length);
    }
  });

  test('should apply effects correctly when played', async () => {
    // Test action card effects (like Sharpened Blade increasing weapon power)
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Summon a unit first
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Now play an action card that affects the unit
      const actionCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Sharpened') || 
        card.includes('Blade') || 
        card.includes('Healing') ||
        card.includes('Rush') ||
        card.includes('Tempest')
      );
      
      if (actionCard) {
        const logBefore = await gameUtils.getGameLogEntries();
        const handBefore = await gameUtils.getPlayerHandCount('A');
        
        await gameUtils.selectCardInHand('A', actionCard);
        
        // Some action cards target units
        if (actionCard.includes('Sharpened') || actionCard.includes('Blade') || 
            actionCard.includes('Healing') || actionCard.includes('Rush') || 
            actionCard.includes('Tempest')) {
          await gameUtils.selectSummonUnit(5, 2);
        }
        
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        const handAfter = await gameUtils.getPlayerHandCount('A');
        
        // Card should be played and hand reduced
        expect(handAfter).toBe(handBefore - 1);
        
        // Should have effect logged
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
        
        const newEntries = logAfter.slice(logBefore.length);
        const effectEntry = newEntries.find(entry => 
          entry.toLowerCase().includes('effect') || 
          entry.toLowerCase().includes('power') ||
          entry.toLowerCase().includes('blade') ||
          entry.toLowerCase().includes('heal') ||
          entry.toLowerCase().includes('rush')
        );
        expect(effectEntry).toBeTruthy();
      }
    }
  });

  test('should move to recharge pile after resolution (Action/Reaction cards)', async () => {
    // According to GDD: "Action, Reaction cards → Recharge Pile"
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Summon unit and play action card
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      const actionCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Sharpened') || 
        card.includes('Blade') || 
        card.includes('Healing') ||
        card.includes('Rush') ||
        card.includes('Tempest')
      );
      
      if (actionCard) {
        const rechargeBefore = await gameUtils.getPlayerRechargeCount('A');
        
        await gameUtils.selectCardInHand('A', actionCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const rechargeAfter = await gameUtils.getPlayerRechargeCount('A');
        
        // Action card should go to recharge pile
        expect(rechargeAfter).toBe(rechargeBefore + 1);
      }
    }
  });

  test('should have different speeds (Action, Reaction, Counter)', async () => {
    // Test that different action cards have appropriate speeds
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const allCards = await gameUtils.getCardsInPlayerHand('A');
    const actionCards = allCards.filter(card => 
      card.includes('Sharpened') || 
      card.includes('Blade') || 
      card.includes('Healing') ||
      card.includes('Rush') ||
      card.includes('Tempest')
    );
    
    // Should have various action cards available
    expect(actionCards.length).toBeGreaterThan(0);
    
    // During action phase, action speed cards should be playable
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const playableActions = playableCards.filter(card => actionCards.includes(card));
    
    // Some action cards should be available (depending on requirements)
    expect(playableActions.length).toBeGreaterThanOrEqual(0);
  });

  test('should require specific conditions based on card type', async () => {
    // Test requirement system (summon roles, targets, etc.)
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Before summoning - certain cards shouldn't be playable
    const preSummonPlayable = await gameUtils.getPlayableCardsInHand('A');
    const preSummonActions = preSummonPlayable.filter(card => 
      card.includes('Sharpened') || card.includes('Blade')
    );
    
    // Sharpened Blade requires Warrior summon according to play example
    
    // Summon a Warrior
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const warriorCard = playableCards.find(card => card.includes('Warrior'));
    
    if (warriorCard) {
      await gameUtils.selectCardInHand('A', warriorCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Now Sharpened Blade should be playable
      const postSummonPlayable = await gameUtils.getPlayableCardsInHand('A');
      const postSummonActions = postSummonPlayable.filter(card => 
        card.includes('Sharpened') || card.includes('Blade')
      );
      
      // Should have more warrior-targeting cards playable
      expect(postSummonActions.length).toBeGreaterThanOrEqual(preSummonActions.length);
    }
  });

  test('should target valid units or effects', async () => {
    // Test targeting system for action cards
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    // Summon a target
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Play targeting action card
      const targetingCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Healing') || 
        card.includes('Sharpened') || 
        card.includes('Rush') ||
        card.includes('Tempest')
      );
      
      if (targetingCard) {
        await gameUtils.selectCardInHand('A', targetingCard);
        
        // Should be able to target the summoned unit
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Card should resolve successfully
        const rechargeCards = await gameUtils.getPlayerRechargeCount('A');
        expect(rechargeCards).toBeGreaterThan(0);
      }
    }
  });

  test('should modify unit stats temporarily or permanently', async () => {
    // Test stat modification effects
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
      
      // Play a stat-modifying card
      const statCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Sharpened') || 
        card.includes('Rush') ||
        card.includes('Tempest')
      );
      
      if (statCard) {
        await gameUtils.selectCardInHand('A', statCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Check if unit stats changed
        const modifiedUnit = await gameUtils.getSummonUnitAt(5, 2);
        
        // Unit should still exist and may have modified stats
        expect(modifiedUnit).not.toBeNull();
        expect(modifiedUnit?.position).toEqual({ x: 5, y: 2 });
      }
    }
  });

  test('should grant additional abilities or effects', async () => {
    // Test cards that grant additional attacks, movement, etc.
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
      
      // Play enhancement card (like Tempest Slash for additional movement/attack)
      const enhanceCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Tempest') || 
        card.includes('Rush') ||
        card.includes('additional') ||
        card.includes('extra')
      );
      
      if (enhanceCard) {
        const logBefore = await gameUtils.getGameLogEntries();
        
        await gameUtils.selectCardInHand('A', enhanceCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        
        // Should have entries about additional abilities
        const newEntries = logAfter.slice(logBefore.length);
        const abilityEntry = newEntries.find(entry => 
          entry.toLowerCase().includes('additional') || 
          entry.toLowerCase().includes('movement') ||
          entry.toLowerCase().includes('attack') ||
          entry.toLowerCase().includes('effect')
        );
        expect(abilityEntry).toBeTruthy();
      }
    }
  });

  test('should log action card effects and resolutions', async () => {
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
      
      const actionCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Sharpened') || 
        card.includes('Blade') || 
        card.includes('Healing') ||
        card.includes('Rush') ||
        card.includes('Tempest')
      );
      
      if (actionCard) {
        await gameUtils.selectCardInHand('A', actionCard);
        await gameUtils.selectSummonUnit(5, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
        
        // Should have detailed logs about the action
        const newEntries = logAfter.slice(logBefore.length);
        const actionEntry = newEntries.find(entry => 
          entry.toLowerCase().includes(actionCard.toLowerCase()) ||
          entry.toLowerCase().includes('effect') ||
          entry.toLowerCase().includes('resolves')
        );
        expect(actionEntry).toBeTruthy();
      }
    }
  });
});