/**
 * Save/Load game state to localStorage.
 */

import { useGameStore } from '../store/gameStore';
import type { GameState } from '../types';

const SAVE_KEY = 'summoners-grid-save';

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function saveGame(): boolean {
  try {
    const state = useGameStore.getState();
    // Extract serializable state (exclude functions)
    const saveData: Partial<GameState> = {
      phase: state.phase,
      turnNumber: state.turnNumber,
      activePlayer: state.activePlayer,
      players: state.players,
      board: state.board,
      effectStack: state.effectStack,
      priorityPlayer: state.priorityPlayer,
      winner: state.winner,
      gameOver: state.gameOver,
      turnOrderDecided: state.turnOrderDecided,
      coinFlipWinner: state.coinFlipWinner,
      log: state.log.slice(-50), // Keep last 50 log entries to save space
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;

    const saveData = JSON.parse(raw) as Partial<GameState>;
    useGameStore.setState(saveData);
    return true;
  } catch {
    return false;
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}
