import { BOARD_WIDTH, BOARD_HEIGHT, TERRITORY_DEPTH } from '../types';
import type { Position, TerritoryOwner, SummonUnit } from '../types';
import { useGameStore } from '../store/gameStore';
import './GameBoard.css';

function getTerritoryOwner(y: number): TerritoryOwner {
  if (y < TERRITORY_DEPTH) return 'playerA';
  if (y >= BOARD_HEIGHT - TERRITORY_DEPTH) return 'playerB';
  return 'unclaimed';
}

interface CellProps {
  x: number;
  y: number;
  unit: SummonUnit | undefined;
  isSelected: boolean;
  isValidMove: boolean;
  isValidAttack: boolean;
  onClick: () => void;
}

function Cell({ x, y, unit, isSelected, isValidMove, isValidAttack, onClick }: CellProps) {
  const territory = getTerritoryOwner(y);

  const classes = [
    'board-cell',
    `territory-${territory}`,
    isSelected ? 'selected' : '',
    isValidMove ? 'valid-move' : '',
    isValidAttack ? 'valid-attack' : '',
    unit ? `unit-${unit.owner}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} title={`(${x},${y})`}>
      {unit && (
        <div className="unit-display">
          <div className="unit-name">{unit.card.name.slice(0, 8)}</div>
          <div className="unit-hp">
            {unit.currentHP}/{unit.maxHP}
          </div>
          <div className="unit-level">Lv{unit.level}</div>
          <div className="hp-bar">
            <div
              className="hp-fill"
              style={{ width: `${(unit.currentHP / unit.maxHP) * 100}%` }}
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

export function GameBoard() {
  const board = useGameStore(s => s.board);

  const getUnitAt = (x: number, y: number): SummonUnit | undefined => {
    return board.summons.find(s => s.position.x === x && s.position.y === y);
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
          isSelected={false}
          isValidMove={false}
          isValidAttack={false}
          onClick={() => {}}
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
