/**
 * Card Entity for Summoner's Grid
 * 
 * Implements card rendering with dynamic stat display according to GDD specifications:
 * - Different visual treatments for each card type
 * - Dynamic stat overlays for summon cards
 * - Hover states and selection feedback
 * - Proper scaling and positioning
 */

import Phaser from 'phaser';
import { 
  CardInstance, 
  CardTemplate, 
  CardType, 
  Rarity, 
  SummonStats,
  Attribute 
} from '@summoners-grid/shared-types';

export interface CardDisplayConfig {
  x: number;
  y: number;
  scale?: number;
  interactive?: boolean;
  showStats?: boolean;
  showTooltip?: boolean;
}

export class Card extends Phaser.GameObjects.Container {
  private cardInstance: CardInstance;
  private cardTemplate: CardTemplate;
  private config: CardDisplayConfig;
  
  // Visual components
  private background!: Phaser.GameObjects.Image;
  private border!: Phaser.GameObjects.Graphics;
  private nameText!: Phaser.GameObjects.Text;
  private typeText!: Phaser.GameObjects.Text;
  private rarityIndicator!: Phaser.GameObjects.Graphics;
  private attributeIcon!: Phaser.GameObjects.Image;
  
  // Summon-specific components
  private statsContainer?: Phaser.GameObjects.Container;
  private levelText?: Phaser.GameObjects.Text;
  private hpText?: Phaser.GameObjects.Text;
  private statTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  
  // Interactive components
  private hoverGlow?: Phaser.GameObjects.Graphics;
  private selectionGlow?: Phaser.GameObjects.Graphics;
  private isHovered: boolean = false;
  private isSelected: boolean = false;

  constructor(
    scene: Phaser.Scene, 
    cardInstance: CardInstance, 
    cardTemplate: CardTemplate,
    config: CardDisplayConfig
  ) {
    super(scene, config.x, config.y);
    
    this.cardInstance = cardInstance;
    this.cardTemplate = cardTemplate;
    this.config = config;
    
    this.createCardVisuals();
    this.setupInteractivity();
    
    // Add to scene
    scene.add.existing(this);
    
    // Set scale
    if (config.scale) {
      this.setScale(config.scale);
    }
  }

  private createCardVisuals(): void {
    const cardWidth = 100;
    const cardHeight = 140;
    
    // Card background based on type
    this.createBackground(cardWidth, cardHeight);
    
    // Card border with rarity indication
    this.createBorder(cardWidth, cardHeight);
    
    // Card type indicator
    this.createTypeIndicator(cardWidth, cardHeight);
    
    // Card name
    this.createNameText(cardWidth);
    
    // Attribute icon
    this.createAttributeIcon(cardWidth, cardHeight);
    
    // Type-specific content
    if (this.cardTemplate.type === CardType.SUMMON) {
      this.createSummonSpecificUI(cardWidth, cardHeight);
    } else {
      this.createNonSummonUI(cardWidth, cardHeight);
    }
    
    // Rarity indicator
    this.createRarityIndicator(cardWidth, cardHeight);
  }

  private createBackground(width: number, height: number): void {
    // Create card background with gradient based on card type
    const background = this.scene.add.graphics();
    
    const color = this.getBackgroundColor();
    const gradient = this.scene.add.graphics();
    
    // Main background
    background.fillStyle(color.primary);
    background.fillRoundedRect(-width/2, -height/2, width, height, 8);
    
    // Gradient overlay for depth
    gradient.fillGradientStyle(color.primary, color.primary, color.secondary, color.secondary, 0.3);
    gradient.fillRoundedRect(-width/2, -height/2, width, height, 8);
    
    this.add([background, gradient]);
  }

  private createBorder(width: number, height: number): void {
    this.border = this.scene.add.graphics();
    
    const borderColor = this.getRarityColor();
    const borderWidth = this.getBorderWidth();
    
    this.border.lineStyle(borderWidth, borderColor);
    this.border.strokeRoundedRect(-width/2, -height/2, width, height, 8);
    
    this.add(this.border);
  }

  private createTypeIndicator(width: number, height: number): void {
    this.typeText = this.scene.add.text(0, -height/2 + 15, this.cardTemplate.type, {
      font: 'bold 8px Arial',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 }
    });
    this.typeText.setOrigin(0.5);
    this.add(this.typeText);
  }

  private createNameText(width: number): void {
    this.nameText = this.scene.add.text(0, -50, this.cardTemplate.name, {
      font: 'bold 10px Arial',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 10 }
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);
  }

  private createAttributeIcon(width: number, height: number): void {
    // Create a simple colored circle for attribute indication
    const attributeColor = this.getAttributeColor();
    const icon = this.scene.add.graphics();
    
    icon.fillStyle(attributeColor);
    icon.fillCircle(width/2 - 15, -height/2 + 15, 8);
    
    icon.lineStyle(1, 0xffffff);
    icon.strokeCircle(width/2 - 15, -height/2 + 15, 8);
    
    this.add(icon);
  }

  private createSummonSpecificUI(width: number, height: number): void {
    if (!this.config.showStats) return;
    
    this.statsContainer = this.scene.add.container(0, 0);
    
    // Level indicator
    this.levelText = this.scene.add.text(-width/2 + 8, -height/2 + 30, 'Lv.5', {
      font: 'bold 9px Arial',
      color: '#ffff00'
    });
    this.statsContainer.add(this.levelText);
    
    // HP indicator  
    this.hpText = this.scene.add.text(0, 35, 'HP: 96/96', {
      font: '8px Arial',
      color: '#00ff00',
      align: 'center'
    });
    this.hpText.setOrigin(0.5);
    this.statsContainer.add(this.hpText);
    
    // Key stats display
    const stats = this.getDisplayStats();
    let yOffset = 50;
    
    ['STR', 'INT', 'SPD', 'DEF'].forEach((statName, index) => {
      const statValue = stats[statName.toLowerCase() as keyof typeof stats] || 0;
      const statText = this.scene.add.text(
        -35 + (index % 2) * 35, 
        yOffset + Math.floor(index / 2) * 12,
        `${statName}: ${statValue}`,
        {
          font: '7px Arial',
          color: '#ffffff'
        }
      );
      this.statTexts.set(statName, statText);
      this.statsContainer.add(statText);
    });
    
    this.add(this.statsContainer);
  }

  private createNonSummonUI(width: number, height: number): void {
    // For non-summon cards, show effect description or other relevant info
    let description = this.cardTemplate.flavorText || 'Action Card';
    
    // Truncate long descriptions
    if (description.length > 50) {
      description = description.substring(0, 47) + '...';
    }
    
    const descText = this.scene.add.text(0, 10, description, {
      font: '8px Arial',
      color: '#dddddd',
      align: 'center',
      wordWrap: { width: width - 10 }
    });
    descText.setOrigin(0.5);
    this.add(descText);
  }

  private createRarityIndicator(width: number, height: number): void {
    const rarityColor = this.getRarityColor();
    
    this.rarityIndicator = this.scene.add.graphics();
    
    // Rarity gems at bottom corners
    for (let i = 0; i < this.getRarityLevel(); i++) {
      const x = -width/2 + 10 + (i * 8);
      const y = height/2 - 10;
      
      this.rarityIndicator.fillStyle(rarityColor);
      this.rarityIndicator.fillCircle(x, y, 3);
      
      this.rarityIndicator.lineStyle(1, 0xffffff);
      this.rarityIndicator.strokeCircle(x, y, 3);
    }
    
    this.add(this.rarityIndicator);
  }

  private setupInteractivity(): void {
    if (!this.config.interactive) return;
    
    const cardWidth = 100;
    const cardHeight = 140;
    
    // Create interactive area
    const hitArea = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0);
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
    this.hoverGlow.strokeRoundedRect(-52, -72, 104, 144, 10);
    this.add(this.hoverGlow);
    
    // Scale up slightly
    this.scene.tweens.add({
      targets: this,
      scale: (this.config.scale || 1) * 1.05,
      duration: 150,
      ease: 'Power2'
    });
    
    // Emit hover event
    this.emit('cardHover', this.cardInstance, this.cardTemplate);
  }

  private onHoverEnd(): void {
    if (!this.isHovered) return;
    
    this.isHovered = false;
    
    // Remove hover glow
    if (this.hoverGlow) {
      this.hoverGlow.destroy();
      this.hoverGlow = undefined;
    }
    
    // Scale back to normal
    this.scene.tweens.add({
      targets: this,
      scale: this.config.scale || 1,
      duration: 150,
      ease: 'Power2'
    });
    
    // Emit hover end event
    this.emit('cardHoverEnd', this.cardInstance, this.cardTemplate);
  }

  private onSelect(): void {
    this.isSelected = !this.isSelected;
    
    if (this.isSelected) {
      // Create selection glow
      this.selectionGlow = this.scene.add.graphics();
      this.selectionGlow.lineStyle(2, 0x00ff00, 0.8);
      this.selectionGlow.strokeRoundedRect(-51, -71, 102, 142, 9);
      this.add(this.selectionGlow);
    } else {
      // Remove selection glow
      if (this.selectionGlow) {
        this.selectionGlow.destroy();
        this.selectionGlow = undefined;
      }
    }
    
    // Emit selection event
    this.emit('cardSelect', this.cardInstance, this.cardTemplate, this.isSelected);
  }

  // Helper methods for visual styling

  private getBackgroundColor(): { primary: number, secondary: number } {
    switch (this.cardTemplate.type) {
      case CardType.SUMMON:
        return { primary: 0x2c3e50, secondary: 0x34495e };
      case CardType.ACTION:
        return { primary: 0x8e44ad, secondary: 0x9b59b6 };
      case CardType.BUILDING:
        return { primary: 0x27ae60, secondary: 0x2ecc71 };
      case CardType.ROLE:
        return { primary: 0xe67e22, secondary: 0xf39c12 };
      case CardType.WEAPON:
      case CardType.ARMOR:
      case CardType.ACCESSORY:
        return { primary: 0x95a5a6, secondary: 0xbdc3c7 };
      default:
        return { primary: 0x7f8c8d, secondary: 0x95a5a6 };
    }
  }

  private getRarityColor(): number {
    switch (this.cardTemplate.rarity) {
      case Rarity.COMMON: return 0xffffff;
      case Rarity.UNCOMMON: return 0x00ff00;
      case Rarity.RARE: return 0x0080ff;
      case Rarity.LEGENDARY: return 0xff8000;
      case Rarity.MYTH: return 0xff0080;
      case Rarity.SPECIAL: return 0xffd700;
      default: return 0xffffff;
    }
  }

  private getBorderWidth(): number {
    switch (this.cardTemplate.rarity) {
      case Rarity.COMMON: return 1;
      case Rarity.UNCOMMON: return 2;
      case Rarity.RARE: return 2;
      case Rarity.LEGENDARY: return 3;
      case Rarity.MYTH: return 3;
      case Rarity.SPECIAL: return 4;
      default: return 1;
    }
  }

  private getRarityLevel(): number {
    switch (this.cardTemplate.rarity) {
      case Rarity.COMMON: return 1;
      case Rarity.UNCOMMON: return 2;
      case Rarity.RARE: return 3;
      case Rarity.LEGENDARY: return 4;
      case Rarity.MYTH: return 5;
      case Rarity.SPECIAL: return 6;
      default: return 1;
    }
  }

  private getAttributeColor(): number {
    switch (this.cardTemplate.attribute) {
      case Attribute.FIRE: return 0xff4444;
      case Attribute.WATER: return 0x4488ff;
      case Attribute.EARTH: return 0x8b4513;
      case Attribute.WIND: return 0x90ee90;
      case Attribute.LIGHT: return 0xffff80;
      case Attribute.DARK: return 0x800080;
      case Attribute.NATURE: return 0x228b22;
      case Attribute.NEUTRAL: 
      default: return 0xc0c0c0;
    }
  }

  private getDisplayStats(): Partial<SummonStats> {
    // For now, use template base stats + equipment bonuses
    // In a full implementation, this would calculate actual summon stats
    const stats = this.cardTemplate.stats;
    const equipment = this.cardTemplate.equipment;
    
    if (!stats) return {};
    
    return {
      str: stats.baseStr + (equipment?.strBonus || 0),
      int: stats.baseInt + (equipment?.intBonus || 0),
      spd: stats.baseSpd + (equipment?.spdBonus || 0),
      def: stats.baseDef + (equipment?.defBonus || 0),
      end: stats.baseEnd + (equipment?.endBonus || 0),
      level: 5, // Starting level as per GDD
      currentHp: 96, // Calculated from endurance
      maxHp: 96
    };
  }

  // Public methods for external control

  public updateStats(newStats: Partial<SummonStats>): void {
    if (!this.statsContainer) return;
    
    // Update level
    if (this.levelText && newStats.level) {
      this.levelText.setText(`Lv.${newStats.level}`);
    }
    
    // Update HP
    if (this.hpText && newStats.currentHp && newStats.maxHp) {
      this.hpText.setText(`HP: ${newStats.currentHp}/${newStats.maxHp}`);
      
      // Color based on health percentage
      const healthPercent = newStats.currentHp / newStats.maxHp;
      if (healthPercent > 0.6) {
        this.hpText.setColor('#00ff00');
      } else if (healthPercent > 0.3) {
        this.hpText.setColor('#ffff00');
      } else {
        this.hpText.setColor('#ff0000');
      }
    }
    
    // Update individual stats
    ['STR', 'INT', 'SPD', 'DEF'].forEach(statName => {
      const statText = this.statTexts.get(statName);
      const statValue = newStats[statName.toLowerCase() as keyof SummonStats];
      
      if (statText && statValue !== undefined) {
        statText.setText(`${statName}: ${statValue}`);
      }
    });
  }

  public setSelected(selected: boolean): void {
    if (this.isSelected === selected) return;
    
    this.isSelected = selected;
    
    if (selected) {
      this.onSelect();
    } else if (this.selectionGlow) {
      this.selectionGlow.destroy();
      this.selectionGlow = undefined;
    }
  }

  public getCardInstance(): CardInstance {
    return this.cardInstance;
  }

  public getCardTemplate(): CardTemplate {
    return this.cardTemplate;
  }
}