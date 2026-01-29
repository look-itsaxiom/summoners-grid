/**
 * UnitToken Tests
 *
 * TDD tests for UnitToken - a Phaser game object representing a unit on the grid.
 * Displays HP bar, level indicator, role icon, and selection state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UnitId, Stats, PlayerIndex } from '@summoners-grid/engine';

// Mock Phaser to avoid canvas/WebGL issues in tests
vi.mock('phaser', () => {
  class MockRectangle {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    fillColor = 0;
    fillAlpha = 1;
    setFillStyle = vi.fn().mockReturnThis();
    setStrokeStyle = vi.fn().mockReturnThis();
    setOrigin = vi.fn().mockReturnThis();
    setDepth = vi.fn().mockReturnThis();
    destroy = vi.fn();
    constructor(
      _scene?: any,
      x?: number,
      y?: number,
      width?: number,
      height?: number,
      fillColor?: number,
      fillAlpha?: number
    ) {
      this.x = x ?? 0;
      this.y = y ?? 0;
      this.width = width ?? 0;
      this.height = height ?? 0;
      this.fillColor = fillColor ?? 0;
      this.fillAlpha = fillAlpha ?? 1;
    }
  }

  class MockText {
    x = 0;
    y = 0;
    text = '';
    setText = vi.fn().mockImplementation(function (this: MockText, text: string) {
      this.text = text;
      return this;
    });
    setOrigin = vi.fn().mockReturnThis();
    setFontSize = vi.fn().mockReturnThis();
    setFontFamily = vi.fn().mockReturnThis();
    setColor = vi.fn().mockReturnThis();
    setStroke = vi.fn().mockReturnThis();
    setDepth = vi.fn().mockReturnThis();
    destroy = vi.fn();
    constructor(_scene?: any, x?: number, y?: number, text?: string) {
      this.x = x ?? 0;
      this.y = y ?? 0;
      this.text = text ?? '';
    }
  }

  class MockContainer {
    x = 0;
    y = 0;
    children: any[] = [];
    _depth = 0;
    add = vi.fn().mockImplementation(function (this: MockContainer, child: any | any[]) {
      if (Array.isArray(child)) {
        this.children.push(...child);
      } else {
        this.children.push(child);
      }
      return this;
    });
    remove = vi.fn().mockReturnThis();
    removeAll = vi.fn().mockImplementation(function (this: MockContainer) {
      this.children = [];
      return this;
    });
    destroy = vi.fn();
    setPosition = vi.fn().mockImplementation(function (this: MockContainer, x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    });
    setSize = vi.fn().mockReturnThis();
    setInteractive = vi.fn().mockReturnThis();
    setDepth = vi.fn().mockImplementation(function (this: MockContainer, depth: number) {
      this._depth = depth;
      return this;
    });
    on = vi.fn().mockReturnThis();
    off = vi.fn().mockReturnThis();
    emit = vi.fn().mockReturnThis();
    scene: any = null;
    constructor(scene?: any, x?: number, y?: number) {
      this.scene = scene;
      this.x = x ?? 0;
      this.y = y ?? 0;
    }
  }

  class MockGraphics {
    fillStyle = vi.fn().mockReturnThis();
    fillRect = vi.fn().mockReturnThis();
    fillRoundedRect = vi.fn().mockReturnThis();
    strokeRect = vi.fn().mockReturnThis();
    lineStyle = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    destroy = vi.fn();
    setDepth = vi.fn().mockReturnThis();
  }

  class MockScene {
    add = {
      container: vi.fn((x: number, y: number) => new MockContainer(this, x, y)),
      graphics: vi.fn(() => new MockGraphics()),
      text: vi.fn((x: number, y: number, text: string) => new MockText(this, x, y, text)),
      rectangle: vi.fn(
        (x: number, y: number, w: number, h: number, c?: number, a?: number) =>
          new MockRectangle(this, x, y, w, h, c, a)
      ),
      existing: vi.fn((obj: any) => obj),
    };
    events = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
  }

  return {
    default: {
      GameObjects: {
        Container: MockContainer,
        Graphics: MockGraphics,
        Text: MockText,
        Rectangle: MockRectangle,
      },
      Scene: MockScene,
    },
    GameObjects: {
      Container: MockContainer,
      Graphics: MockGraphics,
      Text: MockText,
      Rectangle: MockRectangle,
    },
    Scene: MockScene,
  };
});

// Import after mocks
import { UnitToken, UnitTokenConfig, UnitTokenData } from '../UnitToken';

// Helper to create mock scene
function createMockScene(): any {
  return {
    add: {
      container: vi.fn((x: number, y: number) => {
        const container = new (vi.mocked(require('phaser')).default.GameObjects.Container)(null, x, y);
        return container;
      }),
      rectangle: vi.fn((...args: any[]) => {
        return new (vi.mocked(require('phaser')).default.GameObjects.Rectangle)(...args);
      }),
      text: vi.fn((...args: any[]) => {
        return new (vi.mocked(require('phaser')).default.GameObjects.Text)(...args);
      }),
    },
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
  };
}

// Helper to create unit data
function createUnitData(overrides: Partial<UnitTokenData> = {}): UnitTokenData {
  return {
    unitId: 'unit-1' as UnitId,
    owner: 0 as PlayerIndex,
    currentHp: 100,
    maxHp: 100,
    level: 5,
    roleName: 'Squire',
    roleFamily: 'warrior',
    species: 'gignen',
    name: 'Test Unit',
    ...overrides,
  };
}

describe('UnitToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * HAPPY PATH SCENARIOS
   * Basic functionality under normal conditions
   */
  describe('happy path scenarios', () => {
    it('should create a UnitToken with valid data', async () => {
      const scene = await createMockScene();
      const data = createUnitData();

      const token = new UnitToken(scene, 100, 100, data);

      expect(token).toBeDefined();
    });

    it('should display the current HP value', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 75, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getCurrentHp()).toBe(75);
    });

    it('should display the max HP value', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 75, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getMaxHp()).toBe(100);
    });

    it('should display the level indicator', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ level: 12 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getLevel()).toBe(12);
    });

    it('should display the role name', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ roleName: 'Knight' });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getRoleName()).toBe('Knight');
    });

    it('should have the correct unit ID', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ unitId: 'unit-42' as UnitId });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getUnitId()).toBe('unit-42');
    });

    it('should track owner correctly', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ owner: 1 as PlayerIndex });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getOwner()).toBe(1);
    });
  });

  /**
   * SUCCESS SCENARIOS
   * Operations that should complete successfully
   */
  describe('success scenarios', () => {
    it('should update HP values', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 100, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);
      token.updateHp(50, 100);

      expect(token.getCurrentHp()).toBe(50);
      expect(token.getMaxHp()).toBe(100);
    });

    it('should update level', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ level: 5 });

      const token = new UnitToken(scene, 100, 100, data);
      token.updateLevel(10);

      expect(token.getLevel()).toBe(10);
    });

    it('should update role', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ roleName: 'Squire', roleFamily: 'warrior' });

      const token = new UnitToken(scene, 100, 100, data);
      token.updateRole('Knight', 'warrior');

      expect(token.getRoleName()).toBe('Knight');
      expect(token.getRoleFamily()).toBe('warrior');
    });

    it('should set selection state to true', async () => {
      const scene = await createMockScene();
      const data = createUnitData();

      const token = new UnitToken(scene, 100, 100, data);
      token.setSelected(true);

      expect(token.isSelected()).toBe(true);
    });

    it('should set selection state to false', async () => {
      const scene = await createMockScene();
      const data = createUnitData();

      const token = new UnitToken(scene, 100, 100, data);
      token.setSelected(true);
      token.setSelected(false);

      expect(token.isSelected()).toBe(false);
    });

    it('should properly destroy the token', async () => {
      const scene = await createMockScene();
      const data = createUnitData();

      const token = new UnitToken(scene, 100, 100, data);

      expect(() => token.destroy()).not.toThrow();
    });
  });

  /**
   * FAILURE SCENARIOS
   * Graceful handling of missing/invalid data
   */
  describe('failure scenarios', () => {
    it('should handle zero HP gracefully', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 0, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getCurrentHp()).toBe(0);
      expect(token.getHpPercentage()).toBe(0);
    });

    it('should handle HP greater than max gracefully', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 150, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      // Should clamp to 100% for display
      expect(token.getHpPercentage()).toBeLessThanOrEqual(1);
    });

    it('should handle empty role name', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ roleName: '' });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getRoleName()).toBe('');
    });
  });

  /**
   * ERROR SCENARIOS
   * Exception handling
   */
  describe('error scenarios', () => {
    it('should not throw when updating HP with negative values', async () => {
      const scene = await createMockScene();
      const data = createUnitData();

      const token = new UnitToken(scene, 100, 100, data);

      expect(() => token.updateHp(-10, 100)).not.toThrow();
      expect(token.getCurrentHp()).toBe(0); // Should clamp to 0
    });

    it('should not throw when updating level with invalid values', async () => {
      const scene = await createMockScene();
      const data = createUnitData();

      const token = new UnitToken(scene, 100, 100, data);

      expect(() => token.updateLevel(-1)).not.toThrow();
    });
  });

  /**
   * EDGE CASES
   * Boundary conditions and unusual scenarios
   */
  describe('edge cases', () => {
    it('should handle minimum level (5)', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ level: 5 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getLevel()).toBe(5);
    });

    it('should handle maximum level (20)', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ level: 20 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getLevel()).toBe(20);
    });

    it('should calculate HP percentage correctly at 50%', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 50, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getHpPercentage()).toBe(0.5);
    });

    it('should calculate HP percentage correctly at full HP', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 100, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getHpPercentage()).toBe(1);
    });

    it('should handle all role families', async () => {
      const scene = await createMockScene();

      const families: Array<'warrior' | 'magician' | 'scout'> = ['warrior', 'magician', 'scout'];

      for (const family of families) {
        const data = createUnitData({ roleFamily: family });
        const token = new UnitToken(scene, 100, 100, data);
        expect(token.getRoleFamily()).toBe(family);
      }
    });

    it('should accept custom configuration', async () => {
      const scene = await createMockScene();
      const data = createUnitData();
      const config: Partial<UnitTokenConfig> = {
        size: 64,
        hpBarHeight: 8,
      };

      const token = new UnitToken(scene, 100, 100, data, config);

      expect(token).toBeDefined();
    });

    it('should default to not selected', async () => {
      const scene = await createMockScene();
      const data = createUnitData();

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.isSelected()).toBe(false);
    });
  });

  /**
   * HP BAR VISUALIZATION
   * Tests for HP bar display
   */
  describe('HP bar visualization', () => {
    it('should show green HP bar when HP is high (>50%)', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 80, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getHpBarColor()).toBe(0x00ff00); // Green
    });

    it('should show yellow HP bar when HP is medium (25-50%)', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 40, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getHpBarColor()).toBe(0xffff00); // Yellow
    });

    it('should show red HP bar when HP is low (<25%)', async () => {
      const scene = await createMockScene();
      const data = createUnitData({ currentHp: 20, maxHp: 100 });

      const token = new UnitToken(scene, 100, 100, data);

      expect(token.getHpBarColor()).toBe(0xff0000); // Red
    });
  });
});
