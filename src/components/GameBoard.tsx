import { BOARD_WIDTH, BOARD_HEIGHT, TERRITORY_DEPTH } from '../types';
import type { TerritoryOwner, SummonUnit } from '../types';
import { useGameStore } from '../store/gameStore';
import './GameBoard.css';

function getTerritoryOwner(y: number): TerritoryOwner {
  if (y < TERRITORY_DEPTH) return 'playerA';
  if (y >= BOARD_HEIGHT - TERRITORY_DEPTH) return 'playerB';
  return 'unclaimed';
}

interface GameBoardProps {
  selectedCardIndex: number | null;
  selectedUnitId: string | null;
  pendingAdvance: number | null;
  onSelectUnit: (id: string | null) => void;
  onClearCard: () => void;
}

interface CellProps {
  x: number;
  y: number;
  unit: SummonUnit | undefined;
  isSelected: boolean;
  isValidMove: boolean;
  isValidAttack: boolean;
  isValidPlacement: boolean;
  isCardTarget: boolean;
  isAdvanceTarget: boolean;
  onClick: () => void;
}

function Cell({ x, y, unit, isSelected, isValidMove, isValidAttack, isValidPlacement, isCardTarget, isAdvanceTarget, onClick }: CellProps) {
  const territory = getTerritoryOwner(y);

  const classes = [
    'board-cell',
    `territory-${territory}`,
    isSelected ? 'selected' : '',
    isValidMove ? 'valid-move' : '',
    isValidAttack ? 'valid-attack' : '',
    isValidPlacement ? 'valid-placement' : '',
    isCardTarget ? 'card-target' : '',
    isAdvanceTarget ? 'advance-target' : '',
    unit ? `unit-${unit.owner}` : '',
    unit?.isNamedSummon ? 'named-summon' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hpPercent = unit ? (unit.currentHP / unit.maxHP) * 100 : 100;
  const hpClass = hpPercent <= 25 ? 'hp-low' : hpPercent <= 50 ? 'hp-medium' : '';
  const displayName = unit?.isNamedSummon && unit.namedSummonName
    ? unit.namedSummonName.split(',')[0] // Show first part of named summon name
    : unit?.card.name.slice(0, 10);

  return (
    <div className={classes} onClick={onClick} title={unit ? `${unit.isNamedSummon ? unit.namedSummonName : unit.card.name} — Lv${unit.level} ${unit.currentRole}\nHP: ${unit.currentHP}/${unit.maxHP}\nSTR:${unit.calculatedStats.STR} DEF:${unit.calculatedStats.DEF} INT:${unit.calculatedStats.INT}\nSPD:${unit.calculatedStats.SPD} ACC:${unit.calculatedStats.ACC} LCK:${unit.calculatedStats.LCK}\nWeapon: ${unit.card.equipment.weapon?.name ?? 'None'}` : `(${x},${y})`}>
      {unit && (
        <div className="unit-display">
          {unit.isNamedSummon && <span className="named-tag">NAMED</span>}
          <div className="unit-name">{displayName}</div>
          <div className="unit-hp">
            {unit.currentHP}/{unit.maxHP}
          </div>
          <div className="unit-level">Lv{unit.level} {unit.currentRole}</div>
          <div className={`hp-bar ${hpClass}`}>
            <div
              className="hp-fill"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      )}
      <span className="cell-coord">
        {x},{y}
      </span>
    </div>
  );
}

export function GameBoard({ selectedCardIndex, selectedUnitId, pendingAdvance, onSelectUnit, onClearCard }: GameBoardProps) {
  const { board, activePlayer, players, phase, playSummon, moveSummon, attackWithSummon, playCard, getPlayableAdvanceCards } = useGameStore();

  // Get valid advance targets
  const advanceTargetIds = new Set<string>();
  if (pendingAdvance !== null) {
    const playable = getPlayableAdvanceCards();
    const entry = playable.find(p => p.index === pendingAdvance);
    if (entry) {
      entry.validTargets.forEach(t => advanceTargetIds.add(t.instanceId));
    }
  }

  const selectedUnit = selectedUnitId
    ? board.summons.find(s => s.instanceId === selectedUnitId)
    : undefined;

  const getUnitAt = (x: number, y: number): SummonUnit | undefined => {
    return board.summons.find(s => s.position.x === x && s.position.y === y);
  };

  const isInTerritory = (_x: number, y: number): boolean => {
    if (activePlayer === 'playerA') return y < TERRITORY_DEPTH;
    return y >= BOARD_HEIGHT - TERRITORY_DEPTH;
  };

  const isValidPlacement = (x: number, y: number): boolean => {
    if (selectedCardIndex === null) return false;
    if (phase !== 'action') return false;
    const card = players[activePlayer].hand[selectedCardIndex];
    if (!card || card.cardType !== 'summon') return false;
    if (!isInTerritory(x, y)) return false;
    if (getUnitAt(x, y)) return false;
    return true;
  };

  const isValidMove = (x: number, y: number): boolean => {
    if (!selectedUnit) return false;
    if (selectedUnit.owner !== activePlayer) return false;
    if (phase !== 'action') return false;
    const dx = Math.abs(x - selectedUnit.position.x);
    const dy = Math.abs(y - selectedUnit.position.y);
    const distance = Math.max(dx, dy);
    if (distance === 0 || distance > selectedUnit.movementRemaining) return false;
    if (getUnitAt(x, y)) return false;
    return true;
  };

  const isValidAttackTarget = (x: number, y: number): boolean => {
    if (!selectedUnit) return false;
    if (selectedUnit.owner !== activePlayer) return false;
    if (selectedUnit.hasAttacked) return false;
    if (phase !== 'action') return false;
    const targetUnit = getUnitAt(x, y);
    if (!targetUnit || targetUnit.owner === activePlayer) return false;
    const weapon = selectedUnit.card.equipment.weapon;
    if (!weapon) return false;
    const dx = Math.abs(x - selectedUnit.position.x);
    const dy = Math.abs(y - selectedUnit.position.y);
    const distance = Math.max(dx, dy);
    return distance <= weapon.range;
  };

  // Check if selected card is an action/quest that targets a summon
  const isCardTargetable = (x: number, y: number): boolean => {
    if (selectedCardIndex === null || phase !== 'action') return false;
    const card = players[activePlayer].hand[selectedCardIndex];
    if (!card || card.cardType === 'summon') return false;
    const unitAtPos = getUnitAt(x, y);
    if (!unitAtPos) return false;

    // Action cards with ally/self targets need ally summons
    if (card.cardType === 'action') {
      const ac = card as import('../types').ActionCard;
      if (ac.targetType === 'ally_summon' || ac.targetType === 'self_summon') {
        return unitAtPos.owner === activePlayer;
      }
      if (ac.targetType === 'enemy_summon') {
        return unitAtPos.owner !== activePlayer;
      }
      if (ac.targetType === 'any_summon') return true;
    }
    if (card.cardType === 'quest') {
      return unitAtPos.owner === activePlayer;
    }
    return false;
  };

  const handleCellClick = (x: number, y: number) => {
    const unitAtCell = getUnitAt(x, y);

    // If advance card pending, click a valid target to advance it
    if (pendingAdvance !== null && unitAtCell && advanceTargetIds.has(unitAtCell.instanceId)) {
      onSelectUnit(unitAtCell.instanceId);
      return;
    }

    // If we have a non-summon card selected, try to play it on a target
    if (selectedCardIndex !== null && isCardTargetable(x, y) && unitAtCell) {
      playCard(selectedCardIndex, [unitAtCell.instanceId]);
      onClearCard();
      return;
    }

    // If we have a card selected, try to place it (summon)
    if (selectedCardIndex !== null && isValidPlacement(x, y)) {
      playSummon(selectedCardIndex, { x, y });
      onClearCard();
      return;
    }

    // If we have a unit selected and click a valid move
    if (selectedUnit && isValidMove(x, y)) {
      moveSummon(selectedUnit.instanceId, { x, y });
      return;
    }

    // If we have a unit selected and click an enemy in range
    if (selectedUnit && isValidAttackTarget(x, y)) {
      attackWithSummon(selectedUnit.instanceId, unitAtCell!.instanceId);
      return;
    }

    // Click a unit to select it
    if (unitAtCell && unitAtCell.owner === activePlayer && phase === 'action') {
      onSelectUnit(selectedUnitId === unitAtCell.instanceId ? null : unitAtCell.instanceId);
      onClearCard();
      return;
    }

    // Deselect
    onSelectUnit(null);
  };

  // Render rows from top (y=13) to bottom (y=0) so Player B's territory is at top
  const rows = [];
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    const cells = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const unit = getUnitAt(x, y);
      cells.push(
        <Cell
          key={`${x}-${y}`}
          x={x}
          y={y}
          unit={unit}
          isSelected={unit?.instanceId === selectedUnitId}
          isValidMove={isValidMove(x, y)}
          isValidAttack={isValidAttackTarget(x, y)}
          isValidPlacement={isValidPlacement(x, y)}
          isCardTarget={isCardTargetable(x, y)}
          isAdvanceTarget={unit ? advanceTargetIds.has(unit.instanceId) : false}
          onClick={() => handleCellClick(x, y)}
        />
      );
    }
    rows.push(
      <div key={y} className="board-row">
        <span className="row-label">{y}</span>
        {cells}
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="col-labels">
        <span className="row-label" />
        {Array.from({ length: BOARD_WIDTH }, (_, i) => (
          <span key={i} className="col-label">
            {i}
          </span>
        ))}
      </div>
      {rows}
    </div>
  );
}
