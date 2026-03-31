import type {
  Card,
  ActionCard,
  SummonUnit,
  PlayerId,
  CardEffect,
} from '../types';
import {
  calculateMagicalDamage,
  calculatePhysicalMeleeDamage,
  calculateToHit,
  calculateCritChance,
  calculateHealing,
  rollHit,
  rollCrit,
  applyLevelUp,
} from './stats';
import { getRoleDefinition } from '../data/roles';
import type { GameStore } from '../store/gameStore';

export interface CardPlayResult {
  success: boolean;
  message: string;
}

/**
 * Check if a card's requirements are met for the given player.
 */
export function canPlayCard(card: Card, store: GameStore, player: PlayerId): boolean {
  if (card.cardType === 'summon') return false; // Summons use playSummon

  for (const req of card.requirements) {
    if (req.type === 'role') {
      const mySummons = store.board.summons.filter(s => s.owner === player);
      if (req.roleFamily) {
        const hasFamily = mySummons.some(s => {
          const role = getRoleDefinition(s.currentRole);
          return role.family === req.roleFamily;
        });
        if (!hasFamily) return false;
      }
      if (req.roleId) {
        const hasRole = mySummons.some(s => s.currentRole === req.roleId);
        if (!hasRole) return false;
      }
    }
    if (req.type === 'summon_in_play') {
      const mySummons = store.board.summons.filter(s => s.owner === player);
      if (mySummons.length === 0) return false;
    }
  }

  return true;
}

/**
 * Resolve an action card's effects on a target summon.
 */
export function resolveActionCard(
  card: ActionCard,
  caster: SummonUnit | null,
  target: SummonUnit,
  store: GameStore
): string[] {
  const messages: string[] = [];

  for (const effect of card.effects) {
    switch (effect.type) {
      case 'damage': {
        if (!caster) break;
        const result = resolveDamageEffect(effect, caster, target);
        messages.push(...result.messages);

        // Apply damage
        const newHP = target.currentHP - result.damage;
        updateSummonHP(store, target.instanceId, newHP);

        if (newHP <= 0) {
          messages.push(`${target.card.name} is defeated!`);
          handleDefeat(store, target);
        }
        break;
      }

      case 'heal': {
        if (!caster) break;
        const healResult = resolveHealEffect(effect, caster);
        messages.push(...healResult.messages);

        const healed = Math.min(
          target.maxHP - target.currentHP,
          healResult.amount
        );
        updateSummonHP(store, target.instanceId, target.currentHP + healed);
        messages.push(`${target.card.name} heals ${healed} HP (${target.currentHP + healed}/${target.maxHP})`);
        break;
      }

      case 'buff': {
        messages.push(`${target.card.name} gains ${effect.description}`);
        // Buff effects are tracked as status effects (simplified for now)
        break;
      }

      case 'debuff': {
        messages.push(`${target.card.name} is affected by ${effect.description}`);
        break;
      }

      case 'status': {
        messages.push(`${target.card.name}: ${effect.description}`);
        break;
      }

      case 'special': {
        // Handle specific special effects
        if (card.id === 'life_alchemy' && caster) {
          const damage = Math.floor(target.maxHP * 0.25);
          updateSummonHP(store, target.instanceId, target.currentHP - damage);
          messages.push(`${target.card.name} takes ${damage} damage from Life Alchemy`);

          // Heal caster
          const casterUnit = store.board.summons.find(s => s.instanceId === caster.instanceId);
          if (casterUnit) {
            const healed = Math.min(casterUnit.maxHP - casterUnit.currentHP, damage);
            updateSummonHP(store, casterUnit.instanceId, casterUnit.currentHP + healed);
            messages.push(`${casterUnit.card.name} heals ${healed} HP`);
          }
        }
        break;
      }

      case 'movement': {
        messages.push(`${effect.description}`);
        break;
      }
    }
  }

  return messages;
}

/**
 * Resolve a quest card's completion.
 */
export function resolveQuestCompletion(
  target: SummonUnit,
  levelsGained: number,
  store: GameStore
): string[] {
  const messages: string[] = [];

  if (levelsGained > 0) {
    const leveled = applyLevelUp(
      store.board.summons.find(s => s.instanceId === target.instanceId)!,
      levelsGained
    );

    const updatedSummons = store.board.summons.map(s =>
      s.instanceId === target.instanceId ? leveled : s
    );

    // Directly update board - caller should use store.set
    messages.push(
      `${target.card.name} gains ${levelsGained} levels (${target.level} → ${leveled.level})`
    );
  }

  return messages;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface DamageResult {
  damage: number;
  messages: string[];
}

function resolveDamageEffect(
  effect: CardEffect,
  caster: SummonUnit,
  target: SummonUnit
): DamageResult {
  const messages: string[] = [];

  // Hit check
  const baseAcc = 85; // Default for spell effects
  const toHitPct = calculateToHit(baseAcc, caster.calculatedStats.ACC);
  const hitResult = rollHit(toHitPct);
  messages.push(`To-hit: ${toHitPct.toFixed(1)}%, rolled ${hitResult.roll}`);

  if (!hitResult.hit) {
    messages.push('Missed!');
    return { damage: 0, messages };
  }

  // Crit check
  let isCrit = false;
  if (effect.canCrit) {
    const critPct = calculateCritChance(caster.calculatedStats.LCK);
    const critResult = rollCrit(critPct);
    isCrit = critResult.crit;
    if (isCrit) {
      messages.push(`CRITICAL HIT! (${critPct}%)`);
    }
  }

  // Damage calculation
  let damage = 0;
  const basePower = effect.basePower ?? 0;

  if (effect.damageType === 'magical') {
    damage = calculateMagicalDamage(
      caster.calculatedStats.INT,
      basePower,
      target.calculatedStats.MDF,
      isCrit
    );
  } else {
    damage = calculatePhysicalMeleeDamage(
      caster.calculatedStats.STR,
      basePower,
      target.calculatedStats.DEF,
      isCrit
    );
  }

  messages.push(`Deals ${damage} damage!`);
  return { damage, messages };
}

interface HealResult {
  amount: number;
  messages: string[];
}

function resolveHealEffect(effect: CardEffect, caster: SummonUnit): HealResult {
  const messages: string[] = [];

  let isCrit = false;
  if (effect.canCrit) {
    const critPct = calculateCritChance(caster.calculatedStats.LCK);
    const critResult = rollCrit(critPct);
    isCrit = critResult.crit;
    if (isCrit) {
      messages.push(`Critical heal! (${critPct}%)`);
    }
  }

  const basePower = effect.basePower ?? 0;
  const amount = calculateHealing(caster.calculatedStats.SPI, basePower, isCrit);

  return { amount, messages };
}

function updateSummonHP(store: GameStore, instanceId: string, newHP: number): void {
  const summons = store.board.summons.map(s =>
    s.instanceId === instanceId ? { ...s, currentHP: Math.max(0, newHP) } : s
  );
  // We can't directly set store here — the caller needs to handle this
  // For now, we mutate in-place (Zustand allows this in actions)
}

function handleDefeat(store: GameStore, target: SummonUnit): void {
  // This will be called from the store action
  // The actual VP award and removal happens in the store
}
