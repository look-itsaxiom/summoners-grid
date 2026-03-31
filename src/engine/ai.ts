import type {
  PlayerId,
  SummonUnit,
  Position,
} from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, TERRITORY_DEPTH } from '../types';
import { useGameStore, type GameStore } from '../store/gameStore';

/**
 * Basic AI opponent that:
 * 1. Places summons in territory
 * 2. Moves summons toward enemy
 * 3. Attacks when in range
 * 4. Plays action cards when possible
 *
 * Note: store methods (playSummon, attackWithSummon, etc.) use Zustand's
 * internal get() and work correctly. But reading store properties directly
 * gives stale values after mutations. Use fresh() to re-read current state.
 */
export function executeAITurn(store: GameStore): void {
  const fresh = () => useGameStore.getState();
  const player = store.activePlayer;

  // Execute draw phase (advances to 'level')
  store.executeDrawPhase();

  // Execute level phase (advances to 'action')
  // Must re-read state — executeDrawPhase mutated it
  if (fresh().phase === 'level') {
    store.executeLevelPhase();
  }

  // Now in action phase — re-read state for each operation
  // 1. Play a summon
  const state1 = fresh();
  if (!state1.players[player].hasPlayedTurnSummon) {
    const hand = state1.players[player].hand;
    const summonIndex = hand.findIndex(c => c.cardType === 'summon');
    if (summonIndex >= 0) {
      const pos = findBestSummonPlacement(fresh(), player);
      if (pos) {
        store.playSummon(summonIndex, pos);
      }
    }
  }

  if (fresh().gameOver) return;

  // 1.4. Set counter/reaction cards face-down (re-read hand after summon play)
  const hand2 = fresh().players[player].hand;
  for (let i = hand2.length - 1; i >= 0; i--) {
    const card = hand2[i];
    if (card.cardType === 'counter' || card.cardType === 'reaction') {
      store.setFaceDown(i);
      break;
    }
  }

  if (fresh().gameOver) return;

  // 1.5. Try to play action cards from hand
  tryPlayActionCards(store, player, fresh);

  if (fresh().gameOver) return;

  // 1.7. Try to play advance cards
  const playableAdvances = fresh().getPlayableAdvanceCards();
  for (const entry of playableAdvances) {
    if (entry.validTargets.length > 0) {
      store.playAdvanceCard(entry.index, entry.validTargets[0].instanceId);
      break;
    }
  }

  if (fresh().gameOver) return;

  // 2. Move and attack with each summon
  const mySummonIds = fresh().board.summons
    .filter(s => s.owner === player)
    .map(s => s.instanceId);

  for (const unitId of mySummonIds) {
    if (fresh().gameOver) return;

    // Re-read from fresh state (units may have been destroyed)
    const currentState = fresh();
    const unit = currentState.board.summons.find(s => s.instanceId === unitId);
    if (!unit) continue;

    const enemies = currentState.board.summons.filter(s => s.owner !== player);
    const weapon = unit.card.equipment.weapon;

    if (enemies.length === 0) {
      const centerTarget: Position = {
        x: Math.floor(BOARD_WIDTH / 2),
        y: Math.floor(BOARD_HEIGHT / 2),
      };
      const moveTarget = findMoveTowardTarget(unit, centerTarget, fresh());
      if (moveTarget) store.moveSummon(unit.instanceId, moveTarget);
      continue;
    }

    if (!weapon) continue;

    const target = findBestAttackTarget(unit, enemies);
    if (!target) continue;

    const dist = chebyshevDistance(unit.position, target.position);

    if (dist <= weapon.range && !unit.hasAttacked) {
      store.attackWithSummon(unit.instanceId, target.instanceId);
    } else {
      const moveTarget = findMoveTowardTarget(unit, target.position, fresh());
      if (moveTarget) {
        store.moveSummon(unit.instanceId, moveTarget);

        // Re-read after move
        const afterMove = fresh();
        const movedUnit = afterMove.board.summons.find(s => s.instanceId === unitId);
        if (movedUnit && !movedUnit.hasAttacked) {
          const currentTarget = afterMove.board.summons.find(s => s.instanceId === target.instanceId);
          if (currentTarget) {
            const newDist = chebyshevDistance(movedUnit.position, currentTarget.position);
            if (weapon && newDist <= weapon.range) {
              store.attackWithSummon(movedUnit.instanceId, currentTarget.instanceId);
            }
          }
        }
      }
    }
  }

  if (fresh().gameOver) return;

  // End turn
  store.endActionPhase();
}

function findBestSummonPlacement(state: GameStore, player: PlayerId): Position | null {
  const occupied = new Set(
    state.board.summons.map(s => `${s.position.x},${s.position.y}`)
  );

  const candidates: Position[] = [];
  const yStart = player === 'playerA' ? 0 : BOARD_HEIGHT - TERRITORY_DEPTH;
  const yEnd = player === 'playerA' ? TERRITORY_DEPTH : BOARD_HEIGHT;

  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      if (!occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Prefer center-ish positions, closer to front
  candidates.sort((a, b) => {
    const aCenterDist = Math.abs(a.x - BOARD_WIDTH / 2);
    const bCenterDist = Math.abs(b.x - BOARD_WIDTH / 2);
    // For player A, prefer higher y (closer to enemy); for B, lower y
    const aFrontDist = player === 'playerA' ? (TERRITORY_DEPTH - 1 - a.y) : (a.y - (BOARD_HEIGHT - TERRITORY_DEPTH));
    const bFrontDist = player === 'playerA' ? (TERRITORY_DEPTH - 1 - b.y) : (b.y - (BOARD_HEIGHT - TERRITORY_DEPTH));
    return (aFrontDist - bFrontDist) || (aCenterDist - bCenterDist);
  });

  return candidates[0];
}

function findBestAttackTarget(attacker: SummonUnit, enemies: SummonUnit[]): SummonUnit | null {
  if (enemies.length === 0) return null;

  // Prefer low HP targets we can kill
  const weapon = attacker.card.equipment.weapon;
  if (!weapon) return null;

  const inRange = enemies.filter(e => {
    const dist = chebyshevDistance(attacker.position, e.position);
    return dist <= weapon.range;
  });

  if (inRange.length > 0) {
    // Sort by lowest HP first
    return inRange.sort((a, b) => a.currentHP - b.currentHP)[0];
  }

  // Return nearest enemy regardless of range (for movement planning)
  return enemies.sort((a, b) => {
    const distA = chebyshevDistance(attacker.position, a.position);
    const distB = chebyshevDistance(attacker.position, b.position);
    return distA - distB;
  })[0];
}

function findMoveTowardTarget(unit: SummonUnit, target: Position, state: GameStore): Position | null {
  if (unit.movementRemaining <= 0) return null;

  const occupied = new Set(
    state.board.summons.map(s => `${s.position.x},${s.position.y}`)
  );

  // Simple greedy: move as close as possible to target within movement range
  let bestPos: Position | null = null;
  let bestDist = chebyshevDistance(unit.position, target);

  const range = unit.movementRemaining;
  for (let dx = -range; dx <= range; dx++) {
    for (let dy = -range; dy <= range; dy++) {
      if (dx === 0 && dy === 0) continue;
      const moveDist = Math.max(Math.abs(dx), Math.abs(dy));
      if (moveDist > range) continue;

      const nx = unit.position.x + dx;
      const ny = unit.position.y + dy;

      if (nx < 0 || nx >= BOARD_WIDTH || ny < 0 || ny >= BOARD_HEIGHT) continue;
      if (occupied.has(`${nx},${ny}`)) continue;

      const distToTarget = chebyshevDistance({ x: nx, y: ny }, target);
      if (distToTarget < bestDist) {
        bestDist = distToTarget;
        bestPos = { x: nx, y: ny };
      }
    }
  }

  return bestPos;
}

function tryPlayActionCards(store: GameStore, player: PlayerId, fresh: () => GameStore): void {
  // Re-read state for each priority to get current hand/board
  const state = fresh();
  const hand = state.players[player].hand;
  const mySummons = state.board.summons.filter(s => s.owner === player);
  const enemies = state.board.summons.filter(s => s.owner !== player);

  // Priority 1: Emergency heal if any summon below 30% HP
  const criticalSummons = mySummons.filter(s => s.currentHP / s.maxHP < 0.3);
  if (criticalSummons.length > 0) {
    for (let i = hand.length - 1; i >= 0; i--) {
      if (fresh().gameOver) return;
      const card = hand[i];
      if (card.cardType !== 'action') continue;
      const ac = card as import('../types').ActionCard;
      if (ac.targetType === 'ally_summon' && ac.effects.some(e => e.type === 'heal')) {
        const target = criticalSummons.sort((a, b) => a.currentHP - b.currentHP)[0];
        store.playCard(i, [target.instanceId]);
        return;
      }
    }
  }

  // Priority 2: Play buff cards on summons before they attack
  for (let i = hand.length - 1; i >= 0; i--) {
    if (fresh().gameOver) return;
    const card = hand[i];
    if (card.cardType !== 'action') continue;
    const ac = card as import('../types').ActionCard;
    if (ac.targetType === 'ally_summon' && ac.effects.some(e => e.type === 'buff') && mySummons.length > 0) {
      const strongest = [...mySummons].sort((a, b) => b.calculatedStats.STR - a.calculatedStats.STR)[0];
      store.playCard(i, [strongest.instanceId]);
      return;
    }
  }

  // Priority 3: Play damage cards on lowest HP enemy
  if (enemies.length > 0) {
    for (let i = hand.length - 1; i >= 0; i--) {
      if (fresh().gameOver) return;
      const card = hand[i];
      if (card.cardType !== 'action') continue;
      const ac = card as import('../types').ActionCard;
      if (ac.targetType === 'enemy_summon' && ac.effects.some(e => e.type === 'damage')) {
        const target = [...enemies].sort((a, b) => a.currentHP - b.currentHP)[0];
        store.playCard(i, [target.instanceId]);
        return;
      }
    }
  }

  // Priority 4: Heal damaged allies (> 30% HP but not full)
  const damagedSummons = mySummons.filter(s => s.currentHP < s.maxHP);
  if (damagedSummons.length > 0) {
    for (let i = hand.length - 1; i >= 0; i--) {
      if (fresh().gameOver) return;
      const card = hand[i];
      if (card.cardType !== 'action') continue;
      const ac = card as import('../types').ActionCard;
      if (ac.targetType === 'ally_summon' && ac.effects.some(e => e.type === 'heal')) {
        const target = [...damagedSummons].sort((a, b) => (a.currentHP / a.maxHP) - (b.currentHP / b.maxHP))[0];
        store.playCard(i, [target.instanceId]);
        return;
      }
    }
  }

  // Priority 5: Play quest cards on eligible summons
  for (let i = hand.length - 1; i >= 0; i--) {
    if (fresh().gameOver) return;
    const card = hand[i];
    if (card.cardType !== 'quest') continue;
    if (mySummons.length > 0) {
      store.playCard(i, [mySummons[0].instanceId]);
      return;
    }
  }
}

function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
