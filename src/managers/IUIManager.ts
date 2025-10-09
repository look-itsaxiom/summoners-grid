import { Card } from "../Card";
import { TurnPhase } from "../types/GameTypes";

/**
 * Interface for UI management operations.
 * Following the Interface Segregation Principle - focused on UI elements only.
 */
export interface IUIManager {
  /**
   * Creates the title and other static UI elements
   */
  createStaticUI(): void;

  /**
   * Creates the play button (initially hidden)
   * @param onPlay Callback function to execute when play button is clicked
   */
  createPlayButton(onPlay: () => void): void;

  /**
   * Shows the play button above the selected card
   * @param selectedCard The card above which to show the play button
   */
  showPlayButton(selectedCard: Card): void;

  /**
   * Hides the play button
   */
  hidePlayButton(): void;

  /**
   * Creates the phase indicator UI
   * @param onNextPhase Callback function when next phase button is clicked
   */
  createPhaseIndicator(onNextPhase: () => void): void;

  /**
   * Updates the phase indicator display
   * @param phase Current turn phase
   * @param player Current player (0 or 1)
   */
  updatePhaseIndicator(phase: TurnPhase, player: number): void;

  /**
   * Shows the discard selection UI
   * @param count Number of cards to discard
   * @param onConfirm Callback when discard is confirmed
   */
  showDiscardUI(count: number, onConfirm: () => void): void;

  /**
   * Updates the discard count display
   * @param selected Number of cards selected
   * @param required Number of cards required
   */
  updateDiscardCount(selected: number, required: number): void;

  /**
   * Hides the discard UI
   */
  hideDiscardUI(): void;
}
