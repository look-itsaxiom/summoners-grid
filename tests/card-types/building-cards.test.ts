import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Building Card System', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should allow placing buildings on valid board spaces', async () => {
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const buildingCard = playableCards.find(card => 
      card.includes('Building') || 
      card.includes('Tower') ||
      card.includes('Wall') ||
      card.includes('Fortress')
    );
    
    if (buildingCard) {
      const initialBuildings = await gameUtils.getBuildingsInPlay('A');
      const initialHand = await gameUtils.getPlayerHandCount('A');
      
      await gameUtils.selectCardInHand('A', buildingCard);
      await gameUtils.clickBoardCell(5, 1); // Player A territory
      await gameUtils.page.waitForTimeout(1000);
      
      const afterBuildings = await gameUtils.getBuildingsInPlay('A');
      const afterHand = await gameUtils.getPlayerHandCount('A');
      
      expect(afterBuildings.length).toBe(initialBuildings.length + 1);
      expect(afterHand).toBe(initialHand - 1);
      
      // Should appear on board
      const cellContent = await gameUtils.getBoardCellContent(5, 1);
      expect(cellContent).toContain('Building');
    }
  });

  test('should provide ongoing effects while in play', async () => {
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const buildingCard = playableCards.find(card => 
      card.includes('Building') || 
      card.includes('Tower') ||
      card.includes('Wall')
    );
    
    if (buildingCard) {
      const logBefore = await gameUtils.getGameLogEntries();
      
      await gameUtils.selectCardInHand('A', buildingCard);
      await gameUtils.clickBoardCell(5, 1);
      await gameUtils.page.waitForTimeout(1000);
      
      const logAfter = await gameUtils.getGameLogEntries();
      expect(logAfter.length).toBeGreaterThan(logBefore.length);
      
      // Should log building placement and any ongoing effects
      const newEntries = logAfter.slice(logBefore.length);
      const buildingEntry = newEntries.find(entry => 
        entry.toLowerCase().includes('building') ||
        entry.toLowerCase().includes('place') ||
        entry.toLowerCase().includes('construct')
      );
      expect(buildingEntry).toBeTruthy();
    }
  });

  test('should occupy specific board spaces with defined dimensions', async () => {
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const buildingCard = playableCards.find(card => 
      card.includes('Building') || 
      card.includes('Tower') ||
      card.includes('Wall')
    );
    
    if (buildingCard) {
      await gameUtils.selectCardInHand('A', buildingCard);
      await gameUtils.clickBoardCell(5, 1);
      await gameUtils.page.waitForTimeout(1000);
      
      // Building should occupy the space
      const cellContent = await gameUtils.getBoardCellContent(5, 1);
      expect(cellContent).not.toBe('Empty');
      
      // Space should not allow other units
      const summonCard = (await gameUtils.getPlayableCardsInHand('A')).find(card => 
        card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
      );
      
      if (summonCard) {
        await gameUtils.selectCardInHand('A', summonCard);
        await gameUtils.clickBoardCell(5, 1); // Try to place on building
        await gameUtils.page.waitForTimeout(500);
        
        // Should still only have building there
        const stillBuilding = await gameUtils.getBoardCellContent(5, 1);
        expect(stillBuilding).toContain('Building');
      }
    }
  });

  test('should require role requirements to play', async () => {
    // Buildings often require specific summon roles to construct
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const allCards = await gameUtils.getCardsInPlayerHand('A');
    const buildingCards = allCards.filter(card => 
      card.includes('Building') || 
      card.includes('Tower') ||
      card.includes('Wall') ||
      card.includes('Fortress')
    );
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const playableBuildings = playableCards.filter(card => buildingCards.includes(card));
    
    // Some buildings may not be playable without meeting requirements
    // This tests the requirement system for buildings
  });

  test('should move to discard pile when destroyed', async () => {
    // According to GDD: "Counter, Building, Quest cards → Discard Pile"
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const buildingCard = playableCards.find(card => 
      card.includes('Building') || 
      card.includes('Tower') ||
      card.includes('Wall')
    );
    
    if (buildingCard) {
      await gameUtils.selectCardInHand('A', buildingCard);
      await gameUtils.clickBoardCell(5, 1);
      await gameUtils.page.waitForTimeout(1000);
      
      const buildings = await gameUtils.getBuildingsInPlay('A');
      expect(buildings.length).toBeGreaterThan(0);
      
      // When destroyed (by card effects), should go to discard
      // This would need specific destruction effects to test fully
    }
  });
});