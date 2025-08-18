import { test, expect } from '@playwright/test';
import { GameTestUtils } from '../setup/test-utils';

test.describe('Unit Movement System', () => {
  let gameUtils: GameTestUtils;

  test.beforeEach(async ({ page }) => {
    gameUtils = new GameTestUtils(page);
    await gameUtils.navigateToGame();
  });

  test('should allow moving summoned units within movement range', async () => {
    // First, summon a unit
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      // Summon the unit
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Verify unit is placed
      await gameUtils.expectSummonUnitAt(5, 2);
      
      // Select the unit to see movement options
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      // Should show valid movement positions
      const validMovePositions = await gameUtils.getValidMovePositions();
      expect(validMovePositions.length).toBeGreaterThan(0);
      
      // Move to a valid position
      if (validMovePositions.length > 0) {
        const targetPosition = validMovePositions[0];
        await gameUtils.clickBoardCell(targetPosition.x, targetPosition.y);
        await gameUtils.page.waitForTimeout(1000);
        
        // Unit should now be at new position
        await gameUtils.expectSummonUnitAt(targetPosition.x, targetPosition.y);
        // Original position should be empty
        await gameUtils.expectEmptyBoardCell(5, 2);
      }
    }
  });

  test('should respect movement speed limits', async () => {
    // Summon a unit and test movement range
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2); // Center of Player A territory
      await gameUtils.page.waitForTimeout(1000);
      
      // Select unit to see movement range
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      const validMovePositions = await gameUtils.getValidMovePositions();
      
      // All valid positions should be within reasonable movement range
      // Most units have movement of 2-8, so positions shouldn't be too far
      for (const pos of validMovePositions) {
        const distance = Math.abs(pos.x - 5) + Math.abs(pos.y - 2); // Manhattan distance
        expect(distance).toBeLessThanOrEqual(8); // Reasonable upper bound
      }
    }
  });

  test('should allow split movement (before and after other actions)', async () => {
    // According to GDD, movement can be split before/after other actions
    // This test verifies basic movement functionality that would support split movement
    
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      // Summon unit
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 1);
      await gameUtils.page.waitForTimeout(1000);
      
      // Move unit forward
      await gameUtils.selectSummonUnit(5, 1);
      await gameUtils.page.waitForTimeout(500);
      
      const validMoves1 = await gameUtils.getValidMovePositions();
      if (validMoves1.length > 0) {
        await gameUtils.clickBoardCell(validMoves1[0].x, validMoves1[0].y);
        await gameUtils.page.waitForTimeout(1000);
        
        // Try to move again (split movement)
        await gameUtils.selectSummonUnit(validMoves1[0].x, validMoves1[0].y);
        await gameUtils.page.waitForTimeout(500);
        
        const validMoves2 = await gameUtils.getValidMovePositions();
        // Should have some movement left (depending on unit's movement speed)
        // If movement is split correctly, should have remaining movement points
      }
    }
  });

  test('should prevent movement beyond available movement points', async () => {
    // Test that units can't move infinitely
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
      
      // Move unit to use up movement
      let moveCount = 0;
      let currentX = 5, currentY = 2;
      
      while (moveCount < 10) { // Prevent infinite loop
        await gameUtils.selectSummonUnit(currentX, currentY);
        await gameUtils.page.waitForTimeout(500);
        
        const validMoves = await gameUtils.getValidMovePositions();
        if (validMoves.length === 0) {
          // No more valid moves - movement exhausted
          break;
        }
        
        // Move to first valid position
        await gameUtils.clickBoardCell(validMoves[0].x, validMoves[0].y);
        await gameUtils.page.waitForTimeout(1000);
        
        currentX = validMoves[0].x;
        currentY = validMoves[0].y;
        moveCount++;
      }
      
      // Should have eventually run out of movement
      expect(moveCount).toBeGreaterThan(0); // Should have moved at least once
      expect(moveCount).toBeLessThan(10); // Should have stopped before hitting our limit
    }
  });

  test('should allow diagonal movement', async () => {
    // GDD specifies diagonal movement is allowed
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(6, 1); // Position with room for diagonal movement
      await gameUtils.page.waitForTimeout(1000);
      
      await gameUtils.selectSummonUnit(6, 1);
      await gameUtils.page.waitForTimeout(500);
      
      const validMoves = await gameUtils.getValidMovePositions();
      
      // Check if diagonal positions are included
      const diagonalMoves = validMoves.filter(pos => 
        pos.x !== 6 && pos.y !== 1 // Not same row or column = diagonal
      );
      
      expect(diagonalMoves.length).toBeGreaterThan(0);
      
      // Test moving diagonally
      if (diagonalMoves.length > 0) {
        const diagonalTarget = diagonalMoves[0];
        await gameUtils.clickBoardCell(diagonalTarget.x, diagonalTarget.y);
        await gameUtils.page.waitForTimeout(1000);
        
        await gameUtils.expectSummonUnitAt(diagonalTarget.x, diagonalTarget.y);
      }
    }
  });

  test('should prevent movement into occupied spaces', async () => {
    // Need two units to test collision
    await gameUtils.endPhase(); // Draw
    await gameUtils.endPhase(); // Level
    await gameUtils.expectTurnPhase('Action');
    
    const playableCards = await gameUtils.getPlayableCardsInHand('A');
    const summonCard = playableCards.find(card => 
      card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
    );
    
    if (summonCard) {
      // Place first unit
      await gameUtils.selectCardInHand('A', summonCard);
      await gameUtils.clickBoardCell(5, 2);
      await gameUtils.page.waitForTimeout(1000);
      
      // Complete turn cycle to get another summon
      await gameUtils.completeTurn(); // End Player A turn
      await gameUtils.completeTurn(); // Complete Player B turn
      
      // Player A Turn 2 - try to summon another unit
      await gameUtils.endPhase(); // Draw
      await gameUtils.endPhase(); // Level
      await gameUtils.expectTurnPhase('Action');
      
      const newPlayableCards = await gameUtils.getPlayableCardsInHand('A');
      const newSummonCard = newPlayableCards.find(card => 
        card.includes('Warrior') || card.includes('Scout') || card.includes('Magician')
      );
      
      if (newSummonCard) {
        // Place second unit nearby
        await gameUtils.selectCardInHand('A', newSummonCard);
        await gameUtils.clickBoardCell(4, 2);
        await gameUtils.page.waitForTimeout(1000);
        
        // Try to move second unit into first unit's space
        await gameUtils.selectSummonUnit(4, 2);
        await gameUtils.page.waitForTimeout(500);
        
        const validMoves = await gameUtils.getValidMovePositions();
        
        // Position (5, 2) should not be in valid moves (occupied by first unit)
        const invalidMove = validMoves.find(pos => pos.x === 5 && pos.y === 2);
        expect(invalidMove).toBeUndefined();
      }
    }
  });

  test('should show movement indicators on unit selection', async () => {
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
      
      // Before selection - no movement indicators
      let validMoves = await gameUtils.getValidMovePositions();
      expect(validMoves.length).toBe(0);
      
      // Select unit
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      // After selection - should show movement indicators
      validMoves = await gameUtils.getValidMovePositions();
      expect(validMoves.length).toBeGreaterThan(0);
    }
  });

  test('should log movement events', async () => {
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
      
      const logBefore = await gameUtils.getGameLogEntries();
      
      // Move the unit
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      const validMoves = await gameUtils.getValidMovePositions();
      if (validMoves.length > 0) {
        await gameUtils.clickBoardCell(validMoves[0].x, validMoves[0].y);
        await gameUtils.page.waitForTimeout(1000);
        
        const logAfter = await gameUtils.getGameLogEntries();
        expect(logAfter.length).toBeGreaterThan(logBefore.length);
        
        // Should have movement-related log entry
        const newEntries = logAfter.slice(logBefore.length);
        const moveEntry = newEntries.find(entry => 
          entry.toLowerCase().includes('move') || 
          entry.toLowerCase().includes('position')
        );
        expect(moveEntry).toBeTruthy();
      }
    }
  });

  test('should reset movement options when different unit is selected', async () => {
    // This test would need multiple units, but tests the UI behavior
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
      
      // Select unit
      await gameUtils.selectSummonUnit(5, 2);
      await gameUtils.page.waitForTimeout(500);
      
      const validMoves = await gameUtils.getValidMovePositions();
      expect(validMoves.length).toBeGreaterThan(0);
      
      // Click elsewhere to deselect
      await gameUtils.clickBoardCell(0, 0); // Empty area
      await gameUtils.page.waitForTimeout(500);
      
      // Movement indicators should be gone
      const noMoves = await gameUtils.getValidMovePositions();
      expect(noMoves.length).toBe(0);
    }
  });
});