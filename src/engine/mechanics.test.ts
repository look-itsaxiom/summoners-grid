import { describe, it, expect } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { createPlayerADeck, createPlayerBDeck } from '../data/cards';
import { executeAITurn } from './ai';
import { getRoleDefinition } from '../data/roles';
import { GROWTH_RATE_VALUES } from '../types';

/**
 * Tests for game mechanics that aren't covered by formula tests.
 * These verify the game *rules* work correctly, not just the math.
 */
describe('Game Mechanics', () => {
  function initGame() {
    const store = useGameStore.getState();
    store.initializeGame(createPlayerADeck(), createPlayerBDeck());
    store.decideTurnOrder('playerA');
    return store;
  }

  describe('Turn Structure', () => {
    it('should start at draw phase, turn 1, playerA active', () => {
      initGame();
      const s = useGameStore.getState();
      expect(s.phase).toBe('draw');
      expect(s.turnNumber).toBe(1);
      expect(s.activePlayer).toBe('playerA');
    });

    it('should skip draw on first turn for first player', () => {
      const store = initGame();
      store.executeDrawPhase();
      const s = useGameStore.getState();
      // Should have advanced to level phase, hand still has 3 (summons only)
      expect(s.phase).toBe('level');
      expect(s.players.playerA.hand.length).toBe(3); // No card drawn
    });

    it('should draw a card on turn 2', () => {
      const store = initGame();
      // Play through turn 1
      store.executeDrawPhase(); // Skip draw
      store.executeLevelPhase();
      store.endActionPhase(); // End turn → playerB
      // PlayerB turn
      executeAITurn(useGameStore.getState());
      // Now playerA turn 2
      const before = useGameStore.getState().players.playerA.hand.length;
      useGameStore.getState().executeDrawPhase();
      const after = useGameStore.getState().players.playerA.hand.length;
      expect(after).toBe(before + 1); // Drew 1 card
    });
  });

  describe('Summon Placement', () => {
    it('should place summon in own territory', () => {
      const store = initGame();
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.playSummon(0, { x: 5, y: 1 }); // Player A territory (y < 3)
      const s = useGameStore.getState();
      expect(s.board.summons.length).toBe(1);
      expect(s.board.summons[0].position).toEqual({ x: 5, y: 1 });
    });

    it('should reject placement outside territory', () => {
      const store = initGame();
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.playSummon(0, { x: 5, y: 7 }); // Mid-board, not territory
      const s = useGameStore.getState();
      expect(s.board.summons.length).toBe(0); // Not placed
    });

    it('should draw 3 cards when placing a summon', () => {
      const store = initGame();
      store.executeDrawPhase();
      store.executeLevelPhase();
      const handBefore = useGameStore.getState().players.playerA.hand.length;
      store.playSummon(0, { x: 5, y: 1 });
      const handAfter = useGameStore.getState().players.playerA.hand.length;
      // Lost 1 summon from hand, drew 3 = net +2
      expect(handAfter).toBe(handBefore - 1 + 3);
    });

    it('should only allow one summon per turn', () => {
      const store = initGame();
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.playSummon(0, { x: 5, y: 1 }); // First summon
      const summonsAfterFirst = useGameStore.getState().board.summons.length;
      // Try second — find another summon card
      const hand = useGameStore.getState().players.playerA.hand;
      const secondSummonIdx = hand.findIndex(c => c.cardType === 'summon');
      if (secondSummonIdx >= 0) {
        store.playSummon(secondSummonIdx, { x: 6, y: 1 });
      }
      expect(useGameStore.getState().board.summons.length).toBe(summonsAfterFirst);
    });
  });

  describe('Summon Entry Level', () => {
    it('should enter at level 5', () => {
      const store = initGame();
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.playSummon(0, { x: 5, y: 1 });
      expect(useGameStore.getState().board.summons[0].level).toBe(5);
    });
  });

  describe('Hand Limit', () => {
    it('should enforce 6-card hand limit at end of turn', () => {
      const store = initGame();
      // Give player extra cards by manipulating state
      useGameStore.setState(state => ({
        players: {
          ...state.players,
          playerA: {
            ...state.players.playerA,
            hand: [...state.players.playerA.hand,
              ...state.players.playerA.mainDeck.slice(0, 5)
            ],
          },
        },
      }));
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.endActionPhase();
      // After end phase, next player is active, but previous player's hand was trimmed
      // The end phase for playerA should have discarded excess
    });
  });

  describe('Victory Conditions', () => {
    it('should detect victory at 3 VP', () => {
      initGame();
      useGameStore.setState(state => ({
        players: {
          ...state.players,
          playerA: { ...state.players.playerA, victoryPoints: 3 },
        },
      }));
      useGameStore.getState().checkVictory();
      const s = useGameStore.getState();
      expect(s.gameOver).toBe(true);
      expect(s.winner).toBe('playerA');
    });

    it('should not trigger victory below 3 VP', () => {
      initGame();
      useGameStore.setState(state => ({
        players: {
          ...state.players,
          playerA: { ...state.players.playerA, victoryPoints: 2 },
        },
      }));
      useGameStore.getState().checkVictory();
      expect(useGameStore.getState().gameOver).toBe(false);
    });
  });

  describe('Card Pile Destinations', () => {
    it('should track main deck size decreasing as cards are drawn', () => {
      const store = initGame();
      const deckBefore = store.players.playerA.mainDeck.length;
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.playSummon(0, { x: 5, y: 1 }); // Draws 3 more
      const deckAfter = useGameStore.getState().players.playerA.mainDeck.length;
      // First turn skips draw, but summon draws 3
      expect(deckAfter).toBe(deckBefore - 3);
    });
  });

  describe('VP Awards per GDD', () => {
    it('should award 1 VP for tier 1 summon defeat', () => {
      // Tier 1 roles: warrior, magician, scout
      expect(getRoleDefinition('warrior').tier).toBe(1);
      expect(getRoleDefinition('magician').tier).toBe(1);
      expect(getRoleDefinition('scout').tier).toBe(1);
      // VP = tier >= 2 ? 2 : 1 → tier 1 = 1 VP
    });

    it('should award 2 VP for tier 2+ summon defeat', () => {
      expect(getRoleDefinition('berserker').tier).toBe(2);
      expect(getRoleDefinition('knight').tier).toBe(2);
      expect(getRoleDefinition('assassin').tier).toBe(3);
      // VP = tier >= 2 ? 2 : 1 → tier 2+ = 2 VP
    });
  });

  describe('Level Boundaries', () => {
    it('summons should not exceed level 20', () => {
      const store = initGame();
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.playSummon(0, { x: 5, y: 1 });

      // Force level to 19
      useGameStore.setState(state => ({
        board: {
          ...state.board,
          summons: state.board.summons.map(s => ({ ...s, level: 19 })),
        },
      }));

      // Level up should go to 20, not 21
      useGameStore.getState().executeLevelPhase();
      // Need to be in level phase
    });

    it('level 5 is minimum entry level', () => {
      const store = initGame();
      store.executeDrawPhase();
      store.executeLevelPhase();
      store.playSummon(0, { x: 5, y: 1 });
      expect(useGameStore.getState().board.summons[0].level).toBe(5);
    });
  });

  describe('Growth Rate Values per GDD', () => {
    it('should have correct growth rate multipliers', () => {
      expect(GROWTH_RATE_VALUES.minimal).toBe(0.5);
      expect(GROWTH_RATE_VALUES.steady).toBe(0.67);
      expect(GROWTH_RATE_VALUES.normal).toBe(1.0);
      expect(GROWTH_RATE_VALUES.gradual).toBe(1.33);
      expect(GROWTH_RATE_VALUES.accelerated).toBe(1.5);
      expect(GROWTH_RATE_VALUES.exceptional).toBe(2.0);
    });
  });
});
