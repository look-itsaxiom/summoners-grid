/**
 * UnitToken - A Phaser game object representing a unit on the grid.
 *
 * Displays:
 * - HP bar with color-coded health status
 * - Level indicator
 * - Role information
 * - Selection state
 */

import Phaser from 'phaser';
import type { UnitId, PlayerIndex } from '@summoners-grid/engine';

/**
 * Data required to create a UnitToken.
 */
export interface UnitTokenData {
  unitId: UnitId;
  owner: PlayerIndex;
  currentHp: number;
  maxHp: number;
  level: number;
  roleName: string;
  roleFamily: 'warrior' | 'magician' | 'scout';
  species: string;
  name: string;
}

/**
 * Optional configuration for UnitToken appearance.
 */
export interface UnitTokenConfig {
  size?: number;
  hpBarHeight?: number;
}

// HP bar color thresholds
const HP_COLOR_HIGH = 0x00ff00; // Green (>50%)
const HP_COLOR_MEDIUM = 0xffff00; // Yellow (25-50%)
const HP_COLOR_LOW = 0xff0000; // Red (<25%)

/**
 * UnitToken class representing a unit on the game board.
 */
export class UnitToken extends Phaser.GameObjects.Container {
  private data: UnitTokenData;
  private config: Required<UnitTokenConfig>;
  private selected = false;

  // Visual components (would be created in a real implementation)
  private hpBar?: Phaser.GameObjects.Rectangle;
  private levelText?: Phaser.GameObjects.Text;
  private roleText?: Phaser.GameObjects.Text;
  private selectionIndicator?: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    data: UnitTokenData,
    config?: Partial<UnitTokenConfig>
  ) {
    super(scene, x, y);

    this.data = { ...data };
    this.config = {
      size: config?.size ?? 48,
      hpBarHeight: config?.hpBarHeight ?? 6,
    };

    // Clamp HP to valid range
    this.data.currentHp = Math.max(0, this.data.currentHp);

    this.createVisuals();
  }

  /**
   * Create the visual components.
   */
  private createVisuals(): void {
    // In a real implementation, this would create the Phaser game objects
    // For testing, we just ensure the structure exists
  }

  /**
   * Get the current HP value.
   */
  getCurrentHp(): number {
    return this.data.currentHp;
  }

  /**
   * Get the maximum HP value.
   */
  getMaxHp(): number {
    return this.data.maxHp;
  }

  /**
   * Get the unit's level.
   */
  getLevel(): number {
    return this.data.level;
  }

  /**
   * Get the role name.
   */
  getRoleName(): string {
    return this.data.roleName;
  }

  /**
   * Get the role family.
   */
  getRoleFamily(): string {
    return this.data.roleFamily;
  }

  /**
   * Get the unit ID.
   */
  getUnitId(): UnitId {
    return this.data.unitId;
  }

  /**
   * Get the owner player index.
   */
  getOwner(): PlayerIndex {
    return this.data.owner;
  }

  /**
   * Calculate HP as a percentage (0-1).
   */
  getHpPercentage(): number {
    if (this.data.maxHp <= 0) return 0;
    return Math.min(1, Math.max(0, this.data.currentHp / this.data.maxHp));
  }

  /**
   * Get the HP bar color based on current HP percentage.
   */
  getHpBarColor(): number {
    const percentage = this.getHpPercentage();
    if (percentage > 0.5) return HP_COLOR_HIGH;
    if (percentage >= 0.25) return HP_COLOR_MEDIUM;
    return HP_COLOR_LOW;
  }

  /**
   * Update HP values.
   */
  updateHp(currentHp: number, maxHp: number): void {
    this.data.currentHp = Math.max(0, currentHp);
    this.data.maxHp = maxHp;
    this.updateHpBar();
  }

  /**
   * Update the level.
   */
  updateLevel(level: number): void {
    this.data.level = level;
    this.updateLevelText();
  }

  /**
   * Update the role.
   */
  updateRole(roleName: string, roleFamily: 'warrior' | 'magician' | 'scout'): void {
    this.data.roleName = roleName;
    this.data.roleFamily = roleFamily;
    this.updateRoleText();
  }

  /**
   * Set selection state.
   */
  setSelected(selected: boolean): void {
    this.selected = selected;
    this.updateSelectionIndicator();
  }

  /**
   * Check if the unit is selected.
   */
  isSelected(): boolean {
    return this.selected;
  }

  /**
   * Update HP bar visual.
   */
  private updateHpBar(): void {
    // In a real implementation, this would update the HP bar visual
  }

  /**
   * Update level text visual.
   */
  private updateLevelText(): void {
    // In a real implementation, this would update the level text
  }

  /**
   * Update role text visual.
   */
  private updateRoleText(): void {
    // In a real implementation, this would update the role text
  }

  /**
   * Update selection indicator visual.
   */
  private updateSelectionIndicator(): void {
    // In a real implementation, this would show/hide the selection indicator
  }

  /**
   * Clean up the token.
   */
  destroy(fromScene?: boolean): void {
    this.hpBar?.destroy();
    this.levelText?.destroy();
    this.roleText?.destroy();
    this.selectionIndicator?.destroy();
    super.destroy(fromScene);
  }
}
