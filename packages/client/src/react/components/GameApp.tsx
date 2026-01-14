/**
 * GameApp - Root component for the Summoner's Grid game client.
 *
 * Combines game engine state management with Phaser rendering.
 * This is the main entry point for the game UI.
 */
import React, { useCallback, useEffect } from 'react';
import type {
  GameState,
  GameEngine,
  GameEvent,
  GridPosition,
} from '@summoners-grid/engine';
import { useGameEngine } from '../hooks/useGameEngine';
import { usePhaserGame } from '../hooks/usePhaserGame';

/**
 * Props for the GameApp component.
 */
export interface GameAppProps {
  /** Initial game state (optional - shows loading if not provided) */
  initialState?: GameState;
  /** Game engine implementation */
  engine: GameEngine;
  /** Container width */
  width?: number;
  /** Container height */
  height?: number;
  /** Called when a game event occurs */
  onGameEvent?: (event: GameEvent) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
  /** Called when state changes */
  onStateChange?: (state: GameState, events: GameEvent[]) => void;
}

/**
 * GameApp is the root component for the game client.
 * It manages game state and renders both the Phaser canvas and React UI overlay.
 */
export const GameApp: React.FC<GameAppProps> = ({
  initialState,
  engine,
  width = 800,
  height = 800,
  onGameEvent,
  onError,
  onStateChange,
}) => {
  // Game engine hook for state management
  const {
    state,
    isReady,
    dispatch,
    activePlayerIndex,
    currentPhase,
    winner,
    isGameOver,
  } = useGameEngine({
    initialState,
    engine,
    onEvent: onGameEvent,
    onError,
    onStateChange,
  });

  // Handle cell clicks from Phaser
  const handleCellClick = useCallback(
    (position: GridPosition, _territory: number | null) => {
      if (!isReady || !state) return;

      // Dispatch a SELECT action for the clicked cell
      dispatch({
        type: 'SELECT',
        entityId: `cell:${position.x},${position.y}`,
      });
    },
    [isReady, state, dispatch]
  );

  // Phaser game hook for rendering
  const { updateGameState, isReady: isPhaserReady } = usePhaserGame({
    containerId: 'phaser-container',
    width,
    height,
    onCellClick: handleCellClick,
  });

  // Sync game state to Phaser when it changes
  useEffect(() => {
    if (isPhaserReady && state) {
      updateGameState(state);
    }
  }, [isPhaserReady, state, updateGameState]);

  // Handle pass priority action
  const handlePassPriority = useCallback(() => {
    dispatch({ type: 'PASS_PRIORITY' });
  }, [dispatch]);

  // Handle concede action
  const handleConcede = useCallback(() => {
    dispatch({ type: 'CONCEDE' });
  }, [dispatch]);

  // Render loading state
  if (!isReady || !state) {
    return (
      <div className="game-app game-app--loading">
        <div
          id="phaser-container"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            margin: '0 auto',
            backgroundColor: '#1a1a1a',
          }}
        />
        <div className="game-app__loading">Loading game...</div>
      </div>
    );
  }

  // Render game over state
  if (isGameOver && winner !== null) {
    return (
      <div className="game-app game-app--game-over">
        <div
          id="phaser-container"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            margin: '0 auto',
          }}
        />
        <div className="game-app__overlay game-app__game-over">
          <h2>Game Over</h2>
          <p>Player {winner} Wins!</p>
        </div>
      </div>
    );
  }

  // Render setup phase
  if (state.gamePhase === 'setup') {
    return (
      <div className="game-app game-app--setup">
        <div
          id="phaser-container"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            margin: '0 auto',
          }}
        />
        <div className="game-app__overlay game-app__setup">
          <h2>Setup Phase</h2>
          <p>Preparing game...</p>
        </div>
      </div>
    );
  }

  // Render main game UI
  return (
    <div className="game-app">
      {/* Phaser canvas container */}
      <div
        id="phaser-container"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          margin: '0 auto',
        }}
      />

      {/* Game info overlay */}
      <div className="game-app__info">
        {/* Turn and phase info */}
        <div className="game-app__turn-info">
          <span className="game-app__turn">Turn {state.turn.number}</span>
          <span className="game-app__player">Player {activePlayerIndex}</span>
          <span className="game-app__phase">{currentPhase} Phase</span>
        </div>

        {/* Victory points */}
        <div className="game-app__vp-info">
          <span className="game-app__vp game-app__vp--player0">
            P0: {state.players[0].victoryPoints} VP
          </span>
          <span className="game-app__vp game-app__vp--player1">
            P1: {state.players[1].victoryPoints} VP
          </span>
        </div>

        {/* Pending prompt */}
        {state.pendingPrompt && (
          <div className="game-app__prompt">
            <p>Select a target for {state.pendingPrompt.prompt.type}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="game-app__actions">
        <button
          className="game-app__action-btn game-app__action-btn--pass"
          onClick={handlePassPriority}
        >
          Pass Priority
        </button>
        <button
          className="game-app__action-btn game-app__action-btn--concede"
          onClick={handleConcede}
        >
          Concede
        </button>
      </div>
    </div>
  );
};
