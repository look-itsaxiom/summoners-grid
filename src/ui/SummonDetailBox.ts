import { SummonUnit } from '../types/SummonUnit';
import { GrowthRateSymbol } from '../types/Stats';

/**
 * Displays detailed stats for a selected summon unit.
 * Shows level, HP, MV, and all stats with growth rate symbols.
 */
export class SummonDetailBox {
  private container: Phaser.GameObjects.Container | null = null;
  private scene: Phaser.Scene;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show the detail box for a summon
   */
  public show(summon: SummonUnit): void {
    // Hide existing box if any
    this.hide();

    const stats = summon.getStats();
    const summonData = summon.cardData.summonData;
    
    if (!summonData) {
      console.error('[SummonDetailBox] No summon data available');
      return;
    }

    // Create container for detail box
    const x = 50;
    const y = 200;
    this.container = this.scene.add.container(x, y);
    this.container.setDepth(5000);

    // Background
    const bgWidth = 250;
    const bgHeight = 350;
    const bg = this.scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x1a1a1a, 0.95);
    bg.setStrokeStyle(2, 0x4a6fa5);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(0, -bgHeight / 2 + 20, summon.cardData.name, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(title);

    // Level
    const levelText = this.scene.add.text(0, -bgHeight / 2 + 45, `Level ${summon.getLevel()}`, {
      fontSize: '14px',
      color: '#ffff00'
    }).setOrigin(0.5);
    this.container.add(levelText);

    // HP
    const hpText = this.scene.add.text(0, -bgHeight / 2 + 70, `HP: ${stats.currentHP}/${stats.maxHP}`, {
      fontSize: '14px',
      color: stats.currentHP === stats.maxHP ? '#00ff00' : '#ff6666'
    }).setOrigin(0.5);
    this.container.add(hpText);

    // Movement
    const mvText = this.scene.add.text(0, -bgHeight / 2 + 90, `MV: ${stats.movement}`, {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(mvText);

    // Divider
    const divider1 = this.scene.add.rectangle(0, -bgHeight / 2 + 110, bgWidth - 20, 1, 0x666666);
    this.container.add(divider1);

    // Stats section
    let yOffset = -bgHeight / 2 + 130;
    const statLabels = ['STR', 'END', 'DEF', 'INT', 'SPI', 'MDF', 'SPD', 'ACC', 'LCK'];
    
    statLabels.forEach((statName) => {
      const statValue = stats[statName as keyof typeof stats];
      const growthRate = summonData.growthRates[statName as keyof typeof summonData.growthRates];
      const growthSymbol = GrowthRateSymbol[growthRate];
      
      // Stat label (left aligned)
      const label = this.scene.add.text(-bgWidth / 2 + 20, yOffset, `${statName}:`, {
        fontSize: '12px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      this.container!.add(label);
      
      // Stat value (center)
      const value = this.scene.add.text(0, yOffset, `${statValue}`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5, 0.5);
      this.container!.add(value);
      
      // Growth rate symbol (right aligned)
      const symbol = this.scene.add.text(bgWidth / 2 - 20, yOffset, growthSymbol, {
        fontSize: '12px',
        color: '#ffaa00'
      }).setOrigin(1, 0.5);
      this.container!.add(symbol);
      
      yOffset += 20;
    });

    // Divider
    const divider2 = this.scene.add.rectangle(0, yOffset + 5, bgWidth - 20, 1, 0x666666);
    this.container!.add(divider2);

    // Derived stats
    yOffset += 20;
    const derivedStats = [
      { label: 'To-Hit', value: `${stats.basicToHit}%` },
      { label: 'Crit', value: `${stats.critChance}%` }
    ];

    derivedStats.forEach((stat) => {
      const label = this.scene.add.text(-bgWidth / 2 + 20, yOffset, `${stat.label}:`, {
        fontSize: '12px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      this.container!.add(label);
      
      const value = this.scene.add.text(bgWidth / 2 - 20, yOffset, stat.value, {
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(1, 0.5);
      this.container!.add(value);
      
      yOffset += 20;
    });

    this.isVisible = true;
  }

  /**
   * Hide the detail box
   */
  public hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.isVisible = false;
  }

  /**
   * Check if the detail box is visible
   */
  public visible(): boolean {
    return this.isVisible;
  }

  /**
   * Update the detail box with new summon data (e.g., after leveling)
   */
  public update(summon: SummonUnit): void {
    if (this.isVisible) {
      this.show(summon);
    }
  }
}
