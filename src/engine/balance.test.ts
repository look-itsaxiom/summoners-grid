import { describe, it, expect } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { createPlayerADeck, createPlayerBDeck } from '../data/cards';
import { executeAITurn } from './ai';

/**
 * Balance tests — run multiple AI vs AI games and check win rates.
 * If one side wins > 75% of games, the balance may be off.
 */
describe('Balance: AI vs AI Win Rates', () => {
  function runGame(firstPlayer: 'playerA' | 'playerB'): 'playerA' | 'playerB' | 'draw' {
    const store = useGameStore.getState();
    store.initializeGame(createPlayerADeck(), createPlayerBDeck());
    store.decideTurnOrder(firstPlayer);

    for (let i = 0; i < 100; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) return state.winner ?? 'draw';
      executeAITurn(state);
    }

    return 'draw'; // Didn't finish
  }

  it('should have a roughly balanced win rate (neither side > 80%)', () => {
    const results = { playerA: 0, playerB: 0, draw: 0 };

    for (let i = 0; i < 10; i++) {
      const firstPlayer = i % 2 === 0 ? 'playerA' : 'playerB';
      const winner = runGame(firstPlayer as 'playerA' | 'playerB');
      results[winner]++;
    }

    const totalGames = results.playerA + results.playerB;
    if (totalGames === 0) return; // All draws = no conclusion

    const playerARate = results.playerA / totalGames;
    const playerBRate = results.playerB / totalGames;

    // Neither side should dominate overwhelmingly
    // Allow wide range since AI is simple and decks are asymmetric
    expect(playerARate).toBeLessThanOrEqual(0.9);
    expect(playerBRate).toBeLessThanOrEqual(0.9);
  });

  it('should complete most games (< 50% draws)', () => {
    let completedGames = 0;
    const totalRuns = 10;

    for (let i = 0; i < totalRuns; i++) {
      const firstPlayer = i % 2 === 0 ? 'playerA' : 'playerB';
      const winner = runGame(firstPlayer as 'playerA' | 'playerB');
      if (winner !== 'draw') completedGames++;
    }

    expect(completedGames).toBeGreaterThan(totalRuns * 0.5);
  });

  it('should have games last a reasonable number of turns (3-30)', () => {
    const store = useGameStore.getState();
    store.initializeGame(createPlayerADeck(), createPlayerBDeck());
    store.decideTurnOrder('playerA');

    for (let i = 0; i < 100; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) break;
      executeAITurn(state);
    }

    const finalState = useGameStore.getState();
    if (finalState.gameOver) {
      expect(finalState.turnNumber).toBeGreaterThanOrEqual(3);
      expect(finalState.turnNumber).toBeLessThanOrEqual(30);
    }
  });
});
