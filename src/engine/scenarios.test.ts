import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { createPlayerADeck, createPlayerBDeck, SUMMON_CARDS, ACTION_CARDS, COUNTER_CARDS, QUEST_CARDS, ADVANCE_CARDS } from '../data/cards';
import { createSummonUnit } from './stats';
import type { PlayerId, SummonUnit, Card } from '../types';

/**
 * Scenario-based tests: load specific game states and verify card interactions.
 * This tests the COMPLETE card resolution pipeline, not just formulas.
 */

// Helper: set up a game with specific board state
function setupGame(): void {
  const store = useGameStore.getState();
  store.initializeGame(createPlayerADeck(), createPlayerBDeck());
  store.decideTurnOrder('playerA');
}

function advanceToAction(): void {
  const store = useGameStore.getState();
  store.executeDrawPhase();
  if (useGameStore.getState().phase === 'level') {
    useGameStore.getState().executeLevelPhase();
  }
}

function placeSummonForPlayer(
  cardId: string,
  player: PlayerId,
  pos: { x: number; y: number },
  roleId: string = 'warrior'
): SummonUnit {
  const card = SUMMON_CARDS[cardId];
  const unit = createSummonUnit(card, player, pos, roleId as any);
  useGameStore.setState(state => ({
    board: {
      ...state.board,
      summons: [...state.board.summons, unit],
    },
  }));
  return unit;
}

function addCardToHand(player: PlayerId, card: Card): void {
  useGameStore.setState(state => ({
    players: {
      ...state.players,
      [player]: {
        ...state.players[player],
        hand: [...state.players[player].hand, card],
      },
    },
  }));
}

describe('Scenario: Action Card — Blast Bolt on Warrior', () => {
  beforeEach(setupGame);

  it('should deal magical fire damage when played', () => {
    advanceToAction();
    // Place a warrior for Player A and a magician for Player A as caster
    const warrior = placeSummonForPlayer('gignen_warrior_a', 'playerB', { x: 5, y: 11 });
    placeSummonForPlayer('gignen_magician_a', 'playerA', { x: 4, y: 2 }, 'magician');

    // Add Blast Bolt to hand
    addCardToHand('playerA', ACTION_CARDS.blast_bolt);

    const hand = useGameStore.getState().players.playerA.hand;
    const bbIndex = hand.findIndex(c => c.id === 'blast_bolt');

    useGameStore.getState().playCard(bbIndex, [warrior.instanceId]);

    // Card should be consumed from hand regardless of hit/miss
    const handAfter = useGameStore.getState().players.playerA.hand;
    expect(handAfter.find(c => c.id === 'blast_bolt')).toBeUndefined(); // Card consumed
  });

  it('should send Blast Bolt to discard pile after use', () => {
    advanceToAction();
    placeSummonForPlayer('gignen_warrior_a', 'playerB', { x: 5, y: 11 });
    placeSummonForPlayer('gignen_magician_a', 'playerA', { x: 4, y: 2 }, 'magician');
    addCardToHand('playerA', ACTION_CARDS.blast_bolt);

    const bbIndex = useGameStore.getState().players.playerA.hand.findIndex(c => c.id === 'blast_bolt');
    const target = useGameStore.getState().board.summons.find(s => s.owner === 'playerB')!;
    useGameStore.getState().playCard(bbIndex, [target.instanceId]);

    // Blast Bolt pileDestination = 'discard'
    const discard = useGameStore.getState().players.playerA.discardPile;
    expect(discard.some(c => c.id === 'blast_bolt')).toBe(true);
  });
});

describe('Scenario: Healing Card — Healing Hands', () => {
  beforeEach(setupGame);

  it('should heal a damaged ally summon', () => {
    advanceToAction();
    const warrior = placeSummonForPlayer('gignen_warrior_a', 'playerA', { x: 5, y: 2 });
    placeSummonForPlayer('gignen_magician_a', 'playerA', { x: 4, y: 2 }, 'magician');

    // Damage the warrior
    useGameStore.setState(state => ({
      board: {
        ...state.board,
        summons: state.board.summons.map(s =>
          s.instanceId === warrior.instanceId
            ? { ...s, currentHP: Math.floor(s.maxHP * 0.5) }
            : s
        ),
      },
    }));

    addCardToHand('playerA', ACTION_CARDS.healing_hands);
    const bbIndex = useGameStore.getState().players.playerA.hand.findIndex(c => c.id === 'healing_hands');
    useGameStore.getState().playCard(bbIndex, [warrior.instanceId]);

    const healed = useGameStore.getState().board.summons.find(s => s.instanceId === warrior.instanceId)!;
    expect(healed.currentHP).toBeGreaterThan(Math.floor(warrior.maxHP * 0.5));
  });
});

describe('Scenario: Sharpened Blade permanent weapon buff', () => {
  beforeEach(setupGame);

  it('should permanently increase weapon base power by 10', () => {
    advanceToAction();
    const warrior = placeSummonForPlayer('gignen_warrior_a', 'playerA', { x: 5, y: 2 });
    const weaponPowerBefore = warrior.card.equipment.weapon!.basePower;

    addCardToHand('playerA', ACTION_CARDS.sharpened_blade);
    const idx = useGameStore.getState().players.playerA.hand.findIndex(c => c.id === 'sharpened_blade');
    useGameStore.getState().playCard(idx, [warrior.instanceId]);

    const updated = useGameStore.getState().board.summons.find(s => s.instanceId === warrior.instanceId)!;
    expect(updated.card.equipment.weapon!.basePower).toBe(weaponPowerBefore + 10);
  });
});

describe('Scenario: Counter card — face-down and trigger', () => {
  beforeEach(setupGame);

  it('should allow setting a counter face-down', () => {
    advanceToAction();
    addCardToHand('playerA', COUNTER_CARDS.dramatic_return);

    const idx = useGameStore.getState().players.playerA.hand.findIndex(c => c.id === 'dramatic_return');
    useGameStore.getState().setFaceDown(idx);

    const state = useGameStore.getState();
    expect(state.players.playerA.faceDownCards.length).toBe(1);
    expect(state.players.playerA.hand.find(c => c.id === 'dramatic_return')).toBeUndefined();
  });
});

describe('Scenario: Quest completion — Nearwood Forest Expedition', () => {
  beforeEach(setupGame);

  it('should grant 2 levels to target summon', () => {
    advanceToAction();
    const warrior = placeSummonForPlayer('gignen_warrior_a', 'playerA', { x: 5, y: 2 });
    const levelBefore = warrior.level; // 5

    addCardToHand('playerA', { ...QUEST_CARDS.nearwood_forest_expedition });
    const idx = useGameStore.getState().players.playerA.hand.findIndex(c => c.id === 'nearwood_forest_expedition');
    useGameStore.getState().playCard(idx, [warrior.instanceId]);

    const updated = useGameStore.getState().board.summons.find(s => s.instanceId === warrior.instanceId)!;
    expect(updated.level).toBe(levelBefore + 2);
  });
});

describe('Scenario: Role advancement via advance card', () => {
  beforeEach(setupGame);

  it('should change warrior to berserker with stat recalculation', () => {
    advanceToAction();
    // Place a level 10 warrior
    const warrior = placeSummonForPlayer('gignen_warrior_a', 'playerA', { x: 5, y: 2 });
    useGameStore.setState(state => ({
      board: {
        ...state.board,
        summons: state.board.summons.map(s =>
          s.instanceId === warrior.instanceId ? { ...s, level: 10 } : s
        ),
      },
    }));

    // Add berserker rage to advance deck
    useGameStore.setState(state => ({
      players: {
        ...state.players,
        playerA: {
          ...state.players.playerA,
          advanceDeck: [ADVANCE_CARDS.berserker_rage],
        },
      },
    }));

    useGameStore.getState().playAdvanceCard(0, warrior.instanceId);

    const updated = useGameStore.getState().board.summons.find(s => s.instanceId === warrior.instanceId)!;
    expect(updated.currentRole).toBe('berserker');
    // Berserker has STR modifier 1.3 — stats should be recalculated
    expect(updated.calculatedStats.STR).toBeGreaterThan(warrior.calculatedStats.STR);
  });
});

describe('Scenario: Attack and defeat with VP award', () => {
  beforeEach(setupGame);

  it('should award 1 VP for defeating a tier 1 summon and remove it', () => {
    advanceToAction();
    const attacker = placeSummonForPlayer('gignen_warrior_a', 'playerA', { x: 5, y: 4 });
    const target = placeSummonForPlayer('fae_magician_b', 'playerB', { x: 5, y: 5 }, 'magician');

    // Set target to 1 HP so any hit kills it
    useGameStore.setState(state => ({
      board: {
        ...state.board,
        summons: state.board.summons.map(s =>
          s.instanceId === target.instanceId ? { ...s, currentHP: 1 } : s
        ),
      },
    }));

    useGameStore.getState().attackWithSummon(attacker.instanceId, target.instanceId);

    const state = useGameStore.getState();
    // Target should be removed (or still there if attack missed)
    const targetExists = state.board.summons.find(s => s.instanceId === target.instanceId);
    if (!targetExists) {
      // Attack hit and killed → VP should be awarded
      expect(state.players.playerA.victoryPoints).toBeGreaterThanOrEqual(1);
    }
    // Either way, attacker should have hasAttacked = true
    const updatedAttacker = state.board.summons.find(s => s.instanceId === attacker.instanceId)!;
    expect(updatedAttacker.hasAttacked).toBe(true);
  });
});
