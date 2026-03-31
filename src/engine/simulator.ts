import { useGameStore } from '../store/gameStore';
import { createPlayerADeck, createPlayerBDeck } from '../data/cards';
import { executeAITurn } from './ai';
import type { PlayerId } from '../types';

export interface SimulationResult {
  winner: PlayerId;
  turns: number;
  playerAVP: number;
  playerBVP: number;
  totalDefeats: number;
}

/**
 * Run a single AI vs AI game to completion.
 * Returns the result without rendering anything.
 */
export function simulateGame(maxTurns: number = 50): SimulationResult {
  const store = useGameStore.getState();

  // Initialize
  const deckA = createPlayerADeck();
  const deckB = createPlayerBDeck();
  store.initializeGame(deckA, deckB);
  store.decideTurnOrder(Math.random() < 0.5 ? 'playerA' : 'playerB');

  let turns = 0;

  while (!store.gameOver && turns < maxTurns) {
    const state = useGameStore.getState();
    executeAITurn(state);
    turns++;

    // Safety check
    if (useGameStore.getState().gameOver) break;
  }

  const finalState = useGameStore.getState();

  return {
    winner: finalState.winner ?? 'playerA',
    turns: finalState.turnNumber,
    playerAVP: finalState.players.playerA.victoryPoints,
    playerBVP: finalState.players.playerB.victoryPoints,
    totalDefeats: finalState.log.filter(e => e.message.includes('defeated')).length,
  };
}

/**
 * Run multiple simulations and collect statistics.
 */
export function runSimulations(count: number = 20): {
  results: SimulationResult[];
  playerAWins: number;
  playerBWins: number;
  avgTurns: number;
  avgDefeats: number;
} {
  const results: SimulationResult[] = [];

  for (let i = 0; i < count; i++) {
    results.push(simulateGame());
  }

  const playerAWins = results.filter(r => r.winner === 'playerA').length;
  const playerBWins = results.filter(r => r.winner === 'playerB').length;
  const avgTurns = results.reduce((sum, r) => sum + r.turns, 0) / results.length;
  const avgDefeats = results.reduce((sum, r) => sum + r.totalDefeats, 0) / results.length;

  return { results, playerAWins, playerBWins, avgTurns, avgDefeats };
}
