import { Game } from './game.js';
import { Card } from './cards.js';
import { SummonUnit } from './summon-unit.js';
import { Position } from './types.js';

export class UIController {
    private game: Game;
    private selectedCard: Card | undefined;
    private selectedUnit: SummonUnit | undefined;
    private gameMode: 'none' | 'card-play' | 'unit-select' | 'move-unit' | 'attack-unit' | 'place-building' | 'select-advance-target' = 'none';
    private buildingPlacement: any[] = [];

    constructor() {
        this.game = new Game();
        this.initializeUI();
        this.updateDisplay();
    }

    private initializeUI(): void {
        this.createGameBoard();
        this.setupEventListeners();
        this.setupModalEventListeners();
    }

    private createGameBoard(): void {
        const boardElement = document.getElementById('game-board');
        if (!boardElement) return;

        boardElement.innerHTML = '';

        for (let y = 11; y >= 0; y--) { // Top to bottom display
            for (let x = 0; x < 14; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.x = x.toString();
                cell.dataset.y = y.toString();

                // Add territory classes
                const territoryType = this.game.board.getTerritoryType(x, y);
                if (territoryType !== 'neutral') {
                    cell.classList.add(`${territoryType}-territory`);
                }

                // Add coordinate display
                cell.textContent = `${x},${y}`;

                cell.addEventListener('click', () => this.handleCellClick(x, y));
                boardElement.appendChild(cell);
            }
        }
    }

    private setupEventListeners(): void {
        const endPhaseBtn = document.getElementById('end-phase-btn');
        if (endPhaseBtn) {
            endPhaseBtn.addEventListener('click', () => {
                this.game.endCurrentPhase();
                this.updateDisplay();
            });
        }

        const passPriorityBtn = document.getElementById('pass-priority-btn');
        if (passPriorityBtn) {
            passPriorityBtn.addEventListener('click', () => {
                this.clearSelection();
                this.updateDisplay();
            });
        }

        const resetGameBtn = document.getElementById('reset-game-btn');
        if (resetGameBtn) {
            resetGameBtn.addEventListener('click', () => {
                this.game = new Game();
                this.clearSelection();
                this.createGameBoard();
                this.updateDisplay();
            });
        }
    }

    private handleCellClick(x: number, y: number): void {
        const position: Position = { x, y };
        const unit = this.game.board.getUnitAt(x, y);

        if (this.gameMode === 'card-play' && this.selectedCard) {
            this.handleCardTarget(position, unit);
        } else if (this.gameMode === 'move-unit' && this.selectedUnit) {
            this.handleUnitMove(position);
        } else if (this.gameMode === 'attack-unit' && this.selectedUnit) {
            this.handleUnitAttack(unit);
        } else if (this.gameMode === 'place-building' && this.selectedCard) {
            this.handleBuildingPlacement(position);
        } else if (this.gameMode === 'select-advance-target' && this.selectedCard && unit) {
            this.handleAdvanceTarget(unit);
        } else if (unit) {
            this.selectUnit(unit);
        } else {
            this.clearSelection();
        }

        this.updateDisplay();
    }

    private handleCardTarget(position: Position, unit?: SummonUnit): void {
        if (!this.selectedCard) return;

        const targets = unit ? [unit] : [position];
        const success = this.game.playCard(this.selectedCard, targets);

        if (success) {
            this.clearSelection();
        }
    }

    private handleUnitMove(position: Position): void {
        if (!this.selectedUnit) return;

        const success = this.game.moveUnit(this.selectedUnit, position);
        
        if (success) {
            this.clearSelection();
        }
    }

    private handleUnitAttack(target?: SummonUnit): void {
        if (!this.selectedUnit || !target) return;

        const success = this.game.attackUnit(this.selectedUnit, target);
        
        if (success) {
            this.clearSelection();
        }
    }

    private selectUnit(unit: SummonUnit): void {
        if (unit.owner !== this.game.currentPlayer.type) {
            // Can't select opponent units
            return;
        }

        this.selectedUnit = unit;
        this.selectedCard = undefined;
        this.gameMode = 'unit-select';
    }

    public updateDisplay(): void {
        this.updateGameInfo();
        this.updateBoard();
        this.updatePlayerAreas();
        this.updateFaceDownCards();
        this.updateBuildingsInPlay();
        this.updateQuestsInPlay();
        this.updateAdvanceDecks();
        this.updateRechargeZones();
        this.updateDiscardZones();
        this.updateGameLog();
        this.updateActionButtons();
        this.updateGameMode();
    }

    private updateGameInfo(): void {
        const turnInfo = document.getElementById('turn-info');
        if (turnInfo) {
            turnInfo.textContent = this.game.getCurrentPhaseDisplay();
        }

        const playerAVP = document.getElementById('player-a-vp');
        const playerBVP = document.getElementById('player-b-vp');
        if (playerAVP) playerAVP.textContent = this.game.playerA.victoryPoints.toString();
        if (playerBVP) playerBVP.textContent = this.game.playerB.victoryPoints.toString();
    }

    private updateBoard(): void {
        // Clear existing units
        document.querySelectorAll('.summon-unit').forEach(el => el.remove());
        document.querySelectorAll('.grid-cell').forEach(el => {
            el.classList.remove('selected', 'valid-move', 'valid-attack');
        });

        // Place units
        this.game.board.getAllUnits().forEach(unit => {
            this.createUnitElement(unit);
        });

        // Highlight selections and valid actions
        if (this.selectedUnit) {
            this.highlightSelectedUnit();
        }

        if (this.selectedCard && this.gameMode === 'card-play') {
            this.highlightCardTargets();
        }
    }

    private createUnitElement(unit: SummonUnit): void {
        const cell = document.querySelector(`[data-x="${unit.position.x}"][data-y="${unit.position.y}"]`);
        if (!cell) return;

        const unitElement = document.createElement('div');
        unitElement.className = `summon-unit ${unit.owner === 'B' ? 'player-b' : ''}`;
        unitElement.innerHTML = `
            <div class="summon-name">${unit.species.substring(0, 3)}</div>
            <div class="summon-level">L${unit.level}</div>
            <div class="summon-hp">${unit.currentHp}/${unit.maxHp}</div>
        `;

        unitElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleUnitClick(unit);
        });

        cell.appendChild(unitElement);
    }

    private handleUnitClick(unit: SummonUnit): void {
        if (this.gameMode === 'attack-unit' && this.selectedUnit) {
            this.handleUnitAttack(unit);
        } else if (unit.owner === this.game.currentPlayer.type) {
            this.selectUnit(unit);
            this.showUnitDetailModal(unit);
        } else {
            // Show opponent unit details (read-only)
            this.showUnitDetailModal(unit);
        }
        this.updateDisplay();
    }

    private highlightSelectedUnit(): void {
        if (!this.selectedUnit) return;

        const cell = document.querySelector(`[data-x="${this.selectedUnit.position.x}"][data-y="${this.selectedUnit.position.y}"]`);
        if (cell) {
            cell.classList.add('selected');
        }

        // Show action options
        if (this.game.currentPhase === 'Action') {
            this.showUnitActionButtons();
        }
    }

    private showUnitActionButtons(): void {
        if (!this.selectedUnit) return;

        // This is simplified - in a full implementation you'd show contextual buttons
        const moveBtn = document.createElement('button');
        moveBtn.textContent = 'Move';
        moveBtn.onclick = () => {
            this.gameMode = 'move-unit';
            this.highlightValidMoves();
            this.updateDisplay();
        };

        const attackBtn = document.createElement('button');
        attackBtn.textContent = 'Attack';
        attackBtn.onclick = () => {
            this.gameMode = 'attack-unit';
            this.highlightValidAttacks();
            this.updateDisplay();
        };

        // Add to action controls (simplified)
        // In a full implementation, these would be positioned near the selected unit
    }

    private highlightValidMoves(): void {
        if (!this.selectedUnit) return;

        const validPositions = this.game.getValidMovementPositions(this.selectedUnit);
        validPositions.forEach(pos => {
            const cell = document.querySelector(`[data-x="${pos.x}"][data-y="${pos.y}"]`);
            if (cell) {
                cell.classList.add('valid-move');
            }
        });
    }

    private highlightValidAttacks(): void {
        if (!this.selectedUnit) return;

        const validTargets = this.game.getValidAttackTargets(this.selectedUnit);
        validTargets.forEach(target => {
            const cell = document.querySelector(`[data-x="${target.position.x}"][data-y="${target.position.y}"]`);
            if (cell) {
                cell.classList.add('valid-attack');
            }
        });
    }

    private highlightCardTargets(): void {
        if (!this.selectedCard) return;

        const validTargets = this.selectedCard.getValidTargets(this.game, this.game.currentPlayer);
        
        // This is simplified - would need to handle different target types
        validTargets.forEach((target: any) => {
            if (target.x !== undefined && target.y !== undefined) {
                // Position target
                const cell = document.querySelector(`[data-x="${target.x}"][data-y="${target.y}"]`);
                if (cell) {
                    cell.classList.add('valid-move'); // Reuse for now
                }
            }
        });
    }

    private updatePlayerAreas(): void {
        this.updatePlayerHand('A');
        this.updatePlayerHand('B');
        this.updateDeckInfo('A');
        this.updateDeckInfo('B');
    }

    private updatePlayerHand(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const handElement = document.getElementById(`player-${playerType.toLowerCase()}-hand`);
        const countElement = document.getElementById(`player-${playerType.toLowerCase()}-hand-count`);

        if (!handElement || !countElement) return;

        handElement.innerHTML = '';
        countElement.textContent = player.hand.length.toString();

        // Only show current player's cards as playable
        const isCurrentPlayer = player === this.game.currentPlayer;

        player.hand.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            if (isCurrentPlayer && this.game.canPlayCard(card)) {
                cardElement.classList.add('playable');
            }

            if (card === this.selectedCard) {
                cardElement.classList.add('selected');
            }

            cardElement.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
            `;

            if (isCurrentPlayer) {
                cardElement.addEventListener('click', () => {
                    this.selectCard(card);
                    this.updateDisplay();
                });
            }

            handElement.appendChild(cardElement);
        });
    }

    private updateDeckInfo(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const deckCountElement = document.getElementById(`player-${playerType.toLowerCase()}-deck-count`);
        const rechargeCountElement = document.getElementById(`player-${playerType.toLowerCase()}-recharge-count`);
        const discardCountElement = document.getElementById(`player-${playerType.toLowerCase()}-discard-count`);

        if (deckCountElement) deckCountElement.textContent = player.getDeckSize().toString();
        if (rechargeCountElement) rechargeCountElement.textContent = player.getRechargeSize().toString();
        if (discardCountElement) discardCountElement.textContent = player.discardPile.length.toString();
    }

    private updateGameLog(): void {
        const logElement = document.getElementById('game-log');
        if (!logElement) return;

        logElement.innerHTML = '';
        
        // Show last 20 log entries
        const recentEntries = this.game.gameLog.slice(-20);
        recentEntries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            // Add player-specific styling
            if (entry.includes('Player A')) {
                logEntry.classList.add('player-a');
            } else if (entry.includes('Player B')) {
                logEntry.classList.add('player-b');
            } else {
                logEntry.classList.add('system');
            }
            
            logEntry.textContent = entry;
            logElement.appendChild(logEntry);
        });

        // Scroll to bottom
        logElement.scrollTop = logElement.scrollHeight;
    }

    private updateDiscardZones(): void {
        this.updateDiscardZone('A');
        this.updateDiscardZone('B');
    }

    private updateRechargeZones(): void {
        this.updateRechargeZone('A');
        this.updateRechargeZone('B');
    }

    private updateRechargeZone(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const rechargeElement = document.getElementById(`player-${playerType.toLowerCase()}-recharge`);

        if (!rechargeElement) return;

        rechargeElement.innerHTML = '';

        player.rechargePile.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            cardElement.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
            `;

            rechargeElement.appendChild(cardElement);
        });
    }

    private updateDiscardZone(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const discardElement = document.getElementById(`player-${playerType.toLowerCase()}-discard`);

        if (!discardElement) return;

        discardElement.innerHTML = '';

        player.discardPile.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            cardElement.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
            `;

            discardElement.appendChild(cardElement);
        });
    }

    private updateActionButtons(): void {
        const endPhaseBtn = document.getElementById('end-phase-btn') as HTMLButtonElement;
        const passPriorityBtn = document.getElementById('pass-priority-btn') as HTMLButtonElement;

        if (endPhaseBtn) {
            endPhaseBtn.disabled = this.game.isGameOver;
            endPhaseBtn.textContent = `End ${this.game.currentPhase} Phase`;
        }

        if (passPriorityBtn) {
            passPriorityBtn.disabled = this.game.isGameOver;
            passPriorityBtn.textContent = this.gameMode !== 'none' ? 'Cancel Action' : 'Pass Priority';
        }
    }

    // New methods for all card types and UI elements

    private updateFaceDownCards(): void {
        this.updatePlayerFaceDown('A');
        this.updatePlayerFaceDown('B');
    }

    private updatePlayerFaceDown(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const containerElement = document.getElementById(`player-${playerType.toLowerCase()}-face-down`);

        if (!containerElement) return;

        containerElement.innerHTML = '';

        player.faceDownCards.forEach((card: any) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card face-down';
            
            // Show actual card name to the owner (in demo, show to both since no real opponent)
            cardElement.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-type">Counter (Face Down)</div>
            `;
            cardElement.title = `Face-down counter card: ${card.name}`;
            containerElement.appendChild(cardElement);
        });
    }

    private updateBuildingsInPlay(): void {
        this.updatePlayerBuildings('A');
        this.updatePlayerBuildings('B');
    }

    private updatePlayerBuildings(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const containerElement = document.getElementById(`player-${playerType.toLowerCase()}-buildings`);

        if (!containerElement) return;

        containerElement.innerHTML = '';

        player.buildingsInPlay.forEach((building: any) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <div class="card-name">${building.name}</div>
                <div class="card-type">Building</div>
            `;
            containerElement.appendChild(cardElement);
        });
    }

    private updateQuestsInPlay(): void {
        this.updatePlayerQuests('A');
        this.updatePlayerQuests('B');
    }

    private updatePlayerQuests(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const containerElement = document.getElementById(`player-${playerType.toLowerCase()}-quests`);

        if (!containerElement) return;

        containerElement.innerHTML = '';

        // Get active quests for this player
        const playerQuests = Array.from(this.game.activeQuests.values()).filter(quest => quest.owner === player);

        playerQuests.forEach((quest: any) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <div class="card-name">${quest.card.name}</div>
                <div class="card-type">Quest ${quest.isPending ? '(Active)' : '(Complete)'}</div>
            `;
            
            // Add click handler for manual completion
            if (quest.isPending && player === this.game.currentPlayer) {
                cardElement.style.cursor = 'pointer';
                cardElement.style.border = '2px solid #4caf50';
                cardElement.addEventListener('click', () => {
                    if (confirm(`Complete quest "${quest.card.name}"?`)) {
                        this.game.completeQuest(quest.id);
                        this.updateDisplay();
                    }
                });
            }
            
            containerElement.appendChild(cardElement);
        });
    }

    private updateAdvanceDecks(): void {
        this.updatePlayerAdvance('A');
        this.updatePlayerAdvance('B');
    }

    private updatePlayerAdvance(playerType: 'A' | 'B'): void {
        const player = playerType === 'A' ? this.game.playerA : this.game.playerB;
        const containerElement = document.getElementById(`player-${playerType.toLowerCase()}-advance`);

        if (!containerElement) return;

        containerElement.innerHTML = '';

        const isCurrentPlayer = player === this.game.currentPlayer;

        player.advanceDeck.forEach((advance: any) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            
            const canPlay = isCurrentPlayer && player.canPlayAdvanceCard(advance);
            if (canPlay) {
                cardElement.classList.add('playable');
            }

            cardElement.innerHTML = `
                <div class="card-name">${advance.name}</div>
                <div class="card-type">Advance</div>
            `;

            if (isCurrentPlayer && canPlay) {
                cardElement.addEventListener('click', () => {
                    this.selectAdvanceCard(advance);
                });
            }

            containerElement.appendChild(cardElement);
        });
    }

    private updateGameMode(): void {
        const gameModeElement = document.getElementById('game-mode');
        if (!gameModeElement) return;

        let modeText = '';
        switch (this.gameMode) {
            case 'none':
                modeText = 'Select cards or units to interact';
                break;
            case 'card-play':
                modeText = `Playing: ${this.selectedCard?.name}`;
                break;
            case 'unit-select':
                modeText = `Selected: ${this.selectedUnit?.getDisplayName()}`;
                break;
            case 'move-unit':
                modeText = `Moving: ${this.selectedUnit?.getDisplayName()}`;
                break;
            case 'attack-unit':
                modeText = `Attacking with: ${this.selectedUnit?.getDisplayName()}`;
                break;
            case 'place-building':
                modeText = `Placing: ${this.selectedCard?.name}`;
                break;
            case 'select-advance-target':
                modeText = `Select target for: ${this.selectedCard?.name}`;
                break;
        }

        gameModeElement.textContent = modeText;
    }

    private selectAdvanceCard(advance: any): void {
        this.selectedCard = advance;
        this.gameMode = 'select-advance-target';
        this.updateDisplay();
    }

    private selectCard(card: Card): void {
        this.selectedCard = card;
        
        // Determine game mode based on card type
        if ((card as any).type === 'Building') {
            this.gameMode = 'place-building';
            this.buildingPlacement = [];
        } else if ((card as any).type === 'Counter') {
            // Counter cards are set face down
            this.playCounterCard(card);
            this.clearSelection();
            return;
        } else if ((card as any).type === 'Quest') {
            // Quest cards are played immediately
            this.playQuestCard(card);
            this.clearSelection();
            return;
        } else {
            this.gameMode = 'card-play';
        }
        
        this.updateDisplay();
    }

    private playCounterCard(card: Card): void {
        const player = this.game.currentPlayer;
        player.setFaceDownCard(card);
        this.game.addToLog(`${player.name} sets a counter card face down`);
    }

    private playQuestCard(card: Card): void {
        const player = this.game.currentPlayer;
        if (this.game.playQuestCard(player, card)) {
            this.game.addToLog(`${player.name} begins quest: ${card.name}`);
        }
    }

    private handleBuildingPlacement(position: Position): void {
        if (!this.selectedCard || this.gameMode !== 'place-building') return;

        const building = this.selectedCard as any;
        this.buildingPlacement.push(position);

        // Check if we have enough positions for the building
        const requiredPositions = building.dimensions.width * building.dimensions.height;
        if (this.buildingPlacement.length >= requiredPositions) {
            const player = this.game.currentPlayer;
            if (this.game.playBuildingCard(player, building, this.buildingPlacement)) {
                this.clearSelection();
            } else {
                this.buildingPlacement = [];
                this.game.addToLog('Invalid building placement');
            }
        }
    }

    private handleAdvanceTarget(target: SummonUnit): void {
        if (!this.selectedCard || this.gameMode !== 'select-advance-target') return;

        const player = this.game.currentPlayer;
        const advance = this.selectedCard as any;

        if (this.game.playAdvanceCard(player, advance, target)) {
            this.clearSelection();
        } else {
            this.game.addToLog('Invalid target for advance card');
        }
    }

    private clearSelection(): void {
        this.selectedCard = undefined;
        this.selectedUnit = undefined;
        this.gameMode = 'none';
        this.buildingPlacement = [];
    }

    private showUnitDetailModal(unit: SummonUnit): void {
        const modal = document.getElementById('unit-detail-modal');
        const title = document.getElementById('unit-modal-title');
        const content = document.getElementById('unit-modal-content');
        const actions = document.getElementById('unit-modal-actions');

        if (!modal || !title || !content || !actions) return;

        title.textContent = unit.getDisplayName();

        // Populate unit details
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <h4 style="margin-bottom: 10px; color: #4fc3f7;">Basic Info</h4>
                    <p><strong>Species:</strong> ${unit.species}</p>
                    <p><strong>Level:</strong> ${unit.level}</p>
                    <p><strong>Role:</strong> ${unit.roleCard.name}</p>
                    <p><strong>HP:</strong> ${unit.currentHp} / ${unit.maxHp}</p>
                    <p><strong>Position:</strong> (${unit.position.x}, ${unit.position.y})</p>
                </div>
                <div>
                    <h4 style="margin-bottom: 10px; color: #4fc3f7;">Status</h4>
                    <p><strong>Has Moved:</strong> ${unit.hasMovedThisTurn ? 'Yes' : 'No'}</p>
                    <p><strong>Has Attacked:</strong> ${unit.hasAttackedThisTurn ? 'Yes' : 'No'}</p>
                    <p><strong>Movement Used:</strong> ${unit.movementUsed}</p>
                    <p><strong>Owner:</strong> ${unit.owner}</p>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <h4 style="margin-bottom: 10px; color: #4fc3f7;">Stats</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 0.9em;">
                    <div><strong>STR:</strong> ${unit.getStats().str}</div>
                    <div><strong>END:</strong> ${unit.getStats().end}</div>
                    <div><strong>DEF:</strong> ${unit.getStats().def}</div>
                    <div><strong>INT:</strong> ${unit.getStats().int}</div>
                    <div><strong>SPI:</strong> ${unit.getStats().spi}</div>
                    <div><strong>MDF:</strong> ${unit.getStats().mdf}</div>
                    <div><strong>SPD:</strong> ${unit.getStats().spd}</div>
                    <div><strong>ACC:</strong> ${unit.getStats().acc}</div>
                </div>
            </div>
            ${unit.equipment.length > 0 ? `
                <div style="margin-top: 15px;">
                    <h4 style="margin-bottom: 10px; color: #4fc3f7;">Equipment</h4>
                    ${unit.equipment.map(eq => `<p><strong>${eq.name}</strong> (${eq.slot})</p>`).join('')}
                </div>
            ` : ''}
        `;

        // Populate action buttons
        actions.innerHTML = '';

        if (unit.owner === this.game.currentPlayer.type && this.game.currentPhase === 'Action') {
            if (!unit.hasMovedThisTurn) {
                const moveBtn = document.createElement('button');
                moveBtn.textContent = 'Move';
                moveBtn.className = 'btn';
                moveBtn.onclick = () => {
                    this.hideUnitDetailModal();
                    this.gameMode = 'move-unit';
                    this.highlightValidMoves();
                    this.updateDisplay();
                };
                actions.appendChild(moveBtn);
            }

            if (!unit.hasAttackedThisTurn) {
                const attackBtn = document.createElement('button');
                attackBtn.textContent = 'Attack';
                attackBtn.className = 'btn';
                attackBtn.onclick = () => {
                    this.hideUnitDetailModal();
                    this.gameMode = 'attack-unit';
                    this.highlightValidAttacks();
                    this.updateDisplay();
                };
                actions.appendChild(attackBtn);
            }
        }

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.className = 'btn';
        closeBtn.onclick = () => this.hideUnitDetailModal();
        actions.appendChild(closeBtn);

        modal.style.display = 'block';
    }

    private hideUnitDetailModal(): void {
        const modal = document.getElementById('unit-detail-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    private setupModalEventListeners(): void {
        const modal = document.getElementById('unit-detail-modal');
        const closeBtn = document.getElementById('close-unit-modal');
        
        if (closeBtn) {
            closeBtn.onclick = () => this.hideUnitDetailModal();
        }

        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.hideUnitDetailModal();
                }
            };
        }
    }
}