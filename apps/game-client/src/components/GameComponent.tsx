/**
 * Game Component - React wrapper for Phaser.js integration
 * 
 * This component implements the hybrid Phaser + React architecture by:
 * - Mounting the Phaser game canvas in a React component
 * - Providing the bridge between React UI and Phaser game logic
 * - Managing the game lifecycle within React's component lifecycle
 * - Handling responsive design and window resize events
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameManager, GameState } from '../game/GameManager';

interface GameComponentProps {
  className?: string;
}

export const GameComponent: React.FC<GameComponentProps> = ({ 
  className = '' 
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const initializeGame = async () => {
      if (!gameContainerRef.current) return;

      try {
        // Create game manager instance
        gameManagerRef.current = new GameManager();

        // Set up event listeners
        gameManagerRef.current.addEventListener('gameInitialized', () => {
          if (mounted) {
            setIsGameReady(true);
            console.log('Game component: Phaser game initialized');
          }
        });

        gameManagerRef.current.addEventListener('gameStateChanged', (event: any) => {
          if (mounted) {
            setGameState(event.detail);
          }
        });

        gameManagerRef.current.addEventListener('gameResized', (event: any) => {
          if (mounted) {
            console.log('Game component: Game resized', event.detail);
          }
        });

        // Initialize the game with the container element
        await gameManagerRef.current.initialize('phaser-game-container');

      } catch (error) {
        console.error('Failed to initialize game:', error);
      }
    };

    initializeGame();

    // Performance monitoring (development only)
    const performanceInterval = setInterval(() => {
      if (gameManagerRef.current && mounted) {
        setPerformanceStats(gameManagerRef.current.getPerformanceStats());
      }
    }, 1000);

    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(performanceInterval);
      
      if (gameManagerRef.current) {
        gameManagerRef.current.destroy();
        gameManagerRef.current = null;
      }
    };
  }, []);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      // Allow some time for the DOM to update
      setTimeout(() => {
        if (gameManagerRef.current && gameContainerRef.current) {
          // The Phaser game will handle its own resize via the scale manager
          console.log('Window resized, Phaser will auto-adjust');
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Game command handlers for React UI interaction
  const handleCommand = (command: string, data?: any) => {
    if (gameManagerRef.current) {
      gameManagerRef.current.sendCommand(command, data);
    }
  };

  const handleSceneSwitch = (sceneKey: string) => {
    if (gameManagerRef.current) {
      gameManagerRef.current.switchScene(sceneKey);
    }
  };

  return (
    <div className={`game-component-container ${className}`}>
      {/* Phaser Game Container */}
      <div
        ref={gameContainerRef}
        id="phaser-game-container"
        className="phaser-game-canvas"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden'
        }}
      />

      {/* React UI Overlays */}
      {isGameReady && (
        <>
          {/* Game HUD Overlay */}
          <GameHUD 
            gameState={gameState}
            onCommand={handleCommand}
            onSceneSwitch={handleSceneSwitch}
          />

          {/* Performance Debug Overlay (development only) */}
          {process.env.NODE_ENV === 'development' && performanceStats && (
            <PerformanceOverlay stats={performanceStats} />
          )}
        </>
      )}

      {/* Loading Overlay */}
      {!isGameReady && (
        <div className="loading-overlay">
          <div className="loading-content">
            <h3>Initializing Summoner's Grid...</h3>
            <p>Setting up Phaser.js game client</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Game HUD Component - React overlay for game information and controls
 */
interface GameHUDProps {
  gameState: GameState | null;
  onCommand: (command: string, data?: any) => void;
  onSceneSwitch: (sceneKey: string) => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ 
  gameState, 
  onCommand, 
  onSceneSwitch 
}) => {
  if (!gameState) return null;

  return (
    <div className="game-hud-overlay">
      {/* Top HUD */}
      <div className="hud-top">
        <div className="game-info">
          <h4>Turn: {gameState.currentTurn.toUpperCase()}</h4>
          <p>Phase: {gameState.gamePhase.toUpperCase()}</p>
        </div>
        
        <div className="game-controls">
          <button 
            onClick={() => onCommand('nextPhase')}
            className="btn btn-primary"
          >
            Next Phase
          </button>
          <button 
            onClick={() => onSceneSwitch('MainMenuScene')}
            className="btn btn-secondary"
          >
            Main Menu
          </button>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="hud-bottom">
        <div className="board-info">
          <p>Board: {gameState.boardDimensions.width}×{gameState.boardDimensions.height}</p>
          {gameState.selectedTile && (
            <p>Selected: ({gameState.selectedTile.x}, {gameState.selectedTile.y})</p>
          )}
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => onCommand('clearHighlights')}
            className="btn btn-small"
          >
            Clear Highlights
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Performance Overlay Component - Development debugging information
 */
interface PerformanceOverlayProps {
  stats: any;
}

const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({ stats }) => {
  return (
    <div className="performance-overlay">
      <div className="performance-stats">
        <h5>Performance</h5>
        <p>FPS: {Math.round(stats.fps)}</p>
        <p>Renderer: {stats.renderType}</p>
        {stats.memory && (
          <p>Memory: {stats.memory.used}MB / {stats.memory.total}MB</p>
        )}
      </div>
    </div>
  );
};

export default GameComponent;