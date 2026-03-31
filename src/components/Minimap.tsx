import { BOARD_WIDTH, BOARD_HEIGHT, TERRITORY_DEPTH } from '../types';
import { useGameStore } from '../store/gameStore';
import './Minimap.css';

export function Minimap() {
  const { board } = useGameStore();
  const cellSize = 5;
  const width = BOARD_WIDTH * cellSize;
  const height = BOARD_HEIGHT * cellSize;

  return (
    <div className="minimap">
      <div className="minimap-label">Board Overview</div>
      <svg width={width} height={height} className="minimap-svg">
        {/* Territory backgrounds */}
        <rect x={0} y={(BOARD_HEIGHT - TERRITORY_DEPTH) * cellSize} width={width} height={TERRITORY_DEPTH * cellSize} fill="#1a2a1a" rx={1} />
        <rect x={0} y={0} width={width} height={TERRITORY_DEPTH * cellSize} fill="#2a1a1a" rx={1} />

        {/* Grid lines */}
        {Array.from({ length: BOARD_WIDTH + 1 }, (_, i) => (
          <line key={`v${i}`} x1={i * cellSize} y1={0} x2={i * cellSize} y2={height} stroke="#2a2a3a" strokeWidth={0.5} />
        ))}
        {Array.from({ length: BOARD_HEIGHT + 1 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * cellSize} x2={width} y2={i * cellSize} stroke="#2a2a3a" strokeWidth={0.5} />
        ))}

        {/* Buildings */}
        {board.buildings.map(b => (
          b.occupiedSpaces.map((s, i) => (
            <rect
              key={`${b.instanceId}-${i}`}
              x={s.x * cellSize}
              y={(BOARD_HEIGHT - 1 - s.y) * cellSize}
              width={cellSize}
              height={cellSize}
              fill={b.owner === 'playerA' ? '#2a4a2a' : '#4a2a2a'}
              stroke={b.owner === 'playerA' ? '#4a8' : '#a48'}
              strokeWidth={0.5}
            />
          ))
        ))}

        {/* Summon units */}
        {board.summons.map(s => (
          <circle
            key={s.instanceId}
            cx={s.position.x * cellSize + cellSize / 2}
            cy={(BOARD_HEIGHT - 1 - s.position.y) * cellSize + cellSize / 2}
            r={cellSize / 2 - 0.5}
            fill={s.owner === 'playerA' ? '#4af' : '#f44'}
            stroke="#fff"
            strokeWidth={0.3}
          />
        ))}
      </svg>
    </div>
  );
}
