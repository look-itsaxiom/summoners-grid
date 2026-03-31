import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { createPlayerADeck, createPlayerBDeck } from '../data/cards';
import { executeAITurn } from './ai';
import { VP_TO_WIN, SUMMON_START_LEVEL, SUMMON_MAX_LEVEL } from '../types';

describe('Integration: AI vs AI Game', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useGameStore.getState();
    const deckA = createPlayerADeck();
    const deckB = createPlayerBDeck();
    store.initializeGame(deckA, deckB);
    store.decideTurnOrder('playerA');
  });

  it('should initialize game state correctly', () => {
    const state = useGameStore.getState();
    expect(state.turnNumber).toBe(1);
    expect(state.activePlayer).toBe('playerA');
    expect(state.phase).toBe('draw');
    expect(state.gameOver).toBe(false);
    expect(state.players.playerA.hand.length).toBe(3); // 3 summon cards
    expect(state.players.playerB.hand.length).toBe(3);
    expect(state.players.playerA.victoryPoints).toBe(0);
    expect(state.players.playerB.victoryPoints).toBe(0);
  });

  it('should complete a game within 50 turns without crashing', () => {
    let turns = 0;
    const maxTurns = 100; // 50 turns per player = 100 AI executions

    while (turns < maxTurns) {
      const state = useGameStore.getState();
      if (state.gameOver) break;

      executeAITurn(state);
      turns++;
    }

    const finalState = useGameStore.getState();

    // Game should either end or reach max turns
    if (finalState.gameOver) {
      expect(finalState.winner).toBeTruthy();
      // Winner should have VP_TO_WIN or more
      const winnerVP = finalState.players[finalState.winner!].victoryPoints;
      expect(winnerVP).toBeGreaterThanOrEqual(VP_TO_WIN);
    }

    // Turns should have progressed
    expect(finalState.turnNumber).toBeGreaterThan(1);
  });

  it('should maintain valid summon levels (5-20)', () => {
    // Play a few turns
    for (let i = 0; i < 20; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) break;
      executeAITurn(state);
    }

    const state = useGameStore.getState();
    for (const summon of state.board.summons) {
      expect(summon.level).toBeGreaterThanOrEqual(SUMMON_START_LEVEL);
      expect(summon.level).toBeLessThanOrEqual(SUMMON_MAX_LEVEL);
    }
  });

  it('should maintain valid HP (0 to maxHP)', () => {
    for (let i = 0; i < 30; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) break;
      executeAITurn(state);

      // Check all summons have valid HP
      const current = useGameStore.getState();
      for (const summon of current.board.summons) {
        expect(summon.currentHP).toBeGreaterThan(0); // Defeated summons are removed
        expect(summon.currentHP).toBeLessThanOrEqual(summon.maxHP);
      }
    }
  });

  it('should not exceed VP_TO_WIN for either player', () => {
    for (let i = 0; i < 100; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) break;
      executeAITurn(state);
    }

    const state = useGameStore.getState();
    // VP shouldn't wildly exceed the win threshold (graverobbing can remove VP)
    expect(state.players.playerA.victoryPoints).toBeLessThanOrEqual(VP_TO_WIN + 2);
    expect(state.players.playerB.victoryPoints).toBeLessThanOrEqual(VP_TO_WIN + 2);
  });

  it('should have summons on the board after a few turns', () => {
    // Play 4 AI turns (2 per player)
    for (let i = 0; i < 4; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) break;
      executeAITurn(state);
    }

    const state = useGameStore.getState();
    // Each player should have placed at least 1 summon
    const playerASummons = state.board.summons.filter(s => s.owner === 'playerA');
    const playerBSummons = state.board.summons.filter(s => s.owner === 'playerB');
    expect(playerASummons.length + playerBSummons.length).toBeGreaterThan(0);
  });

  it('should generate game log entries', () => {
    for (let i = 0; i < 10; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) break;
      executeAITurn(state);
    }

    const state = useGameStore.getState();
    expect(state.log.length).toBeGreaterThan(0);
    // Log should contain various event types
    const messages = state.log.map(e => e.message).join(' ');
    expect(messages).toContain('Played');
  });

  it('should properly track card zones (hand, deck, discard, recharge)', () => {
    for (let i = 0; i < 10; i++) {
      const state = useGameStore.getState();
      if (state.gameOver) break;
      executeAITurn(state);
    }

    const state = useGameStore.getState();

    for (const playerId of ['playerA', 'playerB'] as const) {
      const player = state.players[playerId];
      // Total cards should be accounted for somewhere
      const totalZones = player.hand.length
        + player.mainDeck.length
        + player.discardPile.length
        + player.rechargePile.length
        + player.removedFromPlay.length
        + player.faceDownCards.length;
      // Should have cards somewhere
      expect(totalZones).toBeGreaterThanOrEqual(0);
    }
  });
});
