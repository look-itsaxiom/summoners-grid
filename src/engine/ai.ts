import type {
  PlayerId,
  SummonUnit,
  Position,
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

  // Execute level phase (store auto-advances to action phase)
  // Note: executeLevelPhase is called by advancePhase chain

  // Wait — the store advances phases automatically. After draw, it's level. After level, it's action.
  // We need to check current phase and execute accordingly.
  if (store.phase === 'level') {
    store.executeLevelPhase();
  }

  // Now in action phase — execute actions one at a time, re-reading state each time
  // 1. Play a summon
  if (!store.players[player].hasPlayedTurnSummon) {
    const hand = store.players[player].hand;
    const summonIndex = hand.findIndex(c => c.cardType === 'summon');
    if (summonIndex >= 0) {
      const pos = findBestSummonPlacement(store, player);
      if (pos) {
        store.playSummon(summonIndex, pos);
      }
    }
  }

  if (store.gameOver) return;

  // 1.4. Set counter/reaction cards face-down
  const hand = store.players[player].hand;
  for (let i = hand.length - 1; i >= 0; i--) {
    const card = hand[i];
    if (card.cardType === 'counter' || card.cardType === 'reaction') {
      store.setFaceDown(i);
      break; // Set one per turn
    }
  }

  if (store.gameOver) return;

  // 1.5. Try to play action cards from hand
  tryPlayActionCards(store, player);

  if (store.gameOver) return;

  // 1.7. Try to play advance cards
  const playableAdvances = store.getPlayableAdvanceCards();
  for (const entry of playableAdvances) {
    if (entry.validTargets.length > 0) {
      store.playAdvanceCard(entry.index, entry.validTargets[0].instanceId);
      break; // One advance per turn is enough
    }
  }

  if (store.gameOver) return;

  // 2. Move and attack with each summon
  const mySummonIds = store.board.summons
    .filter(s => s.owner === player)
    .map(s => s.instanceId);

  for (const unitId of mySummonIds) {
    if (store.gameOver) return;

    // Re-read unit from current state (may have been destroyed)
    const unit = store.board.summons.find(s => s.instanceId === unitId);
    if (!unit) continue;

    const enemies = store.board.summons.filter(s => s.owner !== player);
    const weapon = unit.card.equipment.weapon;

    if (enemies.length === 0) {
      // No enemies — advance toward board center
      const centerTarget: Position = {
        x: Math.floor(BOARD_WIDTH / 2),
        y: Math.floor(BOARD_HEIGHT / 2),
      };
      const moveTarget = findMoveTowardTarget(unit, centerTarget, store);
      if (moveTarget) store.moveSummon(unit.instanceId, moveTarget);
      continue;
    }

    if (!weapon) continue;

    // Find best target
    const target = findBestAttackTarget(unit, enemies);
    if (!target) continue;

    const dist = chebyshevDistance(unit.position, target.position);

    if (dist <= weapon.range && !unit.hasAttacked) {
      // In range — attack directly
      store.attackWithSummon(unit.instanceId, target.instanceId);
    } else {
      // Move toward target
      const moveTarget = findMoveTowardTarget(unit, target.position, store);
      if (moveTarget) {
        store.moveSummon(unit.instanceId, moveTarget);

        // Re-read unit after move and check if we can attack now
        const movedUnit = store.board.summons.find(s => s.instanceId === unitId);
        if (movedUnit && !movedUnit.hasAttacked) {
          const currentTarget = store.board.summons.find(s => s.instanceId === target.instanceId);
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

  if (store.gameOver) return;

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

function tryPlayActionCards(store: GameStore, player: PlayerId): void {
  const hand = store.players[player].hand;
  const mySummons = store.board.summons.filter(s => s.owner === player);
  const enemies = store.board.summons.filter(s => s.owner !== player);

  // Try to play damage cards on enemies
  for (let i = hand.length - 1; i >= 0; i--) {
    if (store.gameOver) return;

    const card = hand[i];
    if (card.cardType !== 'action') continue;

    const ac = card as import('../types').ActionCard;

    // Play damage cards on lowest HP enemy
    if (ac.targetType === 'enemy_summon' && enemies.length > 0) {
      const target = enemies.sort((a, b) => a.currentHP - b.currentHP)[0];
      const hasDamage = ac.effects.some(e => e.type === 'damage');
      if (hasDamage) {
        store.playCard(i, [target.instanceId]);
        return; // Play one card at a time to re-check state
      }
    }

    // Play heal cards on damaged allies
    if (ac.targetType === 'ally_summon' && mySummons.length > 0) {
      const hasHeal = ac.effects.some(e => e.type === 'heal');
      if (hasHeal) {
        const damaged = mySummons.filter(s => s.currentHP < s.maxHP);
        if (damaged.length > 0) {
          const target = damaged.sort((a, b) => (a.currentHP / a.maxHP) - (b.currentHP / b.maxHP))[0];
          store.playCard(i, [target.instanceId]);
          return;
        }
      }

      // Play buff cards on strongest ally
      const hasBuff = ac.effects.some(e => e.type === 'buff');
      if (hasBuff) {
        const strongest = mySummons.sort((a, b) => b.calculatedStats.STR - a.calculatedStats.STR)[0];
        store.playCard(i, [strongest.instanceId]);
        return;
      }
    }
  }

  // Try to play quest cards on eligible summons
  for (let i = hand.length - 1; i >= 0; i--) {
    if (store.gameOver) return;
    const card = hand[i];
    if (card.cardType !== 'quest') continue;

    // Play quest on first eligible ally summon
    if (mySummons.length > 0) {
      store.playCard(i, [mySummons[0].instanceId]);
      return;
    }
  }
}

function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
