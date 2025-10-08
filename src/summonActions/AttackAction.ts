import { ISummonAction } from './ISummonAction';
import { SummonUnit } from '../types/SummonUnit';

/**
 * Attack action for summon units.
 * This follows the Single Responsibility Principle - it only handles
 * the logic for attacking with a summon unit.
 * Currently stubbed as per requirements.
 */
export class AttackAction implements ISummonAction {
  constructor() {}

  getName(): string {
    return 'Attack';
  }

  canExecute(summon: SummonUnit): boolean {
    return summon.canAttack();
  }

  execute(
    summon: SummonUnit,
    scene: Phaser.Scene,
    onComplete: (success: boolean) => void
  ): void {
    console.log(`[AttackAction] ${summon.cardData.name} is attacking!`);

    // Show attack notification
    const centerX = 600;
    const centerY = 400;

    const attackText = scene.add
      .text(centerX, centerY, `${summon.cardData.name} attacks!`, {
        fontSize: '24px',
        color: '#ff0000',
        backgroundColor: '#000000',
        padding: { x: 15, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(3000);

    // Mark summon as having attacked
    summon.markAttacked();

    // Fade out the text after 2 seconds
    scene.time.delayedCall(2000, () => {
      scene.tweens.add({
        targets: attackText,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          attackText.destroy();
        },
      });
    });

    // Complete the action
    console.log('[AttackAction] Attack action completed (stubbed)');
    onComplete(true);
  }
}
