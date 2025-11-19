const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { GameState, calculateStats, calculateDerivedStats, calculateDamage, rollHit, rollCrit } = require('../shared/game');
const { ROLES, WEAPONS } = require('../shared/cards');
const { PHASES, STARTING_LEVEL, VICTORY_POINTS_TO_WIN, VP_TIER1_DEFEAT } = require('../shared/constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Room management
const rooms = new Map();
const playerRooms = new Map(); // socketId -> roomId

class Room {
  constructor(roomId, hostSocketId) {
    this.roomId = roomId;
    this.hostSocketId = hostSocketId;
    this.players = [{ socketId: hostSocketId, ready: false }];
    this.gameState = null;
    this.started = false;
  }

  addPlayer(socketId) {
    if (this.players.length >= 2) return false;
    this.players.push({ socketId, ready: false });
    return true;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.socketId !== socketId);
  }

  setReady(socketId, ready) {
    const player = this.players.find(p => p.socketId === socketId);
    if (player) player.ready = ready;
  }

  canStart() {
    return this.players.length === 2 && this.players.every(p => p.ready);
  }

  startGame() {
    this.gameState = new GameState();
    this.started = true;
    this.initializeDecks();
    return this.gameState;
  }

  initializeDecks() {
    // Create simple starter decks for both players
    for (let i = 0; i < 2; i++) {
      const player = this.gameState.players[i];
      
      // Create 3 summon slots (Gignen species with different roles)
      player.summonSlots = [
        this.createSummonCard('gignen', 'warrior', 'heirloomSword'),
        this.createSummonCard('gignen', 'magician', 'apprenticesWand'),
        this.createSummonCard('gignen', 'scout', 'huntingBow')
      ];

      // Simple main deck with a few action cards
      player.mainDeck = [
        { id: 'sharpenedBlade', ...require('../shared/cards').ACTIONS.sharpenedBlade },
        { id: 'healingHands', ...require('../shared/cards').ACTIONS.healingHands },
        { id: 'blastBolt', ...require('../shared/cards').ACTIONS.blastBolt },
        { id: 'rush', ...require('../shared/cards').ACTIONS.rush }
      ];

      // Start with summon cards in hand
      player.hand = [...player.summonSlots];
    }
  }

  createSummonCard(species, roleId, weaponId) {
    const role = ROLES[roleId];
    const weapon = WEAPONS[weaponId];
    
    // Generate base stats (simplified - using fixed values for demo)
    const baseStats = {
      str: 10,
      end: 10,
      def: 10,
      int: 10,
      spi: 10,
      mdf: 10,
      spd: 10,
      acc: 10,
      lck: 10
    };

    // Growth rates (simplified)
    const growthRates = {
      str: 1.0,
      end: 1.0,
      def: 1.0,
      int: 1.0,
      spi: 1.0,
      mdf: 1.0,
      spd: 1.0,
      acc: 1.0,
      lck: 1.0
    };

    return {
      id: `summon_${species}_${roleId}_${Date.now()}_${Math.random()}`,
      type: 'summon',
      species,
      role: roleId,
      roleData: role,
      weapon: weaponId,
      weaponData: weapon,
      baseStats,
      growthRates,
      level: STARTING_LEVEL,
      currentHP: null // Will be set when summoned
    };
  }

  getGameState() {
    return this.gameState;
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Get list of available rooms
  socket.on('getRooms', () => {
    const roomList = Array.from(rooms.values())
      .filter(room => !room.started && room.players.length < 2)
      .map(room => ({
        roomId: room.roomId,
        playerCount: room.players.length
      }));
    socket.emit('roomList', roomList);
  });

  // Create a new room
  socket.on('createRoom', (roomId) => {
    if (rooms.has(roomId)) {
      socket.emit('error', 'Room already exists');
      return;
    }

    const room = new Room(roomId, socket.id);
    rooms.set(roomId, room);
    playerRooms.set(socket.id, roomId);
    
    socket.join(roomId);
    socket.emit('roomCreated', { roomId, playerId: 0 });
    console.log(`Room created: ${roomId}`);
  });

  // Join an existing room
  socket.on('joinRoom', (roomId) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.started) {
      socket.emit('error', 'Game already started');
      return;
    }

    if (!room.addPlayer(socket.id)) {
      socket.emit('error', 'Room is full');
      return;
    }

    playerRooms.set(socket.id, roomId);
    socket.join(roomId);
    
    const playerId = room.players.length - 1;
    socket.emit('roomJoined', { roomId, playerId });
    
    // Notify all players in room
    io.to(roomId).emit('playerJoined', {
      playerCount: room.players.length
    });
    
    console.log(`Player ${socket.id} joined room ${roomId}`);
  });

  // Player ready
  socket.on('playerReady', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.setReady(socket.id, true);
    
    io.to(roomId).emit('playerReadyUpdate', {
      readyCount: room.players.filter(p => p.ready).length,
      totalPlayers: room.players.length
    });

    // Start game if both players ready
    if (room.canStart()) {
      const gameState = room.startGame();
      io.to(roomId).emit('gameStart', {
        initialState: serializeGameState(gameState)
      });
      console.log(`Game started in room ${roomId}`);
    }
  });

  // Play summon card
  socket.on('playSummon', ({ cardId, x, y }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.started) return;

    const gameState = room.gameState;
    const playerId = room.players.findIndex(p => p.socketId === socket.id);
    
    if (playerId !== gameState.currentPlayer) {
      socket.emit('error', 'Not your turn');
      return;
    }

    if (gameState.phase !== PHASES.ACTION) {
      socket.emit('error', 'Wrong phase');
      return;
    }

    const player = gameState.players[playerId];
    if (player.hasPlayedSummon) {
      socket.emit('error', 'Already played summon this turn');
      return;
    }

    // Find card in hand
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      socket.emit('error', 'Card not in hand');
      return;
    }

    const card = player.hand[cardIndex];
    if (card.type !== 'summon') {
      socket.emit('error', 'Not a summon card');
      return;
    }

    // Validate position is in player's territory
    if (!gameState.board.isInTerritory(x, y, playerId)) {
      socket.emit('error', 'Must summon in your territory');
      return;
    }

    // Create unit and place on board
    const stats = calculateStats(
      card.baseStats,
      card.growthRates,
      card.level,
      card.roleData.statModifiers,
      [card.weaponData]
    );
    
    const derived = calculateDerivedStats(stats);
    
    const unit = {
      id: card.id,
      playerId,
      species: card.species,
      role: card.role,
      roleData: card.roleData,
      weapon: card.weaponData,
      level: card.level,
      stats,
      currentHP: derived.maxHP,
      maxHP: derived.maxHP,
      movement: derived.movement,
      baseToHit: derived.baseToHit,
      critChance: derived.critChance,
      hasAttacked: false,
      movementUsed: 0
    };

    if (!gameState.board.placeUnit(unit, x, y)) {
      socket.emit('error', 'Position occupied');
      return;
    }

    // Remove from hand
    player.hand.splice(cardIndex, 1);
    player.hasPlayedSummon = true;

    // Draw 3 cards (Summon Draws)
    for (let i = 0; i < 3; i++) {
      if (player.mainDeck.length === 0 && player.rechargePile.length > 0) {
        player.mainDeck = [...player.rechargePile];
        player.rechargePile = [];
        // Shuffle
        for (let j = player.mainDeck.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [player.mainDeck[j], player.mainDeck[k]] = [player.mainDeck[k], player.mainDeck[j]];
        }
      }
      
      if (player.mainDeck.length > 0) {
        player.hand.push(player.mainDeck.pop());
      }
    }

    // Broadcast update
    io.to(roomId).emit('gameUpdate', {
      action: 'summonPlayed',
      playerId,
      unit: serializeUnit(unit),
      state: serializeGameState(gameState)
    });
  });

  // Move unit
  socket.on('moveUnit', ({ unitId, toX, toY }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.started) return;

    const gameState = room.gameState;
    const playerId = room.players.findIndex(p => p.socketId === socket.id);
    
    if (playerId !== gameState.currentPlayer) {
      socket.emit('error', 'Not your turn');
      return;
    }

    // Find unit on board
    let unit = null;
    let fromX, fromY;
    for (const pos in gameState.board.units) {
      const u = gameState.board.units[pos];
      if (u.id === unitId && u.playerId === playerId) {
        unit = u;
        [fromX, fromY] = pos.split(',').map(Number);
        break;
      }
    }

    if (!unit) {
      socket.emit('error', 'Unit not found');
      return;
    }

    const distance = gameState.board.getDistance(fromX, fromY, toX, toY);
    const remainingMovement = unit.movement - unit.movementUsed;
    
    if (distance > remainingMovement) {
      socket.emit('error', 'Not enough movement');
      return;
    }

    if (!gameState.board.moveUnit(fromX, fromY, toX, toY)) {
      socket.emit('error', 'Invalid move');
      return;
    }

    unit.movementUsed += distance;

    io.to(roomId).emit('gameUpdate', {
      action: 'unitMoved',
      unitId,
      fromX,
      fromY,
      toX,
      toY,
      state: serializeGameState(gameState)
    });
  });

  // Attack with unit
  socket.on('attack', ({ attackerId, targetId }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.started) return;

    const gameState = room.gameState;
    const playerId = room.players.findIndex(p => p.socketId === socket.id);
    
    if (playerId !== gameState.currentPlayer) {
      socket.emit('error', 'Not your turn');
      return;
    }

    // Find attacker
    let attacker = null;
    for (const pos in gameState.board.units) {
      const u = gameState.board.units[pos];
      if (u.id === attackerId && u.playerId === playerId) {
        attacker = u;
        break;
      }
    }

    if (!attacker) {
      socket.emit('error', 'Attacker not found');
      return;
    }

    if (attacker.hasAttacked) {
      socket.emit('error', 'Unit already attacked');
      return;
    }

    // Find target
    let target = null;
    let targetX, targetY;
    for (const pos in gameState.board.units) {
      const u = gameState.board.units[pos];
      if (u.id === targetId && u.playerId !== playerId) {
        target = u;
        [targetX, targetY] = pos.split(',').map(Number);
        break;
      }
    }

    if (!target) {
      socket.emit('error', 'Target not found');
      return;
    }

    // Check range
    const distance = gameState.board.getDistance(attacker.x, attacker.y, targetX, targetY);
    if (distance > attacker.weapon.range) {
      socket.emit('error', 'Target out of range');
      return;
    }

    // Resolve attack
    const toHit = attacker.baseToHit;
    const didHit = rollHit(toHit);
    
    if (!didHit) {
      attacker.hasAttacked = true;
      io.to(roomId).emit('gameUpdate', {
        action: 'attackMissed',
        attackerId,
        targetId,
        state: serializeGameState(gameState)
      });
      return;
    }

    const didCrit = rollCrit(attacker.critChance);
    
    let damageType = 'physical';
    if (attacker.weapon.damageStat === 'int') damageType = 'magical';
    if (attacker.weapon.damageStat === 'hybrid') damageType = 'bow';
    
    const damage = calculateDamage(
      attacker.stats,
      target.stats,
      attacker.weapon.power,
      damageType,
      didCrit
    );

    target.currentHP -= damage;
    attacker.hasAttacked = true;

    const defeated = target.currentHP <= 0;
    
    if (defeated) {
      gameState.board.removeUnit(targetX, targetY);
      gameState.addVictoryPoints(playerId, VP_TIER1_DEFEAT);
    }

    io.to(roomId).emit('gameUpdate', {
      action: 'attackResolved',
      attackerId,
      targetId,
      damage,
      didCrit,
      defeated,
      newHP: target.currentHP,
      victoryPoints: gameState.players[playerId].victoryPoints,
      state: serializeGameState(gameState)
    });

    // Check for game over
    if (gameState.gameOver) {
      io.to(roomId).emit('gameOver', {
        winner: gameState.winner
      });
    }
  });

  // End turn
  socket.on('endTurn', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.started) return;

    const gameState = room.gameState;
    const playerId = room.players.findIndex(p => p.socketId === socket.id);
    
    if (playerId !== gameState.currentPlayer) {
      socket.emit('error', 'Not your turn');
      return;
    }

    if (gameState.phase !== PHASES.ACTION) {
      socket.emit('error', 'Cannot end turn during this phase');
      return;
    }

    // Process End Phase
    const player = gameState.players[playerId];
    
    // Discard down to hand limit
    while (player.hand.length > 6) {
      const card = player.hand.pop();
      player.rechargePile.push(card);
    }

    // Switch to next player's draw phase
    gameState.phase = PHASES.DRAW;
    gameState.switchPlayer();
    gameState.turnNumber++;
    gameState.getCurrentPlayer().hasPlayedSummon = false;

    // Reset units for new turn
    for (const pos in gameState.board.units) {
      const unit = gameState.board.units[pos];
      if (unit.playerId === gameState.currentPlayer) {
        unit.hasAttacked = false;
        unit.movementUsed = 0;
        // Level up
        unit.level++;
        const stats = calculateStats(
          unit.stats, // Using previous stats as base - simplified
          {}, // No additional growth in this simplified version
          unit.level,
          unit.roleData.statModifiers,
          [unit.weapon]
        );
        const derived = calculateDerivedStats(stats);
        const hpLost = unit.maxHP - unit.currentHP;
        unit.stats = stats;
        unit.maxHP = derived.maxHP;
        unit.currentHP = derived.maxHP - hpLost;
        unit.movement = derived.movement;
        unit.baseToHit = derived.baseToHit;
        unit.critChance = derived.critChance;
      }
    }

    // Draw phase for new player
    if (gameState.turnNumber > 1) {
      const currentPlayer = gameState.getCurrentPlayer();
      if (currentPlayer.mainDeck.length === 0 && currentPlayer.rechargePile.length > 0) {
        currentPlayer.mainDeck = [...currentPlayer.rechargePile];
        currentPlayer.rechargePile = [];
        // Shuffle
        for (let j = currentPlayer.mainDeck.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [currentPlayer.mainDeck[j], currentPlayer.mainDeck[k]] = [currentPlayer.mainDeck[k], currentPlayer.mainDeck[j]];
        }
      }
      
      if (currentPlayer.mainDeck.length > 0) {
        currentPlayer.hand.push(currentPlayer.mainDeck.pop());
      }
    }

    gameState.phase = PHASES.ACTION; // Move to action phase immediately for simplicity

    io.to(roomId).emit('gameUpdate', {
      action: 'turnEnded',
      newPlayer: gameState.currentPlayer,
      turnNumber: gameState.turnNumber,
      state: serializeGameState(gameState)
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    
    const roomId = playerRooms.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        
        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted`);
        } else {
          io.to(roomId).emit('playerLeft', {
            playerCount: room.players.length
          });
        }
      }
      playerRooms.delete(socket.id);
    }
  });
});

// Helper functions
function serializeGameState(gameState) {
  return {
    currentPlayer: gameState.currentPlayer,
    phase: gameState.phase,
    turnNumber: gameState.turnNumber,
    players: gameState.players.map(p => ({
      id: p.id,
      victoryPoints: p.victoryPoints,
      handSize: p.hand.length,
      deckSize: p.mainDeck.length
    })),
    board: serializeBoard(gameState.board),
    gameOver: gameState.gameOver,
    winner: gameState.winner
  };
}

function serializeBoard(board) {
  const units = [];
  for (const pos in board.units) {
    const unit = board.units[pos];
    units.push(serializeUnit(unit));
  }
  return { units };
}

function serializeUnit(unit) {
  return {
    id: unit.id,
    playerId: unit.playerId,
    x: unit.x,
    y: unit.y,
    species: unit.species,
    role: unit.role,
    level: unit.level,
    currentHP: unit.currentHP,
    maxHP: unit.maxHP,
    movement: unit.movement,
    movementUsed: unit.movementUsed,
    hasAttacked: unit.hasAttacked,
    weapon: unit.weapon,
    stats: unit.stats
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Summoner's Grid server running on port ${PORT}`);
});
