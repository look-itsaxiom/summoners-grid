/**
 * Summon Entity for Summoner's Grid
 * 
 * Represents a summon unit on the game board with:
 * - Visual representation with stats and health indicators
 * - Smooth movement animations
 * - Position validation per game rules
 * - Interactive selection and hover states
 * - Status effect indicators
 */

import Phaser from 'phaser';
import { 
  CardInstance, 
  CardTemplate, 
  SummonStats,
  Position,
  Role,
  StatusEffect
} from '@summoners-grid/shared-types';
import { BoardPosition } from './GameBoard';

export interface SummonDisplayConfig {
  position: BoardPosition;
  stats: SummonStats;
  role: Role;
  cardInstance: CardInstance;
  cardTemplate: CardTemplate;
  interactive?: boolean;
}

export class Summon extends Phaser.GameObjects.Container {
  private config: SummonDisplayConfig;
  private boardPosition: BoardPosition;
  private tileSize: number = 48;
  
  // Visual components
  private summonSprite!: Phaser.GameObjects.Graphics;
  private healthBar!: Phaser.GameObjects.Container;
  private levelIndicator!: Phaser.GameObjects.Text;
  private statusEffects: Phaser.GameObjects.Container[] = [];
  
  // Interactive components
  private selectionRing?: Phaser.GameObjects.Graphics;
  private hoverGlow?: Phaser.GameObjects.Graphics;
  private movementIndicator?: Phaser.GameObjects.Graphics;
  
  // State
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private canMove: boolean = true;
  private hasAttacked: boolean = false;
  private movementUsed: number = 0;

  constructor(scene: Phaser.Scene, config: SummonDisplayConfig) {
    // Calculate screen position from board position
    const screenPos = Summon.boardToScreenPosition(config.position);
    super(scene, screenPos.x, screenPos.y);
    
    this.config = config;
    this.boardPosition = config.position;
    
    this.createSummonVisuals();
    this.setupInteractivity();
    
    // Add to scene
    scene.add.existing(this);
    
    // Set depth for proper layering
    this.setDepth(10);
  }

  private createSummonVisuals(): void {
    // Main summon sprite (placeholder colored circle for now)
    this.createSummonSprite();
    
    // Health bar above summon
    this.createHealthBar();
    
    // Level indicator
    this.createLevelIndicator();
    
    // Role indicator
    this.createRoleIndicator();
  }

  private createSummonSprite(): void {
    const size = this.tileSize * 0.7; // Summon takes up 70% of tile
    
    this.summonSprite = this.scene.add.graphics();
    
    // Main body (colored circle based on role family)
    const bodyColor = this.getRoleFamilyColor();
    this.summonSprite.fillStyle(bodyColor);
    this.summonSprite.fillCircle(0, 0, size / 2);
    
    // Border
    this.summonSprite.lineStyle(2, 0xffffff);
    this.summonSprite.strokeCircle(0, 0, size / 2);
    
    // Inner detail based on species (placeholder)
    this.summonSprite.fillStyle(0xffffff);
    this.summonSprite.fillCircle(0, -5, 4);
    this.summonSprite.fillCircle(-6, 3, 3);
    this.summonSprite.fillCircle(6, 3, 3);
    
    this.add(this.summonSprite);
  }

  private createHealthBar(): void {
    this.healthBar = this.scene.add.container(0, -this.tileSize/2 - 10);
    
    const barWidth = this.tileSize * 0.8;
    const barHeight = 6;
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x333333);
    bg.fillRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
    
    // Health fill
    const healthFill = this.scene.add.graphics();
    const healthPercent = this.config.stats.currentHp / this.config.stats.maxHp;
    
    // Color based on health
    let healthColor = 0x00ff00; // Green
    if (healthPercent <= 0.3) {
      healthColor = 0xff0000; // Red
    } else if (healthPercent <= 0.6) {
      healthColor = 0xffff00; // Yellow
    }
    
    healthFill.fillStyle(healthColor);
    healthFill.fillRect(-barWidth/2, -barHeight/2, barWidth * healthPercent, barHeight);
    
    // Border
    const border = this.scene.add.graphics();
    border.lineStyle(1, 0xffffff);
    border.strokeRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
    
    // HP text
    const hpText = this.scene.add.text(0, 0, `${this.config.stats.currentHp}`, {
      font: 'bold 8px Arial',
      color: '#ffffff'
    });
    hpText.setOrigin(0.5);
    
    this.healthBar.add([bg, healthFill, border, hpText]);
    this.add(this.healthBar);
  }

  private createLevelIndicator(): void {
    this.levelIndicator = this.scene.add.text(-this.tileSize/2 + 5, -this.tileSize/2 + 5, 
      `${this.config.stats.level}`, {
      font: 'bold 10px Arial',
      color: '#ffff00',
      backgroundColor: '#000000aa',
      padding: { x: 3, y: 1 }
    });
    this.levelIndicator.setOrigin(0);
    this.add(this.levelIndicator);
  }

  private createRoleIndicator(): void {
    // Small role indicator in bottom right
    const roleIndicator = this.scene.add.text(this.tileSize/2 - 5, this.tileSize/2 - 5, 
      this.config.role.name.charAt(0).toUpperCase(), {
      font: 'bold 8px Arial',
      color: '#ffffff',
      backgroundColor: this.getRoleFamilyColor().toString(16).padStart(6, '0'),
      padding: { x: 2, y: 1 }
    });
    roleIndicator.setOrigin(1);
    this.add(roleIndicator);
  }

  private setupInteractivity(): void {
    if (!this.config.interactive) return;
    
    // Create interactive area
    const hitArea = this.scene.add.rectangle(0, 0, this.tileSize, this.tileSize, 0x000000, 0);
    hitArea.setInteractive();
    this.add(hitArea);
    
    // Hover effects
    hitArea.on('pointerover', () => this.onHover());
    hitArea.on('pointerout', () => this.onHoverEnd());
    hitArea.on('pointerdown', () => this.onSelect());
  }

  private onHover(): void {
    if (this.isHovered) return;
    
    this.isHovered = true;
    
    // Create hover glow
    this.hoverGlow = this.scene.add.graphics();
    this.hoverGlow.lineStyle(3, 0xffffff, 0.6);
    this.hoverGlow.strokeCircle(0, 0, this.tileSize/2 + 5);
    this.add(this.hoverGlow);
    
    // Show movement range if summon can move
    if (this.canMove && !this.hasAttacked) {
      this.showMovementRange();
    }
    
    // Emit hover event with summon info
    this.emit('summonHover', this.config, this.boardPosition);
  }

  private onHoverEnd(): void {
    if (!this.isHovered) return;
    
    this.isHovered = false;
    
    // Remove hover glow
    if (this.hoverGlow) {
      this.hoverGlow.destroy();
      this.hoverGlow = undefined;
    }
    
    // Hide movement range unless selected
    if (!this.isSelected) {
      this.hideMovementRange();
    }
    
    // Emit hover end event
    this.emit('summonHoverEnd', this.config, this.boardPosition);
  }

  private onSelect(): void {
    this.isSelected = !this.isSelected;
    
    if (this.isSelected) {
      // Create selection ring
      this.selectionRing = this.scene.add.graphics();
      this.selectionRing.lineStyle(3, 0x00ff00, 0.8);
      this.selectionRing.strokeCircle(0, 0, this.tileSize/2 + 3);
      this.add(this.selectionRing);
      
      // Show movement range
      this.showMovementRange();
    } else {
      // Remove selection ring
      if (this.selectionRing) {
        this.selectionRing.destroy();
        this.selectionRing = undefined;
      }
      
      // Hide movement range
      this.hideMovementRange();
    }
    
    // Emit selection event
    this.emit('summonSelect', this.config, this.boardPosition, this.isSelected);
  }

  private showMovementRange(): void {
    if (this.movementIndicator) return;
    
    const remainingMovement = this.config.stats.movement - this.movementUsed;
    if (remainingMovement <= 0) return;
    
    this.movementIndicator = this.scene.add.graphics();
    this.movementIndicator.lineStyle(2, 0x00ffff, 0.5);
    
    // Draw movement range circles
    for (let i = 1; i <= remainingMovement; i++) {
      this.movementIndicator.strokeCircle(0, 0, this.tileSize * i);
    }
    
    this.add(this.movementIndicator);
  }

  private hideMovementRange(): void {
    if (this.movementIndicator) {
      this.movementIndicator.destroy();
      this.movementIndicator = undefined;
    }
  }

  // Movement animation
  public async moveTo(newPosition: BoardPosition, duration: number = 500): Promise<void> {
    const newScreenPos = Summon.boardToScreenPosition(newPosition);
    
    return new Promise(resolve => {
      this.scene.tweens.add({
        targets: this,
        x: newScreenPos.x,
        y: newScreenPos.y,
        duration: duration,
        ease: 'Power2',
        onComplete: () => {
          this.boardPosition = newPosition;
          resolve();
        }
      });
    });
  }

  // Status effect management
  public addStatusEffect(effect: StatusEffect): void {
    // Create visual indicator for status effect
    const indicator = this.scene.add.container(
      this.statusEffects.length * 12 - this.tileSize/2 + 6,
      this.tileSize/2 - 6
    );
    
    const icon = this.scene.add.graphics();
    icon.fillStyle(this.getStatusEffectColor(effect.type));
    icon.fillCircle(0, 0, 5);
    
    icon.lineStyle(1, 0xffffff);
    icon.strokeCircle(0, 0, 5);
    
    const duration = this.scene.add.text(0, 0, effect.duration?.toString() || '∞', {
      font: '6px Arial',
      color: '#ffffff'
    });
    duration.setOrigin(0.5);
    
    indicator.add([icon, duration]);
    this.statusEffects.push(indicator);
    this.add(indicator);
  }

  public removeStatusEffect(effectType: string): void {
    // Find and remove status effect indicator
    // This is a simplified implementation
    const index = this.statusEffects.findIndex(indicator => 
      indicator.getData('effectType') === effectType
    );
    
    if (index >= 0) {
      const indicator = this.statusEffects[index];
      indicator.destroy();
      this.statusEffects.splice(index, 1);
      
      // Reposition remaining indicators
      this.statusEffects.forEach((indicator, i) => {
        indicator.setPosition(
          i * 12 - this.tileSize/2 + 6,
          this.tileSize/2 - 6
        );
      });
    }
  }

  // Update methods
  public updateStats(newStats: Partial<SummonStats>): void {
    // Update health bar
    if (newStats.currentHp !== undefined || newStats.maxHp !== undefined) {
      const currentHp = newStats.currentHp ?? this.config.stats.currentHp;
      const maxHp = newStats.maxHp ?? this.config.stats.maxHp;
      
      this.config.stats.currentHp = currentHp;
      this.config.stats.maxHp = maxHp;
      
      this.updateHealthBar();
    }
    
    // Update level indicator
    if (newStats.level !== undefined) {
      this.config.stats.level = newStats.level;
      this.levelIndicator.setText(newStats.level.toString());
    }
    
    // Update movement
    if (newStats.movement !== undefined) {
      this.config.stats.movement = newStats.movement;
    }
  }

  private updateHealthBar(): void {
    // Recreate health bar with new values
    this.healthBar.removeAll(true);
    
    const barWidth = this.tileSize * 0.8;
    const barHeight = 6;
    
    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x333333);
    bg.fillRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
    
    // Health fill
    const healthFill = this.scene.add.graphics();
    const healthPercent = this.config.stats.currentHp / this.config.stats.maxHp;
    
    // Color based on health
    let healthColor = 0x00ff00; // Green
    if (healthPercent <= 0.3) {
      healthColor = 0xff0000; // Red
    } else if (healthPercent <= 0.6) {
      healthColor = 0xffff00; // Yellow
    }
    
    healthFill.fillStyle(healthColor);
    healthFill.fillRect(-barWidth/2, -barHeight/2, barWidth * healthPercent, barHeight);
    
    // Border
    const border = this.scene.add.graphics();
    border.lineStyle(1, 0xffffff);
    border.strokeRect(-barWidth/2, -barHeight/2, barWidth, barHeight);
    
    // HP text
    const hpText = this.scene.add.text(0, 0, `${this.config.stats.currentHp}`, {
      font: 'bold 8px Arial',
      color: '#ffffff'
    });
    hpText.setOrigin(0.5);
    
    this.healthBar.add([bg, healthFill, border, hpText]);
  }

  // Combat state management
  public setCanMove(canMove: boolean): void {
    this.canMove = canMove;
    if (!canMove) {
      this.hideMovementRange();
    }
  }

  public setHasAttacked(hasAttacked: boolean): void {
    this.hasAttacked = hasAttacked;
    
    // Visual indicator for having attacked
    if (hasAttacked) {
      this.summonSprite.setTint(0xcccccc); // Dim the summon
    } else {
      this.summonSprite.clearTint();
    }
  }

  public setMovementUsed(movementUsed: number): void {
    this.movementUsed = movementUsed;
  }

  // Helper methods
  private getRoleFamilyColor(): number {
    switch (this.config.role.family) {
      case 'warrior': return 0xff4444;
      case 'magician': return 0x4444ff;
      case 'scout': return 0x44ff44;
      default: return 0x888888;
    }
  }

  private getStatusEffectColor(effectType: string): number {
    // Map status effect types to colors
    const colorMap: Record<string, number> = {
      'poison': 0x800080,
      'burn': 0xff4400,
      'freeze': 0x00aaff,
      'stun': 0xffff00,
      'shield': 0x00ff00,
      'boost': 0x00ffff
    };
    
    return colorMap[effectType] || 0xffffff;
  }

  // Static utility methods
  public static boardToScreenPosition(boardPos: BoardPosition): { x: number, y: number } {
    // This should match the GameBoard's coordinate transformation
    const tileSize = 48;
    const boardWidth = 12;
    const boardHeight = 14;
    
    // Calculate board position (assuming centered on screen)
    const gameWidth = 800; // Default game width
    const gameHeight = 600; // Default game height
    
    const totalBoardWidth = boardWidth * tileSize;
    const totalBoardHeight = boardHeight * tileSize;
    
    const startX = (gameWidth - totalBoardWidth) / 2;
    const startY = (gameHeight - totalBoardHeight) / 2;
    
    // Convert board coordinates to screen coordinates
    // Remember: board has (0,0) at bottom-left, screen has (0,0) at top-left
    const screenX = startX + (boardPos.x * tileSize) + (tileSize / 2);
    const screenY = startY + ((boardHeight - 1 - boardPos.y) * tileSize) + (tileSize / 2);
    
    return { x: screenX, y: screenY };
  }

  public static screenToBoardPosition(screenX: number, screenY: number): BoardPosition {
    const tileSize = 48;
    const boardWidth = 12;
    const boardHeight = 14;
    
    const gameWidth = 800;
    const gameHeight = 600;
    
    const totalBoardWidth = boardWidth * tileSize;
    const totalBoardHeight = boardHeight * tileSize;
    
    const startX = (gameWidth - totalBoardWidth) / 2;
    const startY = (gameHeight - totalBoardHeight) / 2;
    
    // Convert screen coordinates to board coordinates
    const gridX = Math.floor((screenX - startX) / tileSize);
    const gridY = boardHeight - 1 - Math.floor((screenY - startY) / tileSize);
    
    return { x: gridX, y: gridY };
  }

  // Getters
  public getBoardPosition(): BoardPosition {
    return this.boardPosition;
  }

  public getConfig(): SummonDisplayConfig {
    return this.config;
  }

  public getIsSelected(): boolean {
    return this.isSelected;
  }

  public setSelected(selected: boolean): void {
    if (this.isSelected === selected) return;
    this.onSelect();
  }
}