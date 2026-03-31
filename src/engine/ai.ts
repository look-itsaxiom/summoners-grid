import type {
  PlayerId,
  SummonUnit,
  Position,
  Card,
  SummonCard,
} from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, TERRITORY_DEPTH } from '../types';
import type { GameStore } from '../store/gameStore';

/**
 * Basic AI opponent that:
 * 1. Places summons in territory
 * 2. Moves summons toward enemy
 * 3. Attacks when in range
 * 4. Plays action cards when possible
 */
export function executeAITurn(store: GameStore): void {
  const player = store.activePlayer;

  // Execute draw phase
  store.executeDrawPhase();

  // Execute level phase
  store.executeLevelPhase();

  // Action phase — play summon, move, attack
  const actions = planActions(store, player);
  for (const action of actions) {
    action();
    // Check if game ended
    if (store.gameOver) return;
  }

  // End turn
  store.endActionPhase();
}

function planActions(store: GameStore, player: PlayerId): Array<() => void> {
  const actions: Array<() => void> = [];
  const state = store;

  // 1. Play a summon if we haven't yet and have one in hand
  if (!state.players[player].hasPlayedTurnSummon) {
    const hand = state.players[player].hand;
    const summonIndex = hand.findIndex(c => c.cardType === 'summon');
    if (summonIndex >= 0) {
      const pos = findBestSummonPlacement(state, player);
      if (pos) {
        actions.push(() => store.playSummon(summonIndex, pos));
      }
    }
  }

  // 2. Move summons toward enemies and attack
  const mySummons = state.board.summons.filter(s => s.owner === player);
  const enemySummons = state.board.summons.filter(s => s.owner !== player);

  for (const unit of mySummons) {
    // Try to attack first if in range
    if (!unit.hasAttacked && enemySummons.length > 0) {
      const target = findBestAttackTarget(unit, enemySummons);
      if (target) {
        const weapon = unit.card.equipment.weapon;
        if (weapon) {
          const dist = chebyshevDistance(unit.position, target.position);
          if (dist <= weapon.range) {
            actions.push(() => store.attackWithSummon(unit.instanceId, target.instanceId));
          } else {
            // Move toward target, then attack if in range
            const moveTarget = findMoveTowardTarget(unit, target.position, state);
            if (moveTarget) {
              actions.push(() => store.moveSummon(unit.instanceId, moveTarget));
              // Check if we can attack after moving
              const newDist = chebyshevDistance(moveTarget, target.position);
              if (weapon && newDist <= weapon.range) {
                actions.push(() => store.attackWithSummon(unit.instanceId, target.instanceId));
              }
            }
          }
        }
      }
    } else if (enemySummons.length > 0) {
      // Just move toward nearest enemy
      const nearest = findNearestEnemy(unit, enemySummons);
      if (nearest) {
        const moveTarget = findMoveTowardTarget(unit, nearest.position, state);
        if (moveTarget) {
          actions.push(() => store.moveSummon(unit.instanceId, moveTarget));
        }
      }
    }
  }

  return actions;
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

function findNearestEnemy(unit: SummonUnit, enemies: SummonUnit[]): SummonUnit | null {
  if (enemies.length === 0) return null;
  return enemies.sort((a, b) => {
    return chebyshevDistance(unit.position, a.position) - chebyshevDistance(unit.position, b.position);
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

function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
