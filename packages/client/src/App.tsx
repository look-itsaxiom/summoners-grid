/**
 * App - Root React component for Summoner's Grid client.
 */
import React, { useCallback, useState } from 'react';
import type { GridPosition } from '@summoners-grid/engine';
import { GameContainer } from './react/components';

/** Selected cell info for display */
interface SelectedCell {
  position: GridPosition;
  territory: number | null;
}

/**
 * App is the main React component that wraps the game.
 */
export function App() {
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const handleCellClick = useCallback(
    (position: GridPosition, territory: number | null) => {
      setSelectedCell({ position, territory });
    },
    []
  );

  const getTerritoryLabel = (territory: number | null): string => {
    if (territory === 0) return 'Player 0';
    if (territory === 1) return 'Player 1';
    return 'Unclaimed';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          Summoner's Grid
        </h1>
        <span style={{ color: '#666', fontSize: '12px' }}>Prototype v0.0.1</span>
      </header>

      <main
        style={{
          display: 'flex',
          gap: '24px',
          padding: '24px',
        }}
      >
        <div style={{ flex: 1 }}>
          <GameContainer
            width={800}
            height={800}
            onCellClick={handleCellClick}
          />
        </div>

        <aside
          style={{
            width: '250px',
            backgroundColor: '#1a1a1a',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>
            Debug Info
          </h2>

          <div style={{ fontSize: '14px', color: '#aaa' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>
              Selected Cell
            </h3>
            {selectedCell ? (
              <div
                style={{
                  backgroundColor: '#222',
                  padding: '12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}
              >
                <div>
                  Position: ({selectedCell.position.x}, {selectedCell.position.y})
                </div>
                <div>Territory: {getTerritoryLabel(selectedCell.territory)}</div>
              </div>
            ) : (
              <div style={{ color: '#666', fontStyle: 'italic' }}>
                Click a cell to select
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', fontSize: '14px', color: '#aaa' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '13px', color: '#888' }}>
              Board Info
            </h3>
            <div
              style={{
                backgroundColor: '#222',
                padding: '12px',
                borderRadius: '4px',
                fontFamily: 'monospace',
              }}
            >
              <div>Grid: 12 x 14</div>
              <div>Coordinate origin: (0,0) at bottom-left</div>
              <div>Player 0 territory: rows 0-2</div>
              <div>Player 1 territory: rows 11-13</div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
