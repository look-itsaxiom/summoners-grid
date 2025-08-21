/**
 * Card and Summon Rendering Test Scene
 * 
 * Demonstrates the card and summon rendering system with:
 * - Multiple card types and rarities
 * - Interactive card selection and hover states
 * - Summon placement and positioning on the game board
 * - Dynamic stat updates and visual feedback
 */

import Phaser from 'phaser';
import { Card, CardDisplayConfig } from '../entities/Card';
import { Summon, SummonDisplayConfig } from '../entities/Summon';
import { GameBoard, BoardPosition } from '../entities/GameBoard';
import { 
  CardInstance, 
  CardTemplate, 
  CardType, 
  Rarity, 
  Attribute,
  SummonStats,
  Role,
  RoleFamily 
} from '@summoners-grid/shared-types';

export class CardSummonTestScene extends Phaser.Scene {
  private gameBoard!: GameBoard;
  private testCards: Card[] = [];
  private testSummons: Summon[] = [];
  private selectedCard: Card | null = null;
  private selectedSummon: Summon | null = null;

  constructor() {
    super({ key: 'CardSummonTestScene' });
  }

  create(): void {
    this.setupScene();
    this.createGameBoard();
    this.createTestCards();
    this.createTestSummons();
    this.setupControls();
  }

  private setupScene(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 30, 'Card & Summon Rendering Test', {
      font: '24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(20, height - 80, 'Controls:', {
      font: 'bold 14px Arial',
      color: '#ffffff'
    });

    this.add.text(20, height - 60, '• Click cards to select/deselect', {
      font: '12px Arial',
      color: '#cccccc'
    });

    this.add.text(20, height - 45, '• Click summons to select/deselect', {
      font: '12px Arial',
      color: '#cccccc'
    });

    this.add.text(20, height - 30, '• Press SPACE to level up selected summon', {
      font: '12px Arial',
      color: '#cccccc'
    });

    this.add.text(20, height - 15, '• Press H to damage selected summon', {
      font: '12px Arial',
      color: '#cccccc'
    });

    // Back button
    const backButton = this.add.text(width - 20, 30, '← Back to Menu', {
      font: '16px Arial',
      color: '#4a90e2'
    }).setOrigin(1, 0);

    backButton.setInteractive();
    backButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });

    backButton.on('pointerover', () => {
      backButton.setColor('#ffffff');
    });

    backButton.on('pointerout', () => {
      backButton.setColor('#4a90e2');
    });
  }

  private createGameBoard(): void {
    this.gameBoard = new GameBoard(this);
  }

  private createTestCards(): void {
    const { width } = this.cameras.main;
    
    // Create sample card templates and instances
    const cardTemplates = this.createSampleCardTemplates();
    
    // Position cards in a row at the top
    const cardY = 120;
    const cardSpacing = 110;
    const startX = (width - (cardTemplates.length * cardSpacing)) / 2 + 55;

    cardTemplates.forEach((template, index) => {
      const cardInstance = this.createCardInstance(template);
      
      const cardConfig: CardDisplayConfig = {
        x: startX + (index * cardSpacing),
        y: cardY,
        scale: 0.8,
        interactive: true,
        showStats: template.type === CardType.SUMMON,
        showTooltip: true
      };

      const card = new Card(this, cardInstance, template, cardConfig);
      
      // Set up event handlers
      card.on('cardHover', (instance: CardInstance, template: CardTemplate) => {
        this.showCardTooltip(template, card.x, card.y);
      });

      card.on('cardHoverEnd', () => {
        this.hideCardTooltip();
      });

      card.on('cardSelect', (instance: CardInstance, template: CardTemplate, selected: boolean) => {
        if (selected) {
          // Deselect other cards
          this.testCards.forEach(c => {
            if (c !== card) c.setSelected(false);
          });
          this.selectedCard = card;
        } else {
          this.selectedCard = null;
        }
      });

      this.testCards.push(card);
    });
  }

  private createTestSummons(): void {
    // Create test summons on the board
    const summonConfigs = this.createSampleSummonConfigs();
    
    summonConfigs.forEach(config => {
      const summon = new Summon(this, config);
      
      // Set up event handlers
      summon.on('summonHover', (config: SummonDisplayConfig, position: BoardPosition) => {
        this.showSummonTooltip(config, summon.x, summon.y);
      });

      summon.on('summonHoverEnd', () => {
        this.hideSummonTooltip();
      });

      summon.on('summonSelect', (config: SummonDisplayConfig, position: BoardPosition, selected: boolean) => {
        if (selected) {
          // Deselect other summons
          this.testSummons.forEach(s => {
            if (s !== summon) s.setSelected(false);
          });
          this.selectedSummon = summon;
        } else {
          this.selectedSummon = null;
        }
      });

      this.testSummons.push(summon);
    });
  }

  private setupControls(): void {
    // Keyboard controls for testing
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.selectedSummon) {
        this.levelUpSummon(this.selectedSummon);
      }
    });

    this.input.keyboard?.on('keydown-H', () => {
      if (this.selectedSummon) {
        this.damageSummon(this.selectedSummon);
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      if (this.selectedSummon) {
        this.healSummon(this.selectedSummon);
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }

  // Sample data creation methods

  private createSampleCardTemplates(): CardTemplate[] {
    return [
      {
        id: 'summon-001',
        name: 'Gignen Warrior',
        type: CardType.SUMMON,
        rarity: Rarity.COMMON,
        attribute: Attribute.NEUTRAL,
        setCode: 'ALPHA',
        cardNumber: '001',
        flavorText: 'A brave warrior from the Gignen clan.',
        stats: {
          baseStr: 16, baseEnd: 15, baseDef: 14, baseInt: 12, baseSpi: 11,
          baseMdf: 13, baseSpd: 13, baseAcc: 12, baseLck: 18,
          strGrowth: 1.3, endGrowth: 1.2, defGrowth: 1.1, intGrowth: 0.8, spiGrowth: 0.7,
          mdfGrowth: 1.0, spdGrowth: 1.0, accGrowth: 1.0, lckGrowth: 1.8
        }
      },
      {
        id: 'action-001',
        name: 'Blast Bolt',
        type: CardType.ACTION,
        rarity: Rarity.COMMON,
        attribute: Attribute.FIRE,
        setCode: 'ALPHA',
        cardNumber: '002',
        flavorText: 'A searing bolt of magical energy.'
      },
      {
        id: 'summon-002',
        name: 'Fae Magician',
        type: CardType.SUMMON,
        rarity: Rarity.RARE,
        attribute: Attribute.NATURE,
        setCode: 'ALPHA',
        cardNumber: '003',
        flavorText: 'A mystical being wielding nature magic.',
        stats: {
          baseStr: 10, baseEnd: 13, baseDef: 11, baseInt: 19, baseSpi: 20,
          baseMdf: 16, baseSpd: 15, baseAcc: 14, baseLck: 13,
          strGrowth: 0.8, endGrowth: 1.0, defGrowth: 0.9, intGrowth: 1.4, spiGrowth: 1.5,
          mdfGrowth: 1.2, spdGrowth: 1.1, accGrowth: 1.1, lckGrowth: 1.0
        }
      },
      {
        id: 'building-001',
        name: 'Dark Altar',
        type: CardType.BUILDING,
        rarity: Rarity.LEGENDARY,
        attribute: Attribute.DARK,
        setCode: 'ALPHA',
        cardNumber: '004',
        flavorText: 'An ancient altar radiating dark power.'
      },
      {
        id: 'role-001',
        name: 'Warrior',
        type: CardType.ROLE,
        rarity: Rarity.COMMON,
        attribute: Attribute.NEUTRAL,
        setCode: 'ALPHA',
        cardNumber: '005',
        flavorText: 'Basic warrior role.',
        tier: 1,
        family: 'warrior'
      }
    ];
  }

  private createCardInstance(template: CardTemplate): CardInstance {
    return {
      id: `instance-${template.id}-${Date.now()}`,
      templateId: template.id,
      ownerId: 'player1',
      signature: 'test-signature',
      signatureChain: [],
      mintedAt: new Date(),
      acquiredMethod: 'test',
      isLocked: false,
      createdAt: new Date()
    };
  }

  private createSampleSummonConfigs(): SummonDisplayConfig[] {
    const role: Role = {
      id: 'warrior-role',
      name: 'Warrior',
      family: RoleFamily.WARRIOR,
      tier: 1,
      statModifiers: {
        str: 2, end: 1, def: 2, int: -1, spi: 0,
        mdf: 0, spd: 0, acc: 0, lck: 0
      },
      abilities: [],
      requirements: []
    };

    const stats: SummonStats = {
      str: 18, end: 16, def: 16, int: 11, spi: 11,
      mdf: 13, spd: 13, acc: 12, lck: 20,
      level: 5,
      currentHp: 112,
      maxHp: 112,
      movement: 3
    };

    const cardTemplate = this.createSampleCardTemplates()[0];
    const cardInstance = this.createCardInstance(cardTemplate);

    return [
      {
        position: { x: 3, y: 2 }, // Player 1 territory
        stats: { ...stats },
        role,
        cardInstance,
        cardTemplate,
        interactive: true
      },
      {
        position: { x: 5, y: 7 }, // Neutral territory
        stats: { 
          ...stats, 
          str: 15, int: 18, currentHp: 85, maxHp: 96, level: 6 
        },
        role: {
          ...role,
          name: 'Magician',
          family: RoleFamily.MAGICIAN
        },
        cardInstance,
        cardTemplate: this.createSampleCardTemplates()[2], // Fae Magician
        interactive: true
      },
      {
        position: { x: 8, y: 11 }, // Player 2 territory
        stats: { 
          ...stats, 
          spd: 23, currentHp: 45, maxHp: 120, level: 7 
        },
        role: {
          ...role,
          name: 'Scout',
          family: RoleFamily.SCOUT
        },
        cardInstance,
        cardTemplate,
        interactive: true
      }
    ];
  }

  // Tooltip methods
  private tooltipBackground?: Phaser.GameObjects.Graphics;
  private tooltipText?: Phaser.GameObjects.Text;

  private showCardTooltip(template: CardTemplate, x: number, y: number): void {
    this.hideCardTooltip();

    const tooltipText = this.getCardTooltipText(template);
    
    this.tooltipText = this.add.text(x, y - 100, tooltipText, {
      font: '12px Arial',
      color: '#ffffff',
      backgroundColor: '#000000dd',
      padding: { x: 8, y: 6 },
      wordWrap: { width: 200 }
    });
    this.tooltipText.setOrigin(0.5, 1);
    this.tooltipText.setDepth(1000);
  }

  private hideCardTooltip(): void {
    if (this.tooltipText) {
      this.tooltipText.destroy();
      this.tooltipText = undefined;
    }
  }

  private showSummonTooltip(config: SummonDisplayConfig, x: number, y: number): void {
    this.hideSummonTooltip();

    const tooltipText = this.getSummonTooltipText(config);
    
    this.tooltipText = this.add.text(x, y - 60, tooltipText, {
      font: '11px Arial',
      color: '#ffffff',
      backgroundColor: '#000000dd',
      padding: { x: 8, y: 6 },
      wordWrap: { width: 180 }
    });
    this.tooltipText.setOrigin(0.5, 1);
    this.tooltipText.setDepth(1000);
  }

  private hideSummonTooltip(): void {
    if (this.tooltipText) {
      this.tooltipText.destroy();
      this.tooltipText = undefined;
    }
  }

  private getCardTooltipText(template: CardTemplate): string {
    let text = `${template.name}\n`;
    text += `Type: ${template.type}\n`;
    text += `Rarity: ${template.rarity}\n`;
    text += `Attribute: ${template.attribute}\n`;
    
    if (template.stats) {
      text += '\nBase Stats:\n';
      text += `STR: ${template.stats.baseStr} INT: ${template.stats.baseInt}\n`;
      text += `END: ${template.stats.baseEnd} SPI: ${template.stats.baseSpi}\n`;
      text += `DEF: ${template.stats.baseDef} MDF: ${template.stats.baseMdf}\n`;
      text += `SPD: ${template.stats.baseSpd} ACC: ${template.stats.baseAcc}\n`;
      text += `LCK: ${template.stats.baseLck}`;
    }
    
    if (template.flavorText) {
      text += `\n\n"${template.flavorText}"`;
    }
    
    return text;
  }

  private getSummonTooltipText(config: SummonDisplayConfig): string {
    const stats = config.stats;
    let text = `${config.cardTemplate.name}\n`;
    text += `Role: ${config.role.name} (${config.role.family})\n`;
    text += `Level: ${stats.level}\n`;
    text += `HP: ${stats.currentHp}/${stats.maxHp}\n`;
    text += `Movement: ${stats.movement}\n\n`;
    text += `STR: ${stats.str} INT: ${stats.int}\n`;
    text += `END: ${stats.end} SPI: ${stats.spi}\n`;
    text += `DEF: ${stats.def} MDF: ${stats.mdf}\n`;
    text += `SPD: ${stats.spd} ACC: ${stats.acc}\n`;
    text += `LCK: ${stats.lck}`;
    
    return text;
  }

  // Test interaction methods
  private levelUpSummon(summon: Summon): void {
    const config = summon.getConfig();
    const newLevel = config.stats.level + 1;
    
    // Simple level up: increase some stats
    const newStats = {
      level: newLevel,
      str: config.stats.str + 2,
      int: config.stats.int + 1,
      maxHp: config.stats.maxHp + 8,
      currentHp: config.stats.currentHp + 8
    };
    
    summon.updateStats(newStats);
    
    // Visual feedback
    this.showFloatingText(summon.x, summon.y - 30, 'LEVEL UP!', '#ffff00');
  }

  private damageSummon(summon: Summon): void {
    const config = summon.getConfig();
    const damage = Math.min(15, config.stats.currentHp);
    
    const newStats = {
      currentHp: config.stats.currentHp - damage
    };
    
    summon.updateStats(newStats);
    
    // Visual feedback
    this.showFloatingText(summon.x, summon.y - 20, `-${damage}`, '#ff4444');
  }

  private healSummon(summon: Summon): void {
    const config = summon.getConfig();
    const heal = Math.min(20, config.stats.maxHp - config.stats.currentHp);
    
    const newStats = {
      currentHp: config.stats.currentHp + heal
    };
    
    summon.updateStats(newStats);
    
    // Visual feedback
    this.showFloatingText(summon.x, summon.y - 20, `+${heal}`, '#44ff44');
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const floatingText = this.add.text(x, y, text, {
      font: 'bold 14px Arial',
      color: color
    });
    floatingText.setOrigin(0.5);
    floatingText.setDepth(1000);
    
    this.tweens.add({
      targets: floatingText,
      y: y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }
}