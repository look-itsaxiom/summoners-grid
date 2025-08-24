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
import { GameManager, ClientGameState } from '../game/GameManager';
import { authService } from '../services/auth-service';

interface GameComponentProps {
  className?: string;
}

export const GameComponent: React.FC<GameComponentProps> = ({ 
  className = '' 
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [isGameReady, setIsGameReady] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<string>('disconnected');

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

        // Network-related event listeners
        gameManagerRef.current.addEventListener('networkConnected', () => {
          if (mounted) {
            setNetworkStatus('connected');
          }
        });

        gameManagerRef.current.addEventListener('networkAuthenticated', (event: any) => {
          if (mounted) {
            setNetworkStatus('authenticated');
            console.log('Game component: Authenticated with game server');
          }
        });

        gameManagerRef.current.addEventListener('networkDisconnected', (event: any) => {
          if (mounted) {
            setNetworkStatus('disconnected');
            console.log('Game component: Disconnected from game server');
          }
        });

        gameManagerRef.current.addEventListener('matchFound', (event: any) => {
          if (mounted) {
            console.log('Game component: Match found', event.detail);
            // Auto-accept matches for demo purposes
            gameManagerRef.current?.acceptMatch(event.detail.gameId);
          }
        });

        gameManagerRef.current.addEventListener('multiplayerGameStarted', (event: any) => {
          if (mounted) {
            console.log('Game component: Multiplayer game started');
            // Signal ready to start
            gameManagerRef.current?.playerReady();
          }
        });

        gameManagerRef.current.addEventListener('gameResized', (event: any) => {
          if (mounted) {
            console.log('Game component: Game resized', event.detail);
          }
        });

        // Initialize the game with the container element
        await gameManagerRef.current.initialize('phaser-game-container');

        // Connect to game server if user is authenticated
        const token = authService.getToken();
        if (token) {
          try {
            await gameManagerRef.current.connectToGameServer(token);
          } catch (error) {
            console.warn('Failed to connect to game server:', error);
            // Continue with single-player mode
          }
        }

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
        gameManagerRef.current.disconnectFromGameServer();
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

  // Network action handlers
  const handleNetworkAction = (action: string, data?: any) => {
    if (!gameManagerRef.current) return;

    switch (action) {
      case 'joinQueue':
        gameManagerRef.current.joinQueue('CASUAL', 'default-deck');
        break;
      case 'leaveQueue':
        gameManagerRef.current.leaveQueue();
        break;
      case 'surrender':
        gameManagerRef.current.surrender();
        break;
      default:
        console.warn('Unknown network action:', action);
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
            networkStatus={networkStatus}
            onCommand={handleCommand}
            onSceneSwitch={handleSceneSwitch}
            onNetworkAction={handleNetworkAction}
          />

          {/* Performance Debug Overlay (development only) */}
          {process.env.NODE_ENV === 'development' && performanceStats && (
            <PerformanceOverlay stats={performanceStats} gameState={gameState} />
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
  gameState: ClientGameState | null;
  networkStatus: string;
  onCommand: (command: string, data?: any) => void;
  onSceneSwitch: (sceneKey: string) => void;
  onNetworkAction: (action: string, data?: any) => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ 
  gameState, 
  networkStatus,
  onCommand, 
  onSceneSwitch,
  onNetworkAction 
}) => {
  if (!gameState) return null;

  const { connectionState, isMultiplayer } = gameState;

  return (
    <div className="game-hud-overlay">
      {/* Top HUD */}
      <div className="hud-top">
        <div className="game-info">
          <h4>Turn: {gameState.currentTurn.toUpperCase()}</h4>
          <p>Phase: {gameState.gamePhase.toUpperCase()}</p>
          {isMultiplayer && (
            <p>Mode: Multiplayer ({connectionState.playerRole || 'Spectator'})</p>
          )}
        </div>
        
        <div className="network-status">
          <span className={`status-indicator ${networkStatus}`}>
            {networkStatus === 'authenticated' ? '🟢' : networkStatus === 'connected' ? '🟡' : '🔴'}
          </span>
          <span>Network: {networkStatus}</span>
          {connectionState.latency > 0 && (
            <span> | Latency: {Math.round(connectionState.latency)}ms</span>
          )}
        </div>
        
        <div className="game-controls">
          <button 
            onClick={() => onCommand('nextPhase')}
            className="btn btn-primary"
            disabled={isMultiplayer && !connectionState.currentGameId}
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

      {/* Middle HUD - Multiplayer Controls */}
      {networkStatus === 'authenticated' && (
        <div className="hud-middle">
          <div className="multiplayer-controls">
            {!connectionState.isInQueue && !connectionState.currentGameId && (
              <button 
                onClick={() => onNetworkAction('joinQueue')}
                className="btn btn-success"
              >
                Join Queue
              </button>
            )}
            
            {connectionState.isInQueue && (
              <div className="queue-status">
                <span>🔍 Searching for opponent...</span>
                <button 
                  onClick={() => onNetworkAction('leaveQueue')}
                  className="btn btn-warning btn-small"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {connectionState.currentGameId && (
              <div className="game-status">
                <span>🎮 In Game: {connectionState.currentGameId.substring(0, 8)}...</span>
                <button 
                  onClick={() => onNetworkAction('surrender')}
                  className="btn btn-danger btn-small"
                >
                  Surrender
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
          {isMultiplayer && (
            <button 
              onClick={() => onCommand('requestSync')}
              className="btn btn-small"
            >
              Sync State
            </button>
          )}
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
  gameState: ClientGameState | null;
}

const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({ stats, gameState }) => {
  return (
    <div className="performance-overlay">
      <div className="performance-stats">
        <h5>Performance</h5>
        <p>FPS: {Math.round(stats.fps)}</p>
        <p>Renderer: {stats.renderType}</p>
        {stats.memory && (
          <p>Memory: {stats.memory.used}MB / {stats.memory.total}MB</p>
        )}
        {gameState?.isMultiplayer && (
          <>
            <h6>Network</h6>
            <p>Latency: {Math.round(gameState.connectionState.latency)}ms</p>
            <p>Game ID: {gameState.connectionState.currentGameId?.substring(0, 8) || 'None'}</p>
            <p>Role: {gameState.connectionState.playerRole || 'None'}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GameComponent;