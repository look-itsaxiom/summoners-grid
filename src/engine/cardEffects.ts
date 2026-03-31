import type {
  Card,
  PlayerId,
} from '../types';
import { getRoleDefinition } from '../data/roles';
import type { GameStore } from '../store/gameStore';

/**
 * Check if a card's requirements are met for the given player.
 */
export function canPlayCard(card: Card, store: GameStore, player: PlayerId): boolean {
  if (card.cardType === 'summon') return false;

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
