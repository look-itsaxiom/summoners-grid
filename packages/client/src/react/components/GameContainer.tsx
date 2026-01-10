/**
 * GameContainer - Main container component for the Phaser game.
 */
import React, { useCallback } from 'react';
import type { GridPosition } from '@summoners-grid/engine';
import { usePhaserGame } from '../hooks/usePhaserGame';

/** Container props */
export interface GameContainerProps {
  /** Container width */
  width?: number;
  /** Container height */
  height?: number;
  /** Called when cell is clicked */
  onCellClick?: (position: GridPosition, territory: number | null) => void;
}

/**
 * GameContainer renders the Phaser game canvas and manages its lifecycle.
 */
export const GameContainer: React.FC<GameContainerProps> = ({
  width = 800,
  height = 800,
  onCellClick,
}) => {
  const handleCellClick = useCallback(
    (position: GridPosition, territory: number | null) => {
      console.log(`Cell clicked: (${position.x}, ${position.y}), territory: ${territory}`);
      onCellClick?.(position, territory);
    },
    [onCellClick]
  );

  const { isReady } = usePhaserGame({
    containerId: 'phaser-container',
    width,
    height,
    onCellClick: handleCellClick,
  });

  return (
    <div className="game-container">
      <div
        id="phaser-container"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          margin: '0 auto',
        }}
      />
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#888',
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
};
