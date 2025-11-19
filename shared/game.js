// Game state and logic utilities

const { STARTING_LEVEL, BOARD_WIDTH, BOARD_HEIGHT, PHASES } = require('./constants');

class GameBoard {
  constructor() {
    this.width = BOARD_WIDTH;
    this.height = BOARD_HEIGHT;
    this.units = {}; // position key -> unit
  }

  getKey(x, y) {
    return `${x},${y}`;
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getUnit(x, y) {
    return this.units[this.getKey(x, y)] || null;
  }

  placeUnit(unit, x, y) {
    if (!this.isValidPosition(x, y)) return false;
    const key = this.getKey(x, y);
    if (this.units[key]) return false;
    
    this.units[key] = unit;
    unit.x = x;
    unit.y = y;
    return true;
  }

  moveUnit(fromX, fromY, toX, toY) {
    if (!this.isValidPosition(toX, toY)) return false;
    
    const fromKey = this.getKey(fromX, fromY);
    const toKey = this.getKey(toX, toY);
    
    const unit = this.units[fromKey];
    if (!unit) return false;
    if (this.units[toKey]) return false;
    
    delete this.units[fromKey];
    this.units[toKey] = unit;
    unit.x = toX;
    unit.y = toY;
    return true;
  }

  removeUnit(x, y) {
    const key = this.getKey(x, y);
    const unit = this.units[key];
    delete this.units[key];
    return unit;
  }

  getDistance(x1, y1, x2, y2) {
    return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  }

  isInTerritory(x, y, playerId) {
    // Player 1 territory: rows 0-2
    // Player 2 territory: rows 11-13
    if (playerId === 0) {
      return y >= 0 && y <= 2;
    } else {
      return y >= 11 && y <= 13;
    }
  }
}

class GameState {
  constructor() {
    this.board = new GameBoard();
    this.players = [
      this.createPlayer(0),
      this.createPlayer(1)
    ];
    this.currentPlayer = 0;
    this.phase = PHASES.DRAW;
    this.turnNumber = 0;
    this.stack = [];
    this.gameOver = false;
    this.winner = null;
  }

  createPlayer(id) {
    return {
      id,
      victoryPoints: 0,
      hand: [],
      mainDeck: [],
      rechargePile: [],
      discardPile: [],
      advanceDeck: [],
      summonSlots: [],
      hasPlayedSummon: false,
      facedDownCounters: []
    };
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayer];
  }

  getOpponentPlayer() {
    return this.players[1 - this.currentPlayer];
  }

  switchPlayer() {
    this.currentPlayer = 1 - this.currentPlayer;
  }

  advancePhase() {
    const phases = [PHASES.DRAW, PHASES.LEVEL, PHASES.ACTION, PHASES.END];
    const currentIndex = phases.indexOf(this.phase);
    
    if (currentIndex === phases.length - 1) {
      this.phase = PHASES.DRAW;
      this.switchPlayer();
      this.turnNumber++;
      this.getCurrentPlayer().hasPlayedSummon = false;
    } else {
      this.phase = phases[currentIndex + 1];
    }
  }

  addVictoryPoints(playerId, amount) {
    this.players[playerId].victoryPoints += amount;
    if (this.players[playerId].victoryPoints >= 3) {
      this.gameOver = true;
      this.winner = playerId;
    }
  }
}

// Calculate stats for a summon unit
function calculateStats(baseStats, growthRates, level, roleModifiers, equipment) {
  const stats = {};
  
  // Calculate base stats with growth
  for (const stat in baseStats) {
    const base = baseStats[stat];
    const growth = growthRates[stat] || 0;
    const levelBonus = Math.floor(level * growth);
    stats[stat] = base + levelBonus;
  }

  // Apply role modifiers
  for (const stat in roleModifiers) {
    if (stats[stat]) {
      stats[stat] = Math.floor(stats[stat] * roleModifiers[stat]);
    }
  }

  // Apply equipment bonuses
  if (equipment) {
    for (const item of equipment) {
      if (item && item.statBonuses) {
        for (const stat in item.statBonuses) {
          if (stats[stat] !== undefined) {
            stats[stat] += item.statBonuses[stat];
          }
        }
      }
    }
  }

  return stats;
}

// Calculate derived properties
function calculateDerivedStats(stats) {
  return {
    maxHP: 50 + Math.floor(Math.pow(stats.end, 1.5)),
    movement: 2 + Math.floor((stats.spd - 10) / 5),
    baseToHit: 90 + Math.floor(stats.acc / 10),
    critChance: Math.floor((stats.lck * 0.3375) + 1.65)
  };
}

// Calculate damage
function calculateDamage(attacker, target, weaponPower, damageType = 'physical', isCrit = false) {
  let damage = 0;
  const critMultiplier = isCrit ? 1.5 : 1.0;

  if (damageType === 'physical') {
    const ratio = attacker.str / target.def;
    damage = attacker.str * (1 + weaponPower / 100) * ratio * critMultiplier;
  } else if (damageType === 'magical') {
    const ratio = attacker.int / target.mdf;
    damage = attacker.int * (1 + weaponPower / 100) * ratio * critMultiplier;
  } else if (damageType === 'bow') {
    const avgStat = (attacker.str + attacker.acc) / 2;
    const ratio = attacker.str / target.def;
    damage = avgStat * (1 + weaponPower / 100) * ratio * critMultiplier;
  }

  return Math.floor(damage);
}

// Calculate healing
function calculateHealing(caster, basePower, isCrit = false) {
  const critMultiplier = isCrit ? 1.5 : 1.0;
  const healing = caster.spi * (1 + basePower / 100) * critMultiplier;
  return Math.floor(healing);
}

// Roll for hit
function rollHit(toHitPercent) {
  return Math.random() * 100 < toHitPercent;
}

// Roll for crit
function rollCrit(critChance) {
  return Math.random() * 100 < critChance;
}

module.exports = {
  GameBoard,
  GameState,
  calculateStats,
  calculateDerivedStats,
  calculateDamage,
  calculateHealing,
  rollHit,
  rollCrit
};
