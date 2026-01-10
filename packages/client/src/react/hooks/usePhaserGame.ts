/**
 * usePhaserGame - React hook for managing the Phaser game lifecycle.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import type { GridPosition, GameState } from '@summoners-grid/engine';
import { getPhaserBridge, resetPhaserBridge, PhaserBridge } from '../../bridge';

/** Hook options */
export interface UsePhaserGameOptions {
  /** Container element ID */
  containerId?: string;
  /** Game width */
  width?: number;
  /** Game height */
  height?: number;
  /** Called when a cell is clicked */
  onCellClick?: (position: GridPosition, territory: number | null) => void;
}

/** Hook return value */
export interface UsePhaserGameResult {
  /** Whether the game is ready */
  isReady: boolean;
  /** The bridge instance */
  bridge: PhaserBridge | null;
  /** Update game state */
  updateGameState: (state: GameState) => void;
  /** Show movement range */
  showMovementRange: (positions: GridPosition[]) => void;
  /** Show attack targets */
  showAttackTargets: (positions: GridPosition[]) => void;
  /** Clear highlights */
  clearHighlights: () => void;
}

/**
 * React hook for managing the Phaser game instance.
 */
export function usePhaserGame(options: UsePhaserGameOptions = {}): UsePhaserGameResult {
  const {
    containerId = 'phaser-container',
    width = 800,
    height = 800,
    onCellClick,
  } = options;

  const [isReady, setIsReady] = useState(false);
  const bridgeRef = useRef<PhaserBridge | null>(null);
  const initializedRef = useRef(false);

  // Initialize Phaser game on mount
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    const bridge = getPhaserBridge();
    bridgeRef.current = bridge;

    // Set up event handlers
    bridge.setEventHandlers({
      onSceneReady: () => {
        setIsReady(true);
      },
      onCellClick: (position, territory) => {
        onCellClick?.(position, territory);
      },
    });

    // Initialize the game
    bridge.init({
      parent: containerId,
      width,
      height,
    });

    // Cleanup on unmount
    return () => {
      resetPhaserBridge();
      bridgeRef.current = null;
      initializedRef.current = false;
      setIsReady(false);
    };
  }, [containerId, width, height]);

  // Update onCellClick handler when it changes
  useEffect(() => {
    if (bridgeRef.current) {
      bridgeRef.current.setEventHandlers({
        onSceneReady: () => setIsReady(true),
        onCellClick,
      });
    }
  }, [onCellClick]);

  const updateGameState = useCallback((state: GameState) => {
    bridgeRef.current?.updateGameState(state);
  }, []);

  const showMovementRange = useCallback((positions: GridPosition[]) => {
    bridgeRef.current?.showMovementRange(positions);
  }, []);

  const showAttackTargets = useCallback((positions: GridPosition[]) => {
    bridgeRef.current?.showAttackTargets(positions);
  }, []);

  const clearHighlights = useCallback(() => {
    bridgeRef.current?.clearHighlights();
  }, []);

  return {
    isReady,
    bridge: bridgeRef.current,
    updateGameState,
    showMovementRange,
    showAttackTargets,
    clearHighlights,
  };
}
