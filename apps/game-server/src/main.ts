import { WebSocketServer } from './lib/websocket-server.js';

/**
 * Game Server Entry Point
 * Implements WebSocket game server with Socket.IO for real-time multiplayer
 */
async function main() {
  const port = parseInt(process.env.PORT || '3001');
  
  console.log('[GameServer] Starting Summoner\'s Grid WebSocket Game Server...');
  
  const config = {
    port,
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:4200'],
      credentials: true,
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
  };

  const server = new WebSocketServer(config);

  try {
    await server.start();
    console.log(`[GameServer] WebSocket server running on port ${port}`);
    console.log('[GameServer] Ready to accept connections...');

    // Log server stats every 30 seconds
    setInterval(() => {
      const stats = server.getStats();
      console.log(`[GameServer] Stats - Players: ${stats.connectedPlayers}, Games: ${stats.activeSessions}, Queue: ${stats.queueSize}`);
    }, 30000);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[GameServer] Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('[GameServer] Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('[GameServer] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('[GameServer] Unhandled error:', error);
  process.exit(1);
});
