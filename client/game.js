// Client-side game logic
const socket = io();

let currentRoom = null;
let playerId = null;
let gameState = null;
let selectedCard = null;
let selectedUnit = null;
let mode = null; // 'summon', 'move', 'attack'

// Screen management
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
}

// Lobby functions
function createRoom() {
  const roomName = document.getElementById('room-name-input').value.trim();
  if (!roomName) {
    showError('Please enter a room name');
    return;
  }
  socket.emit('createRoom', roomName);
}

function refreshRooms() {
  socket.emit('getRooms');
}

function joinRoom(roomId) {
  socket.emit('joinRoom', roomId);
}

function leaveRoom() {
  location.reload();
}

function setReady() {
  socket.emit('playerReady');
  document.getElementById('ready-btn').disabled = true;
  showStatus('Waiting for opponent to ready up...');
}

// Game functions
function initBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';

  // Create 14 rows (y), 12 columns (x)
  for (let y = 13; y >= 0; y--) {
    for (let x = 0; x < 12; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;

      // Mark territories
      if (y <= 2) {
        cell.classList.add('territory-0');
      } else if (y >= 11) {
        cell.classList.add('territory-1');
      }

      cell.addEventListener('click', () => handleCellClick(x, y));
      board.appendChild(cell);
    }
  }
}

function handleCellClick(x, y) {
  const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  
  if (mode === 'summon' && selectedCard) {
    // Try to summon at this position
    socket.emit('playSummon', {
      cardId: selectedCard.id,
      x: x,
      y: y
    });
    clearSelection();
  } else if (mode === 'playAction' && selectedCard) {
    // Try to play action card targeting unit at this position
    const target = getUnitAt(x, y);
    if (target) {
      socket.emit('playAction', {
        cardId: selectedCard.id,
        targetId: target.id
      });
      clearSelection();
    } else {
      showError('No unit at that position');
    }
  } else if (mode === 'move' && selectedUnit) {
    // Try to move unit to this position
    socket.emit('moveUnit', {
      unitId: selectedUnit.id,
      toX: x,
      toY: y
    });
    clearSelection();
  } else if (mode === 'attack' && selectedUnit) {
    // Try to attack unit at this position
    const target = getUnitAt(x, y);
    if (target && target.playerId !== playerId) {
      socket.emit('attack', {
        attackerId: selectedUnit.id,
        targetId: target.id
      });
      clearSelection();
    }
  } else {
    // Select unit at this position
    const unit = getUnitAt(x, y);
    if (unit && unit.playerId === playerId) {
      selectUnit(unit);
    }
  }
}

function selectCard(card) {
  selectedCard = card;
  selectedUnit = null;

  // Highlight card
  document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
  event.target.closest('.card').classList.add('selected');

  // Determine action based on card type
  if (card.type === 'summon') {
    mode = 'summon';
    highlightValidSummonPositions();
    showStatus('Select a position in your territory to summon');
  } else if (card.type === 'action') {
    mode = 'playAction';
    highlightValidActionTargets(card);
    showStatus(`Select a target for ${card.name || 'action card'}`);
  } else {
    showError(`Card type "${card.type}" not yet supported`);
    clearSelection();
  }
}

function selectUnit(unit) {
  selectedUnit = unit;
  selectedCard = null;

  // Clear previous selections
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('selected', 'valid-move', 'valid-target');
  });

  // Highlight unit position
  const cell = document.querySelector(`[data-x="${unit.x}"][data-y="${unit.y}"]`);
  if (cell) cell.classList.add('selected');

  // Update unit info display
  updateUnitInfo(unit);

  showStatus('Unit selected. Choose action: Move or Attack');
}

function highlightValidSummonPositions() {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('valid-move', 'valid-target');
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    // Check if in player's territory and empty
    const inTerritory = (playerId === 0 && y <= 2) || (playerId === 1 && y >= 11);
    const isEmpty = !getUnitAt(x, y);
    
    if (inTerritory && isEmpty) {
      cell.classList.add('valid-move');
    }
  });
}

function highlightValidActionTargets(card) {
  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('valid-move', 'valid-target');
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    const unit = getUnitAt(x, y);
    if (!unit) return;
    
    // Check if unit is a valid target based on card requirements
    let isValid = false;
    
    // Determine target validity based on card effect
    if (card.effect === 'heal' || card.effect === 'weaponPowerBonus' || card.effect === 'extraMovementAndAttack') {
      // These cards target friendly units
      isValid = unit.playerId === playerId;
    } else if (card.effect === 'immobilize' || card.id === 'blastBolt' || card.id === 'drainTouch') {
      // These cards can target any unit (or enemy units)
      isValid = true;
    } else {
      // Default: can target any unit
      isValid = true;
    }
    
    if (isValid) {
      cell.classList.add('valid-target');
    }
  });
}

function highlightValidMoves() {
  if (!selectedUnit) return;

  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('valid-move', 'valid-target');
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    const distance = Math.max(Math.abs(x - selectedUnit.x), Math.abs(y - selectedUnit.y));
    const remainingMovement = selectedUnit.movement - (selectedUnit.movementUsed || 0);
    
    if (distance <= remainingMovement && !getUnitAt(x, y)) {
      cell.classList.add('valid-move');
    }
  });

  mode = 'move';
  showStatus('Select a position to move to');
}

function highlightValidTargets() {
  if (!selectedUnit) return;

  document.querySelectorAll('.cell').forEach(cell => {
    cell.classList.remove('valid-move', 'valid-target');
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    
    const target = getUnitAt(x, y);
    if (!target || target.playerId === playerId) return;

    const distance = Math.max(Math.abs(x - selectedUnit.x), Math.abs(y - selectedUnit.y));
    
    if (distance <= selectedUnit.weapon.range) {
      cell.classList.add('valid-target');
    }
  });

  mode = 'attack';
  showStatus('Select an enemy unit to attack');
}

function clearSelection() {
  selectedCard = null;
  selectedUnit = null;
  mode = null;

  document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.cell').forEach(c => {
    c.classList.remove('selected', 'valid-move', 'valid-target');
  });

  document.getElementById('unit-info').innerHTML = '<p style="opacity: 0.7;">Select a unit to see details</p>';
  clearStatus();
}

function getUnitAt(x, y) {
  if (!gameState || !gameState.board) return null;
  return gameState.board.units.find(u => u.x === x && u.y === y);
}

function updateBoard() {
  if (!gameState || !gameState.board) return;

  // Clear existing units
  document.querySelectorAll('.unit').forEach(u => u.remove());

  // Place units
  gameState.board.units.forEach(unit => {
    const cell = document.querySelector(`[data-x="${unit.x}"][data-y="${unit.y}"]`);
    if (!cell) return;

    const unitDiv = document.createElement('div');
    unitDiv.className = `unit player-${unit.playerId}`;
    unitDiv.innerHTML = `
      <div class="unit-level">Lv${unit.level}</div>
      <div>${unit.role.charAt(0).toUpperCase()}</div>
      <div class="unit-hp">${unit.currentHP}/${unit.maxHP}</div>
    `;
    cell.appendChild(unitDiv);
  });
}

function updateHand(hand) {
  const handContainer = document.getElementById('hand-cards');
  handContainer.innerHTML = '';

  if (!hand || hand.length === 0) {
    handContainer.innerHTML = '<p style="opacity: 0.7;">No cards in hand</p>';
    return;
  }

  hand.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `
      <div class="card-name">${card.name || card.role || 'Card'}</div>
      <div class="card-type">${card.type}</div>
    `;
    cardDiv.addEventListener('click', () => selectCard(card));
    handContainer.appendChild(cardDiv);
  });
}

function updatePlayerInfo() {
  if (!gameState) return;

  const container = document.getElementById('player-info-area');
  container.innerHTML = '';

  gameState.players.forEach((player, i) => {
    const div = document.createElement('div');
    div.className = 'player-info';
    if (i === gameState.currentPlayer) {
      div.classList.add('active');
    }
    div.innerHTML = `
      <div>
        <strong>Player ${i + 1}</strong>
        ${i === playerId ? '(You)' : ''}
      </div>
      <div>
        VP: ${player.victoryPoints}/3<br>
        Cards: ${player.handSize}
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById('turn-number').textContent = gameState.turnNumber || 1;
  document.getElementById('phase').textContent = gameState.phase || 'action';
}

function updateUnitInfo(unit) {
  const container = document.getElementById('unit-info');
  container.innerHTML = `
    <p><strong>Level ${unit.level} ${unit.role}</strong></p>
    <p>HP: ${unit.currentHP}/${unit.maxHP}</p>
    <p>Movement: ${unit.movement - (unit.movementUsed || 0)}/${unit.movement}</p>
    <p>Weapon: ${unit.weapon.name}</p>
    <p>Range: ${unit.weapon.range}</p>
    ${unit.hasAttacked ? '<p style="color: #f44336;">Already attacked</p>' : ''}
    <div style="margin-top: 10px;">
      <button class="btn btn-secondary" onclick="highlightValidMoves()" ${unit.movementUsed >= unit.movement ? 'disabled' : ''}>Move</button>
      <button class="btn btn-danger" onclick="highlightValidTargets()" ${unit.hasAttacked ? 'disabled' : ''}>Attack</button>
    </div>
  `;
}

function endTurn() {
  if (gameState.currentPlayer !== playerId) {
    showError("It's not your turn!");
    return;
  }
  socket.emit('endTurn');
}

function showStatus(message) {
  const statusArea = document.getElementById('status-area');
  statusArea.innerHTML = `<div class="status-message">${message}</div>`;
}

function clearStatus() {
  document.getElementById('status-area').innerHTML = '';
}

function showError(message) {
  const errorArea = document.getElementById('error-area');
  errorArea.innerHTML = `<div class="error-message">${message}</div>`;
  setTimeout(() => {
    errorArea.innerHTML = '';
  }, 3000);
}

function returnToLobby() {
  location.reload();
}

// Socket event handlers
socket.on('roomList', (rooms) => {
  const roomList = document.getElementById('room-list');
  
  if (rooms.length === 0) {
    roomList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No rooms available. Create one to start!</p>';
    return;
  }

  roomList.innerHTML = '';
  rooms.forEach(room => {
    const div = document.createElement('div');
    div.className = 'room-item';
    div.innerHTML = `
      <div>
        <strong>${room.roomId}</strong><br>
        <small>Players: ${room.playerCount}/2</small>
      </div>
      <button class="btn btn-secondary" onclick="joinRoom('${room.roomId}')">Join</button>
    `;
    roomList.appendChild(div);
  });
});

socket.on('roomCreated', (data) => {
  currentRoom = data.roomId;
  playerId = data.playerId;
  document.getElementById('current-room-name').textContent = currentRoom;
  showScreen('waiting-screen');
});

socket.on('roomJoined', (data) => {
  currentRoom = data.roomId;
  playerId = data.playerId;
  document.getElementById('current-room-name').textContent = currentRoom;
  showScreen('waiting-screen');
});

socket.on('playerJoined', (data) => {
  document.getElementById('player-count').textContent = data.playerCount;
  if (data.playerCount === 2) {
    document.getElementById('waiting-status').textContent = 'Ready to start! Click Ready when you\'re prepared.';
  }
});

socket.on('playerReadyUpdate', (data) => {
  showStatus(`${data.readyCount}/${data.totalPlayers} players ready`);
});

socket.on('gameStart', (data) => {
  gameState = data.initialState;
  showScreen('game-screen');
  initBoard();
  updateBoard();
  updatePlayerInfo();
  
  // Get player's hand from the state
  const myPlayerData = gameState.players[playerId];
  if (myPlayerData && myPlayerData.hand) {
    updateHand(myPlayerData.hand);
  }
  
  if (gameState.currentPlayer === playerId) {
    showStatus("Your turn! Play a summon card to begin.");
  } else {
    showStatus("Opponent's turn. Please wait.");
  }
});

socket.on('gameUpdate', (data) => {
  gameState = data.state;
  updateBoard();
  updatePlayerInfo();
  
  // Update hand if provided
  const myPlayerData = gameState.players[playerId];
  if (myPlayerData && myPlayerData.hand) {
    updateHand(myPlayerData.hand);
  }
  
  clearSelection();

  switch(data.action) {
    case 'summonPlayed':
      if (data.playerId === playerId) {
        showStatus('Summon placed! You drew 3 cards.');
      }
      break;
    case 'actionPlayed':
      if (data.playerId === playerId) {
        const result = data.effectResult;
        if (result.didHit === false) {
          showStatus(`${data.cardName} missed!`);
        } else if (result.damage) {
          showStatus(`${data.cardName}: ${result.damage} damage${result.didCrit ? ' (CRIT!)' : ''}${result.defeated ? ' - Target defeated!' : ''}`);
        } else if (result.healing) {
          showStatus(`${data.cardName}: Healed ${result.healing} HP${result.didCrit ? ' (CRIT!)' : ''}`);
        } else {
          showStatus(`${data.cardName} activated!`);
        }
      }
      break;
    case 'unitMoved':
      showStatus('Unit moved');
      break;
    case 'attackResolved':
      const message = data.didCrit ? 'Critical hit!' : 'Attack hit!';
      showStatus(`${message} ${data.damage} damage dealt. ${data.defeated ? 'Unit defeated!' : ''}`);
      break;
    case 'attackMissed':
      showStatus('Attack missed!');
      break;
    case 'turnEnded':
      if (data.newPlayer === playerId) {
        showStatus("Your turn!");
      } else {
        showStatus("Opponent's turn. Please wait.");
      }
      break;
  }
});

socket.on('gameOver', (data) => {
  const modal = document.getElementById('game-over-modal');
  const winnerText = document.getElementById('winner-text');
  
  if (data.winner === playerId) {
    winnerText.textContent = '🎉 You won! 🎉';
  } else {
    winnerText.textContent = 'You lost. Better luck next time!';
  }
  
  modal.classList.add('active');
});

socket.on('playerLeft', (data) => {
  showError('Opponent disconnected');
  setTimeout(() => {
    returnToLobby();
  }, 2000);
});

socket.on('error', (message) => {
  showError(message);
});

// Initialize
refreshRooms();
