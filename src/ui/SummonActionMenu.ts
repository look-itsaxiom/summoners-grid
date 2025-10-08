import { ISummonAction } from '../summonActions/ISummonAction';
import { SummonUnit } from '../types/SummonUnit';

/**
 * UI component for displaying action menu for a selected summon.
 * This follows the Single Responsibility Principle - it only manages
 * the visual menu and user interaction for summon actions.
 */
export class SummonActionMenu {
  private scene: Phaser.Scene;
  private summon: SummonUnit;
  private actions: ISummonAction[];
  private container: Phaser.GameObjects.Container | null = null;
  private buttons: Phaser.GameObjects.Rectangle[] = [];
  private buttonTexts: Phaser.GameObjects.Text[] = [];

  constructor(
    scene: Phaser.Scene,
    summon: SummonUnit,
    actions: ISummonAction[]
  ) {
    this.scene = scene;
    this.summon = summon;
    this.actions = actions;
  }

  /**
   * Show the action menu above the summon token
   */
  public show(onActionSelected: (action: ISummonAction) => void): void {
    if (this.container) {
      this.hide();
    }

    // Calculate position above the summon token
    const menuX = this.summon.token.x;
    const menuY = this.summon.token.y - 60;

    this.container = this.scene.add.container(menuX, menuY);
    this.container.setDepth(1000);

    const buttonWidth = 100;
    const buttonHeight = 35;
    const buttonSpacing = 10;

    // Filter actions to only show executable ones
    const executableActions = this.actions.filter((action) =>
      action.canExecute(this.summon)
    );

    if (executableActions.length === 0) {
      // Show a message that no actions are available
      const noActionsText = this.scene.add
        .text(0, 0, 'No actions\navailable', {
          fontSize: '12px',
          color: '#888888',
          backgroundColor: '#000000',
          padding: { x: 10, y: 5 },
          align: 'center',
        })
        .setOrigin(0.5);
      this.container.add(noActionsText);
      return;
    }

    // Create buttons for each action
    executableActions.forEach((action, index) => {
      const buttonY = index * (buttonHeight + buttonSpacing);

      // Create button background
      const button = this.scene.add.rectangle(
        0,
        buttonY,
        buttonWidth,
        buttonHeight,
        0x4a6fa5
      );
      button.setStrokeStyle(2, 0x6a9fc5);
      button.setInteractive();

      // Create button text
      const buttonText = this.scene.add
        .text(0, buttonY, action.getName(), {
          fontSize: '14px',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      // Add hover effects
      button.on('pointerover', () => {
        button.setFillStyle(0x5a7fb5);
        button.setScale(1.05);
        buttonText.setScale(1.05);
      });

      button.on('pointerout', () => {
        button.setFillStyle(0x4a6fa5);
        button.setScale(1.0);
        buttonText.setScale(1.0);
      });

      // Add click handler
      button.on('pointerdown', () => {
        console.log(`[SummonActionMenu] Action selected: ${action.getName()}`);
        this.hide();
        onActionSelected(action);
      });

      this.buttons.push(button);
      this.buttonTexts.push(buttonText);

      if (this.container) {
        this.container.add(button);
        this.container.add(buttonText);
      }
    });

    if (!this.container) {
      return;
    }

    // Add a background panel
    const panelHeight =
      executableActions.length * (buttonHeight + buttonSpacing) - buttonSpacing;
    const panel = this.scene.add.rectangle(
      0,
      (panelHeight - buttonHeight) / 2,
      buttonWidth + 10,
      panelHeight + 10,
      0x1a1a1a,
      0.8
    );
    panel.setDepth(-1);
    this.container.add(panel);
    this.container.sendToBack(panel);
  }

  /**
   * Hide and destroy the action menu
   */
  public hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.buttons = [];
    this.buttonTexts = [];
  }

  /**
   * Check if the menu is currently visible
   */
  public isVisible(): boolean {
    return this.container !== null && this.container.active;
  }
}
