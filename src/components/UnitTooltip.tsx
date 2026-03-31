import type { SummonUnit } from '../types';
import { GROWTH_RATE_SYMBOLS } from '../types';
import { getRoleDefinition } from '../data/roles';
import { SpeciesArt } from './SpeciesArt';
import './UnitTooltip.css';

interface UnitTooltipProps {
  unit: SummonUnit;
  position: { x: number; y: number };
}

export function UnitTooltip({ unit, position }: UnitTooltipProps) {
  const role = getRoleDefinition(unit.currentRole);
  const stats = unit.calculatedStats;
  const weapon = unit.card.equipment.weapon;

  return (
    <div
      className="unit-tooltip"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="tooltip-header">
        <SpeciesArt species={unit.card.species} size="small" />
        <div>
          <div className="tooltip-name">
            {unit.isNamedSummon ? unit.namedSummonName : unit.card.name}
          </div>
          <div className="tooltip-role">
            Lv{unit.level} {role.name} ({role.family} T{role.tier})
          </div>
        </div>
      </div>

      <div className="tooltip-hp">
        HP: {unit.currentHP} / {unit.maxHP}
        <div className="tooltip-hp-bar">
          <div
            className="tooltip-hp-fill"
            style={{ width: `${(unit.currentHP / unit.maxHP) * 100}%` }}
          />
        </div>
      </div>

      <div className="tooltip-stats">
        <div className="stat-col">
          <span className="stat-item">STR <strong>{stats.STR}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.STR]}</sub></span>
          <span className="stat-item">END <strong>{stats.END}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.END]}</sub></span>
          <span className="stat-item">DEF <strong>{stats.DEF}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.DEF]}</sub></span>
        </div>
        <div className="stat-col">
          <span className="stat-item">INT <strong>{stats.INT}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.INT]}</sub></span>
          <span className="stat-item">SPI <strong>{stats.SPI}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.SPI]}</sub></span>
          <span className="stat-item">MDF <strong>{stats.MDF}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.MDF]}</sub></span>
        </div>
        <div className="stat-col">
          <span className="stat-item">SPD <strong>{stats.SPD}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.SPD]}</sub></span>
          <span className="stat-item">ACC <strong>{stats.ACC}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.ACC]}</sub></span>
          <span className="stat-item">LCK <strong>{stats.LCK}</strong> <sub>{GROWTH_RATE_SYMBOLS[unit.card.growthRates.LCK]}</sub></span>
        </div>
      </div>

      {weapon && (
        <div className="tooltip-weapon">
          {weapon.name} — Power: {weapon.basePower}, Range: {weapon.range}
        </div>
      )}

      <div className="tooltip-movement">
        Movement: {unit.movementRemaining} remaining
        {unit.hasAttacked && <span className="tooltip-attacked"> (attacked)</span>}
      </div>
    </div>
  );
}
