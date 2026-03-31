import { create } from 'zustand';
import type {
  GameState,
  PlayerId,
  TurnPhase,
  Card,
  SummonCard,
  SummonUnit,
  Position,
  PlayerState,
  GameLogEntry,
  AdvanceCard,
  ActionCard,
  RoleId,
} from '../types';
import { VP_TO_WIN, HAND_LIMIT, SUMMON_DRAW_COUNT, TERRITORY_DEPTH, BOARD_HEIGHT } from '../types';
import {
  createSummonUnit,
  applyLevelUp,
  calculateMovementSpeed,
  calculateAllStats,
  calculateMaxHP,
  calculateToHit,
  calculateCritChance,
  calculatePhysicalMeleeDamage,
  calculatePhysicalRangedDamage,
  calculateMagicalDamage,
  rollHit,
  rollCrit,
  calculateHealing,
} from '../engine/stats';
import { getRoleDefinition } from '../data/roles';
import { canPlayCard } from '../engine/cardEffects';

function createEmptyPlayer(id: PlayerId): PlayerState {
  return {
    id,
    hand: [],
    mainDeck: [],
    advanceDeck: [],
    discardPile: [],
    rechargePile: [],
    removedFromPlay: [],
    victoryPoints: 0,
    summonSlots: [],
    hasPlayedTurnSummon: false,
    faceDownCards: [],
  };
}

function createInitialState(): GameState {
  return {
    phase: 'draw',
    turnNumber: 1,
    activePlayer: 'playerA',
    players: {
      playerA: createEmptyPlayer('playerA'),
      playerB: createEmptyPlayer('playerB'),
    },
    board: {
      summons: [],
      buildings: [],
    },
    effectStack: [],
    priorityPlayer: 'playerA',
    winner: null,
    gameOver: false,
    turnOrderDecided: false,
    coinFlipWinner: null,
    log: [],
  };
}

export interface GameActions {
  // Setup
  initializeGame: (playerADeck: DeckConfig, playerBDeck: DeckConfig) => void;
  decideTurnOrder: (firstPlayer: PlayerId) => void;

  // Turn flow
  advancePhase: () => void;
  executeDrawPhase: () => void;
  executeLevelPhase: () => void;
  endActionPhase: () => void;
  executeEndPhase: () => void;

  // Actions
  playSummon: (cardIndex: number, position: Position) => void;
  moveSummon: (unitId: string, to: Position) => void;
  attackWithSummon: (attackerId: string, targetId: string) => void;
  playCard: (cardIndex: number, targets: string[]) => void;
  playAdvanceCard: (advanceIndex: number, targetUnitId: string) => void;
  getPlayableAdvanceCards: () => Array<{ index: number; card: AdvanceCard; validTargets: SummonUnit[] }>;

  // Utility
  addLog: (message: string) => void;
  checkVictory: () => void;
  getOpponent: (player: PlayerId) => PlayerId;
  getSummonsByOwner: (owner: PlayerId) => SummonUnit[];
}

export interface DeckConfig {
  summonSlots: Array<{
    summon: SummonCard;
    roleId: 'warrior' | 'magician' | 'scout';
  }>;
  mainDeck: Card[];
  advanceDeck: AdvanceCard[];
}

// Map summon card IDs to their starting roles
let summonRoleMap: Record<string, RoleId> = {};

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  initializeGame: (playerADeck, playerBDeck) => {
    const state = createInitialState();

    // Build role map
    summonRoleMap = {};
    for (const slot of [...playerADeck.summonSlots, ...playerBDeck.summonSlots]) {
      summonRoleMap[slot.summon.id] = slot.roleId;
    }

    // Set up Player A
    state.players.playerA.summonSlots = playerADeck.summonSlots.map(s => s.summon);
    state.players.playerA.hand = [...playerADeck.summonSlots.map(s => s.summon)];
    state.players.playerA.mainDeck = [...playerADeck.mainDeck];
    state.players.playerA.advanceDeck = [...playerADeck.advanceDeck];

    // Set up Player B
    state.players.playerB.summonSlots = playerBDeck.summonSlots.map(s => s.summon);
    state.players.playerB.hand = [...playerBDeck.summonSlots.map(s => s.summon)];
    state.players.playerB.mainDeck = [...playerBDeck.mainDeck];
    state.players.playerB.advanceDeck = [...playerBDeck.advanceDeck];

    // Shuffle decks
    shuffleArray(state.players.playerA.mainDeck);
    shuffleArray(state.players.playerB.mainDeck);

    set(state);
  },

  decideTurnOrder: (firstPlayer) => {
    set({
      activePlayer: firstPlayer,
      turnOrderDecided: true,
      coinFlipWinner: firstPlayer,
    });
  },

  advancePhase: () => {
    const { phase } = get();
    const phases: TurnPhase[] = ['draw', 'level', 'action', 'end'];
    const currentIndex = phases.indexOf(phase);

    if (currentIndex < phases.length - 1) {
      set({ phase: phases[currentIndex + 1] });
    }
  },

  executeDrawPhase: () => {
    const { activePlayer, turnNumber, players } = get();

    // Skip draw on first turn of game for first player
    if (turnNumber === 1 && activePlayer === get().coinFlipWinner) {
      get().addLog('First turn — draw phase skipped.');
      get().advancePhase();
      return;
    }

    const player = { ...players[activePlayer] };
    const drawn = drawCards(player, 1);

    if (drawn.length > 0) {
      get().addLog(`Drew: ${drawn.map(c => c.name).join(', ')}`);
    } else {
      get().addLog('No cards to draw.');
    }

    set({
      players: { ...players, [activePlayer]: player },
    });
    get().advancePhase();
  },

  executeLevelPhase: () => {
    const { activePlayer, board } = get();
    const summons = board.summons.filter(s => s.owner === activePlayer);

    if (summons.length === 0) {
      get().addLog('No summons in play — level phase skipped.');
      get().advancePhase();
      return;
    }

    const updatedSummons = board.summons.map(s => {
      if (s.owner !== activePlayer) return s;
      if (s.level >= 20) return s;

      const leveled = applyLevelUp(s, 1);
      get().addLog(
        `${s.card.name} levels up: ${s.level} → ${leveled.level} (HP: ${leveled.currentHP}/${leveled.maxHP})`
      );
      return leveled;
    });

    set({
      board: { ...board, summons: updatedSummons },
    });
    get().advancePhase();
  },

  endActionPhase: () => {
    set({ phase: 'end' });
    get().executeEndPhase();
  },

  executeEndPhase: () => {
    const { activePlayer, players, board, turnNumber } = get();
    const player = { ...players[activePlayer] };

    // Discard excess cards (hand limit = 6)
    while (player.hand.length > HAND_LIMIT) {
      const discarded = player.hand.pop()!;
      player.rechargePile.push(discarded);
      get().addLog(`Discarded ${discarded.name} (hand limit).`);
    }

    // Reset summon actions for next turn
    const resetSummons = board.summons.map(s => {
      if (s.owner !== activePlayer) return s;
      return {
        ...s,
        hasAttacked: false,
        movementRemaining: calculateMovementSpeed(s.calculatedStats.SPD),
      };
    });

    // Switch active player
    const nextPlayer = activePlayer === 'playerA' ? 'playerB' : 'playerA';
    const nextTurn = activePlayer === 'playerB' ? turnNumber + 1 : turnNumber;

    set({
      players: { ...players, [activePlayer]: player },
      board: { ...board, summons: resetSummons },
      activePlayer: nextPlayer,
      phase: 'draw',
      turnNumber: nextTurn,
    });

    // Reset turn summon flag for next player
    set(state => ({
      players: {
        ...state.players,
        [nextPlayer]: { ...state.players[nextPlayer], hasPlayedTurnSummon: false },
      },
    }));

    get().addLog(`--- Turn ${nextTurn}, ${nextPlayer}'s turn ---`);
  },

  playSummon: (cardIndex, position) => {
    const { activePlayer, players, board } = get();
    const player = { ...players[activePlayer] };

    if (player.hasPlayedTurnSummon) {
      get().addLog('Already played a summon this turn!');
      return;
    }

    const card = player.hand[cardIndex];
    if (!card || card.cardType !== 'summon') {
      get().addLog('Invalid summon card.');
      return;
    }

    // Validate territory placement
    if (!isInTerritory(position, activePlayer)) {
      get().addLog('Must place summon in your own territory!');
      return;
    }

    // Check space is not occupied
    if (board.summons.some(s => s.position.x === position.x && s.position.y === position.y)) {
      get().addLog('Space is already occupied!');
      return;
    }

    const summonCard = card as SummonCard;
    const roleId = summonRoleMap[summonCard.id] ?? 'warrior';

    const unit = createSummonUnit(summonCard, activePlayer, position, roleId);

    // Remove from hand
    player.hand = player.hand.filter((_, i) => i !== cardIndex);
    player.hasPlayedTurnSummon = true;

    // Draw 3 cards (Summon Draws)
    const drawn = drawCards(player, SUMMON_DRAW_COUNT);

    set({
      players: { ...players, [activePlayer]: player },
      board: { ...board, summons: [...board.summons, unit] },
    });

    get().addLog(
      `Played ${summonCard.name} (${getRoleDefinition(roleId).name}) at (${position.x},${position.y}). Drew ${drawn.length} cards.`
    );
  },

  moveSummon: (unitId, to) => {
    const { board } = get();
    const unitIndex = board.summons.findIndex(s => s.instanceId === unitId);
    if (unitIndex === -1) return;

    const unit = board.summons[unitIndex];
    const dx = Math.abs(to.x - unit.position.x);
    const dy = Math.abs(to.y - unit.position.y);
    const distance = Math.max(dx, dy); // Chebyshev distance for diagonal movement

    if (distance > unit.movementRemaining) {
      get().addLog('Not enough movement remaining!');
      return;
    }

    const updatedSummons = [...board.summons];
    updatedSummons[unitIndex] = {
      ...unit,
      position: to,
      movementRemaining: unit.movementRemaining - distance,
    };

    set({ board: { ...board, summons: updatedSummons } });
    get().addLog(`Moved ${unit.card.name} to (${to.x},${to.y}).`);
  },

  attackWithSummon: (attackerId, targetId) => {
    const { activePlayer, players, board } = get();
    const attacker = board.summons.find(s => s.instanceId === attackerId);
    const target = board.summons.find(s => s.instanceId === targetId);

    if (!attacker || !target) {
      get().addLog('Invalid attacker or target.');
      return;
    }

    if (attacker.owner !== activePlayer) {
      get().addLog('Not your summon!');
      return;
    }

    if (attacker.hasAttacked) {
      get().addLog(`${attacker.card.name} has already attacked this turn!`);
      return;
    }

    if (target.owner === activePlayer) {
      get().addLog('Cannot attack your own summon!');
      return;
    }

    const weapon = attacker.card.equipment.weapon;
    if (!weapon) {
      get().addLog(`${attacker.card.name} has no weapon equipped!`);
      return;
    }

    // Range check
    const dx = Math.abs(attacker.position.x - target.position.x);
    const dy = Math.abs(attacker.position.y - target.position.y);
    const distance = Math.max(dx, dy); // Chebyshev distance

    if (distance > weapon.range) {
      get().addLog(`Target out of range! (distance: ${distance}, weapon range: ${weapon.range})`);
      return;
    }

    // Hit calculation
    const toHitPct = calculateToHit(weapon.baseAccuracy, attacker.calculatedStats.ACC);
    const hitResult = rollHit(toHitPct);

    get().addLog(
      `${attacker.card.name} attacks ${target.card.name}! To-hit: ${toHitPct.toFixed(1)}%, rolled ${hitResult.roll}`
    );

    if (!hitResult.hit) {
      get().addLog('Attack missed!');
      const updatedSummons = board.summons.map(s =>
        s.instanceId === attackerId ? { ...s, hasAttacked: true } : s
      );
      set({ board: { ...board, summons: updatedSummons } });
      return;
    }

    // Crit calculation
    const critPct = calculateCritChance(attacker.calculatedStats.LCK);
    const critResult = rollCrit(critPct);
    const isCrit = critResult.crit;

    if (isCrit) {
      get().addLog(`CRITICAL HIT! (${critPct}% chance, rolled ${critResult.roll})`);
    }

    // Damage calculation
    let damage: number;
    const stats = attacker.calculatedStats;

    if (weapon.damageType === 'physical_melee') {
      damage = calculatePhysicalMeleeDamage(
        stats.STR, weapon.basePower, target.calculatedStats.DEF, isCrit
      );
    } else if (weapon.damageType === 'physical_ranged') {
      damage = calculatePhysicalRangedDamage(
        stats.STR, stats.ACC, weapon.basePower, target.calculatedStats.DEF, isCrit
      );
    } else {
      damage = calculateMagicalDamage(
        stats.INT, weapon.basePower, target.calculatedStats.MDF, isCrit
      );
    }

    get().addLog(`Deals ${damage} damage!`);

    const newHP = target.currentHP - damage;
    const defeated = newHP <= 0;

    let updatedSummons = board.summons.map(s => {
      if (s.instanceId === attackerId) return { ...s, hasAttacked: true };
      if (s.instanceId === targetId) return { ...s, currentHP: Math.max(0, newHP) };
      return s;
    });

    if (defeated) {
      get().addLog(`${target.card.name} is defeated!`);
      updatedSummons = updatedSummons.filter(s => s.instanceId !== targetId);

      // Award VP
      const role = getRoleDefinition(target.currentRole);
      const vpGain = role.tier >= 2 ? 2 : 1;
      const updatedPlayers = { ...players };
      updatedPlayers[activePlayer] = {
        ...updatedPlayers[activePlayer],
        victoryPoints: updatedPlayers[activePlayer].victoryPoints + vpGain,
      };

      // Move card to removed from play
      const targetOwner = target.owner;
      updatedPlayers[targetOwner] = {
        ...updatedPlayers[targetOwner],
        removedFromPlay: [...updatedPlayers[targetOwner].removedFromPlay, target.card],
      };

      get().addLog(`${activePlayer} gains ${vpGain} VP! (${updatedPlayers[activePlayer].victoryPoints} total)`);

      set({
        board: { ...board, summons: updatedSummons },
        players: updatedPlayers,
      });

      // Check victory
      get().checkVictory();
    } else {
      get().addLog(`${target.card.name} HP: ${newHP}/${target.maxHP}`);
      set({ board: { ...board, summons: updatedSummons } });
    }
  },

  playCard: (cardIndex, targets) => {
    const { activePlayer, players, board } = get();
    const player = { ...players[activePlayer] };
    const card = player.hand[cardIndex];

    if (!card) {
      get().addLog('Invalid card index.');
      return;
    }

    if (card.cardType === 'summon') {
      get().addLog('Use playSummon for summon cards.');
      return;
    }

    // Check requirements
    if (!canPlayCard(card, get(), activePlayer)) {
      get().addLog(`Cannot play ${card.name} — requirements not met.`);
      return;
    }

    const targetUnit = targets[0]
      ? board.summons.find(s => s.instanceId === targets[0])
      : undefined;

    // Remove card from hand
    player.hand = player.hand.filter((_, i) => i !== cardIndex);

    // Send to appropriate pile
    if (card.pileDestination === 'discard') {
      player.discardPile.push(card);
    } else if (card.pileDestination === 'recharge') {
      player.rechargePile.push(card);
    }

    get().addLog(`Played ${card.name}.`);

    // Resolve effects
    if (card.cardType === 'action' && targetUnit) {
      const actionCard = card as ActionCard;

      // Find caster (for cards requiring a specific summon role)
      const mySummons = board.summons.filter(s => s.owner === activePlayer);
      let caster: SummonUnit | undefined;

      for (const req of actionCard.requirements) {
        if (req.roleFamily) {
          caster = mySummons.find(s => {
            const role = getRoleDefinition(s.currentRole);
            return role.family === req.roleFamily;
          });
        }
      }
      if (!caster && mySummons.length > 0) {
        caster = mySummons[0]; // Default to first summon
      }

      let updatedSummons = [...board.summons];

      for (const effect of actionCard.effects) {
        const currentTarget = updatedSummons.find(s => s.instanceId === targetUnit.instanceId);
        if (!currentTarget) break;

        switch (effect.type) {
          case 'damage': {
            if (!caster) break;
            // Hit check
            const toHitPct = calculateToHit(85, caster.calculatedStats.ACC);
            const hitResult = rollHit(toHitPct);
            get().addLog(`To-hit: ${toHitPct.toFixed(1)}%, rolled ${hitResult.roll}`);

            if (!hitResult.hit) {
              get().addLog('Attack missed!');
              break;
            }

            // Crit
            let isCrit = false;
            if (effect.canCrit) {
              const critPct = calculateCritChance(caster.calculatedStats.LCK);
              const critResult = rollCrit(critPct);
              isCrit = critResult.crit;
              if (isCrit) get().addLog(`CRITICAL HIT! (${critPct}%)`);
            }

            // Damage
            let damage = 0;
            const bp = effect.basePower ?? 0;
            if (effect.damageType === 'magical') {
              damage = calculateMagicalDamage(caster.calculatedStats.INT, bp, currentTarget.calculatedStats.MDF, isCrit);
            } else {
              damage = calculatePhysicalMeleeDamage(caster.calculatedStats.STR, bp, currentTarget.calculatedStats.DEF, isCrit);
            }
            get().addLog(`Deals ${damage} damage!`);

            const newHP = currentTarget.currentHP - damage;
            updatedSummons = updatedSummons.map(s =>
              s.instanceId === currentTarget.instanceId ? { ...s, currentHP: Math.max(0, newHP) } : s
            );

            if (newHP <= 0) {
              get().addLog(`${currentTarget.card.name} is defeated!`);
              updatedSummons = updatedSummons.filter(s => s.instanceId !== currentTarget.instanceId);

              const role = getRoleDefinition(currentTarget.currentRole);
              const vpGain = role.tier >= 2 ? 2 : 1;
              player.victoryPoints = (players[activePlayer].victoryPoints || 0) + vpGain;

              const targetOwner = currentTarget.owner;
              const updatedPlayers = { ...players, [activePlayer]: player };
              updatedPlayers[targetOwner] = {
                ...updatedPlayers[targetOwner],
                removedFromPlay: [...updatedPlayers[targetOwner].removedFromPlay, currentTarget.card],
              };

              get().addLog(`${activePlayer} gains ${vpGain} VP!`);
              set({
                board: { ...board, summons: updatedSummons },
                players: updatedPlayers,
              });
              get().checkVictory();
              return; // Early return after defeat
            }
            break;
          }

          case 'heal': {
            if (!caster) break;
            let isCrit = false;
            if (effect.canCrit) {
              const critPct = calculateCritChance(caster.calculatedStats.LCK);
              const critResult = rollCrit(critPct);
              isCrit = critResult.crit;
              if (isCrit) get().addLog(`Critical heal! (${critPct}%)`);
            }
            const bp = effect.basePower ?? 0;
            const healAmount = calculateHealing(caster.calculatedStats.SPI, bp, isCrit);
            const healed = Math.min(currentTarget.maxHP - currentTarget.currentHP, healAmount);
            updatedSummons = updatedSummons.map(s =>
              s.instanceId === currentTarget.instanceId ? { ...s, currentHP: s.currentHP + healed } : s
            );
            get().addLog(`${currentTarget.card.name} heals ${healed} HP (${currentTarget.currentHP + healed}/${currentTarget.maxHP})`);
            break;
          }

          case 'buff': {
            get().addLog(`${currentTarget.card.name} gains: ${effect.description}`);
            break;
          }

          case 'debuff': {
            get().addLog(`${currentTarget.card.name}: ${effect.description}`);
            break;
          }

          default: {
            get().addLog(`Effect: ${effect.description}`);
            break;
          }
        }
      }

      set({
        players: { ...players, [activePlayer]: player },
        board: { ...board, summons: updatedSummons },
      });
    } else if (card.cardType === 'quest' && targetUnit) {
      // Quest completion — award level-ups
      const questCard = card as import('../types').QuestCard;
      if (questCard.rewardEffects.length > 0) {
        const leveled = applyLevelUp(targetUnit, 2); // Nearwood grants 2 levels
        const updatedSummons = board.summons.map(s =>
          s.instanceId === targetUnit.instanceId ? leveled : s
        );
        get().addLog(`${targetUnit.card.name} gains 2 levels: ${targetUnit.level} → ${leveled.level}`);
        set({
          players: { ...players, [activePlayer]: player },
          board: { ...board, summons: updatedSummons },
        });
      }
    } else {
      // Card played without target (or building/counter)
      set({ players: { ...players, [activePlayer]: player } });
    }
  },

  addLog: (message) => {
    const { turnNumber, phase, activePlayer, log } = get();
    const entry: GameLogEntry = {
      turn: turnNumber,
      phase,
      player: activePlayer,
      message,
      timestamp: Date.now(),
    };
    set({ log: [...log, entry] });
  },

  checkVictory: () => {
    const { players } = get();
    for (const id of ['playerA', 'playerB'] as PlayerId[]) {
      if (players[id].victoryPoints >= VP_TO_WIN) {
        set({ winner: id, gameOver: true });
        get().addLog(`${id} wins with ${players[id].victoryPoints} VP!`);
        return;
      }
    }
  },

  getOpponent: (player) => (player === 'playerA' ? 'playerB' : 'playerA'),

  getSummonsByOwner: (owner) => get().board.summons.filter(s => s.owner === owner),

  getPlayableAdvanceCards: () => {
    const { activePlayer, players, board } = get();
    const advanceDeck = players[activePlayer].advanceDeck;
    const mySummons = board.summons.filter(s => s.owner === activePlayer);
    const results: Array<{ index: number; card: AdvanceCard; validTargets: SummonUnit[] }> = [];

    advanceDeck.forEach((card, index) => {
      const validTargets: SummonUnit[] = [];

      for (const unit of mySummons) {
        let meetsReqs = true;

        for (const req of card.requirements) {
          if (req.type === 'role') {
            if (req.roleId && unit.currentRole !== req.roleId) meetsReqs = false;
            if (req.roleFamily) {
              const role = getRoleDefinition(unit.currentRole);
              if (role.family !== req.roleFamily) meetsReqs = false;
            }
          }
          if (req.type === 'level' && req.minLevel && unit.level < req.minLevel) {
            meetsReqs = false;
          }
        }

        if (meetsReqs) validTargets.push(unit);
      }

      if (validTargets.length > 0) {
        results.push({ index, card, validTargets });
      }
    });

    return results;
  },

  playAdvanceCard: (advanceIndex, targetUnitId) => {
    const { activePlayer, players, board } = get();
    const player = { ...players[activePlayer] };
    const card = player.advanceDeck[advanceIndex];

    if (!card) {
      get().addLog('Invalid advance card.');
      return;
    }

    const unit = board.summons.find(s => s.instanceId === targetUnitId);
    if (!unit || unit.owner !== activePlayer) {
      get().addLog('Invalid target for advance card.');
      return;
    }

    // Remove from advance deck
    player.advanceDeck = player.advanceDeck.filter((_, i) => i !== advanceIndex);

    // Send to discard
    player.discardPile.push(card);

    if (card.advanceType === 'role_change') {
      // Change the unit's role
      const newRole = card.targetRole;
      const newStats = calculateAllStats(unit.card, unit.level, newRole);
      const newMaxHP = calculateMaxHP(newStats.END);
      const damageTaken = unit.maxHP - unit.currentHP;

      const updatedSummons = board.summons.map(s => {
        if (s.instanceId !== targetUnitId) return s;
        return {
          ...s,
          currentRole: newRole,
          calculatedStats: newStats,
          maxHP: newMaxHP,
          currentHP: newMaxHP - damageTaken,
          movementRemaining: calculateMovementSpeed(newStats.SPD),
        };
      });

      const roleDef = getRoleDefinition(newRole);
      get().addLog(
        `${unit.card.name} advances to ${roleDef.name}! (HP: ${newMaxHP - damageTaken}/${newMaxHP})`
      );

      set({
        players: { ...players, [activePlayer]: player },
        board: { ...board, summons: updatedSummons },
      });
    } else if (card.advanceType === 'named_summon') {
      // Named summon transformation
      const newRole = card.targetRole;
      const newGrowthRates = card.namedSummonGrowthOverrides
        ? { ...unit.card.growthRates, ...card.namedSummonGrowthOverrides }
        : unit.card.growthRates;

      // Create modified card with new growth rates
      const modifiedCard: SummonCard = {
        ...unit.card,
        growthRates: newGrowthRates,
      };

      const newStats = calculateAllStats(modifiedCard, unit.level, newRole);
      const newMaxHP = calculateMaxHP(newStats.END);

      const updatedSummons = board.summons.map(s => {
        if (s.instanceId !== targetUnitId) return s;
        return {
          ...s,
          card: modifiedCard,
          currentRole: newRole,
          calculatedStats: newStats,
          maxHP: newMaxHP,
          currentHP: newMaxHP, // Named summons get full HP
          movementRemaining: calculateMovementSpeed(newStats.SPD),
          isNamedSummon: true,
          namedSummonName: card.namedSummonName,
        };
      });

      get().addLog(
        `${unit.card.name} transforms into ${card.namedSummonName}!`
      );

      // Add unique action cards to hand
      if (card.uniqueActionCards) {
        for (const actionCard of card.uniqueActionCards) {
          player.hand.push(actionCard);
          get().addLog(`Added "${actionCard.name}" to hand.`);
        }
      }

      set({
        players: { ...players, [activePlayer]: player },
        board: { ...board, summons: updatedSummons },
      });
    }
  },
}));

// ─── Utilities ────────────────────────────────────────────────────────────────

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function isInTerritory(pos: Position, player: PlayerId): boolean {
  if (player === 'playerA') {
    return pos.y < TERRITORY_DEPTH;
  } else {
    return pos.y >= BOARD_HEIGHT - TERRITORY_DEPTH;
  }
}

function drawCards(player: PlayerState, count: number): Card[] {
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (player.mainDeck.length === 0) {
      if (player.rechargePile.length === 0) break;
      player.mainDeck = [...player.rechargePile];
      player.rechargePile = [];
      shuffleArray(player.mainDeck);
    }

    const card = player.mainDeck.pop();
    if (card) {
      player.hand.push(card);
      drawn.push(card);
    }
  }

  return drawn;
}
