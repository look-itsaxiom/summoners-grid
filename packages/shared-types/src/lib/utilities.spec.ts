// ============================================================================
// SHARED UTILITIES TESTS (Basic Version)
// Tests for task #007: Implement shared utility functions
// ============================================================================

import {
  calculateDistance,
  isValidPosition,
  getAdjacentPositions,
  canPerformActionInPhase,
  isValidCardForSlot,
  validateHandSize,
  calculateFinalStat,
  Logger,
  LogLevel,
  GameError
} from './utilities';

import { Position, TurnPhase, CardType } from './shared-types';

describe('Shared Utilities', () => {
  
  describe('Position and Movement Utilities', () => {
    
    it('should calculate Manhattan distance correctly', () => {
      expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
      expect(calculateDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });

    it('should validate positions within 12x14 grid', () => {
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 11, y: 13 })).toBe(true);
      expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 12, y: 0 })).toBe(false);
    });

    it('should return adjacent positions for center position', () => {
      const adjacent = getAdjacentPositions({ x: 5, y: 5 });
      expect(adjacent).toHaveLength(8);
      expect(adjacent).toContainEqual({ x: 4, y: 4 });
      expect(adjacent).toContainEqual({ x: 6, y: 6 });
    });
  });

  describe('Game Rule Validation Utilities', () => {
    
    it('should allow correct actions in each phase', () => {
      expect(canPerformActionInPhase('play_card', TurnPhase.ACTION)).toBe(true);
      expect(canPerformActionInPhase('draw_card', TurnPhase.DRAW)).toBe(true);
      expect(canPerformActionInPhase('play_card', TurnPhase.DRAW)).toBe(false);
    });

    it('should validate card types for slots', () => {
      expect(isValidCardForSlot(CardType.SUMMON, 'summon')).toBe(true);
      expect(isValidCardForSlot(CardType.ACTION, 'main_deck')).toBe(true);
      expect(isValidCardForSlot(CardType.ACTION, 'summon')).toBe(false);
    });

    it('should validate hand size within limits', () => {
      expect(validateHandSize(6, 6)).toBe(true);
      expect(validateHandSize(7, 6)).toBe(false);
    });
  });

  describe('Stat Calculation Utilities', () => {
    
    it('should calculate final stat with all modifiers', () => {
      const result = calculateFinalStat(10, 5, 1.5, 1.2, 3);
      expect(result).toBeGreaterThan(10);
    });
  });

  describe('Logging and Error Handling Utilities', () => {
    
    beforeEach(() => {
      Logger.clearLogs();
    });

    it('should log messages with correct metadata', () => {
      Logger.info('Test message', { key: 'value' }, 'TestSource');
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Test message');
    });

    it('should create GameError with code and context', () => {
      const error = new GameError('Test error', 'TEST_CODE', { extra: 'data' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toEqual({ extra: 'data' });
    });
  });
});