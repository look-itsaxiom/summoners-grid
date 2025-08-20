import { WebSocketServer, WebSocketServerConfig } from './websocket-server';
import { Client, io as ioClient } from 'socket.io-client';
import {
  AuthenticateMessage,
  AuthenticatedMessage,
  JoinQueueMessage,
  QueueStatusMessage,
  MatchFoundMessage,
  GameStartedMessage,
  PingMessage,
  PongMessage,
} from '@summoners-grid/shared-types';

describe('WebSocketServer', () => {
  let server: WebSocketServer;
  let client1: Client;
  let client2: Client;
  const port = 3999; // Use a different port for testing

  const config: WebSocketServerConfig = {
    port,
    cors: {
      origin: '*',
      credentials: false,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  };

  beforeAll(async () => {
    server = new WebSocketServer(config);
    await server.start();
  });

  afterAll(async () => {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    await server.stop();
  });

  beforeEach(() => {
    // Create fresh clients for each test
    client1 = ioClient(`http://localhost:${port}`);
    client2 = ioClient(`http://localhost:${port}`);
  });

  afterEach(() => {
    if (client1) {
      client1.disconnect();
      client1 = null as any;
    }
    if (client2) {
      client2.disconnect();
      client2 = null as any;
    }
  });

  describe('Connection and Authentication', () => {
    it('should accept client connections', (done) => {
      client1.on('connect', () => {
        expect(client1.connected).toBe(true);
        done();
      });
    });

    it('should authenticate players with valid tokens', (done) => {
      client1.on('connect', () => {
        const authMessage: AuthenticateMessage = {
          type: 'AUTHENTICATE',
          timestamp: new Date(),
          messageId: 'test-auth-1',
          token: 'valid-test-token-123',
        };

        client1.emit('AUTHENTICATE', authMessage);
      });

      client1.on('AUTHENTICATED', (message: AuthenticatedMessage) => {
        expect(message.type).toBe('AUTHENTICATED');
        expect(message.data.userId).toBeDefined();
        expect(message.data.username).toContain('Player_');
        expect(message.data.sessionId).toBeDefined();
        done();
      });
    });

    it('should handle ping/pong heartbeat', (done) => {
      client1.on('connect', () => {
        // First authenticate
        const authMessage: AuthenticateMessage = {
          type: 'AUTHENTICATE',
          timestamp: new Date(),
          messageId: 'test-auth-1',
          token: 'valid-test-token-123',
        };

        client1.emit('AUTHENTICATE', authMessage);
      });

      client1.on('AUTHENTICATED', () => {
        const pingMessage: PingMessage = {
          type: 'PING',
          timestamp: new Date(),
          messageId: 'test-ping-1',
        };

        client1.emit('PING', pingMessage);
      });

      client1.on('PONG', (message: PongMessage) => {
        expect(message.type).toBe('PONG');
        expect(message.timestamp).toBeDefined();
        expect(message.messageId).toBeDefined();
        done();
      });
    });
  });

  describe('Matchmaking', () => {
    it('should allow players to join the queue', (done) => {
      client1.on('connect', () => {
        // First authenticate
        const authMessage: AuthenticateMessage = {
          type: 'AUTHENTICATE',
          timestamp: new Date(),
          messageId: 'test-auth-1',
          token: 'valid-test-token-123',
        };

        client1.emit('AUTHENTICATE', authMessage);
      });

      client1.on('AUTHENTICATED', () => {
        const joinQueueMessage: JoinQueueMessage = {
          type: 'JOIN_QUEUE',
          timestamp: new Date(),
          messageId: 'test-join-queue-1',
          data: {
            gameMode: 'CASUAL',
            format: '3v3',
            deckId: 'test-deck-1',
          },
        };

        client1.emit('JOIN_QUEUE', joinQueueMessage);
      });

      client1.on('QUEUE_STATUS', (message: QueueStatusMessage) => {
        expect(message.type).toBe('QUEUE_STATUS');
        expect(message.data.inQueue).toBe(true);
        expect(message.data.queueTime).toBeDefined();
        expect(message.data.playersInQueue).toBeGreaterThan(0);
        done();
      });
    });

    it('should create matches when two players are in queue', (done) => {
      let player1Authenticated = false;
      let player2Authenticated = false;
      let matchFoundCount = 0;

      const checkBothAuthenticated = () => {
        if (player1Authenticated && player2Authenticated) {
          // Both players join queue
          const joinQueueMessage1: JoinQueueMessage = {
            type: 'JOIN_QUEUE',
            timestamp: new Date(),
            messageId: 'test-join-queue-1',
            data: {
              gameMode: 'CASUAL',
              format: '3v3',
              deckId: 'test-deck-1',
            },
          };

          const joinQueueMessage2: JoinQueueMessage = {
            type: 'JOIN_QUEUE',
            timestamp: new Date(),
            messageId: 'test-join-queue-2',
            data: {
              gameMode: 'CASUAL',
              format: '3v3',
              deckId: 'test-deck-2',
            },
          };

          client1.emit('JOIN_QUEUE', joinQueueMessage1);
          client2.emit('JOIN_QUEUE', joinQueueMessage2);
        }
      };

      // Set up client1
      client1.on('connect', () => {
        const authMessage: AuthenticateMessage = {
          type: 'AUTHENTICATE',
          timestamp: new Date(),
          messageId: 'test-auth-1',
          token: 'valid-test-token-player1',
        };
        client1.emit('AUTHENTICATE', authMessage);
      });

      client1.on('AUTHENTICATED', () => {
        player1Authenticated = true;
        checkBothAuthenticated();
      });

      // Set up client2
      client2.on('connect', () => {
        const authMessage: AuthenticateMessage = {
          type: 'AUTHENTICATE',
          timestamp: new Date(),
          messageId: 'test-auth-2',
          token: 'valid-test-token-player2',
        };
        client2.emit('AUTHENTICATE', authMessage);
      });

      client2.on('AUTHENTICATED', () => {
        player2Authenticated = true;
        checkBothAuthenticated();
      });

      // Listen for match found on both clients
      client1.on('MATCH_FOUND', (message: MatchFoundMessage) => {
        expect(message.type).toBe('MATCH_FOUND');
        expect(message.data.gameId).toBeDefined();
        expect(message.data.opponent).toBeDefined();
        expect(message.data.opponent.username).toContain('Player_');
        matchFoundCount++;
        if (matchFoundCount === 2) {
          done();
        }
      });

      client2.on('MATCH_FOUND', (message: MatchFoundMessage) => {
        expect(message.type).toBe('MATCH_FOUND');
        expect(message.data.gameId).toBeDefined();
        expect(message.data.opponent).toBeDefined();
        expect(message.data.opponent.username).toContain('Player_');
        matchFoundCount++;
        if (matchFoundCount === 2) {
          done();
        }
      });
    }, 10000); // Increase timeout for this complex test

    it('should allow players to leave the queue', (done) => {
      client1.on('connect', () => {
        // First authenticate
        const authMessage: AuthenticateMessage = {
          type: 'AUTHENTICATE',
          timestamp: new Date(),
          messageId: 'test-auth-1',
          token: 'valid-test-token-123',
        };

        client1.emit('AUTHENTICATE', authMessage);
      });

      let queueStatusCount = 0;

      client1.on('AUTHENTICATED', () => {
        const joinQueueMessage: JoinQueueMessage = {
          type: 'JOIN_QUEUE',
          timestamp: new Date(),
          messageId: 'test-join-queue-1',
          data: {
            gameMode: 'CASUAL',
            format: '3v3',
            deckId: 'test-deck-1',
          },
        };

        client1.emit('JOIN_QUEUE', joinQueueMessage);
      });

      client1.on('QUEUE_STATUS', (message: QueueStatusMessage) => {
        queueStatusCount++;
        
        if (queueStatusCount === 1) {
          // First status should be in queue
          expect(message.data.inQueue).toBe(true);
          
          // Now leave the queue
          client1.emit('LEAVE_QUEUE');
        } else if (queueStatusCount === 2) {
          // Second status should be out of queue
          expect(message.data.inQueue).toBe(false);
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid authentication', (done) => {
      client1.on('connect', () => {
        const authMessage: AuthenticateMessage = {
          type: 'AUTHENTICATE',
          timestamp: new Date(),
          messageId: 'test-auth-1',
          token: '', // Invalid empty token
        };

        client1.emit('AUTHENTICATE', authMessage);
      });

      client1.on('ERROR', (message: any) => {
        expect(message.type).toBe('ERROR');
        expect(message.error.code).toBeDefined();
        expect(message.error.message).toBeDefined();
        done();
      });

      client1.on('AUTHENTICATED', () => {
        // Should not reach here with empty token
        done(new Error('Should not authenticate with empty token'));
      });
    });

    it('should prevent joining queue without authentication', (done) => {
      client1.on('connect', () => {
        // Try to join queue without authentication
        const joinQueueMessage: JoinQueueMessage = {
          type: 'JOIN_QUEUE',
          timestamp: new Date(),
          messageId: 'test-join-queue-1',
          data: {
            gameMode: 'CASUAL',
            format: '3v3',
            deckId: 'test-deck-1',
          },
        };

        client1.emit('JOIN_QUEUE', joinQueueMessage);
      });

      client1.on('ERROR', (message: any) => {
        expect(message.type).toBe('ERROR');
        expect(message.error.code).toBe('NOT_AUTHENTICATED');
        done();
      });
    });
  });

  describe('Server Statistics', () => {
    it('should provide server statistics', () => {
      const stats = server.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.connectedPlayers).toBe('number');
      expect(typeof stats.activeSessions).toBe('number');
      expect(typeof stats.queueSize).toBe('number');
      expect(typeof stats.uptime).toBe('number');
    });
  });
});