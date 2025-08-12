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
        this.updateGameLog();
        this.updateActionButtons();
        this.updateGameMode();
    }

    private updateGameInfo(): void {
        const turnIndicator = document.getElementById('turn-indicator');
        if (turnIndicator) {
            turnIndicator.textContent = this.game.getCurrentPhaseDisplay();
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

        if (deckCountElement) deckCountElement.textContent = player.getDeckSize().toString();
        if (rechargeCountElement) rechargeCountElement.textContent = player.getRechargeSize().toString();
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

    private updateActionButtons(): void {
        const endPhaseBtn = document.getElementById('end-phase-btn') as HTMLButtonElement;
        const passPriorityBtn = document.getElementById('pass-priority-btn') as HTMLButtonElement;

        if (endPhaseBtn) {
            endPhaseBtn.disabled = this.game.currentPhase !== 'Action' || this.game.isGameOver;
            endPhaseBtn.textContent = this.game.currentPhase === 'Action' ? 'End Action Phase' : 'End Phase';
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
            cardElement.innerHTML = `
                <div class="card-name">Face Down</div>
                <div class="card-type">Counter</div>
            `;
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

        player.questsInPlay.forEach((quest: any) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <div class="card-name">${quest.name}</div>
                <div class="card-type">Quest</div>
            `;
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
}