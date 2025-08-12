import { Game } from './game.js';
import { Card } from './cards.js';
import { SummonUnit } from './summon-unit.js';
import { Position } from './types.js';

export class UIController {
    private game: Game;
    private selectedCard: Card | undefined;
    private selectedUnit: SummonUnit | undefined;
    private gameMode: 'none' | 'card-play' | 'unit-select' | 'move-unit' | 'attack-unit' = 'none';

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

    private selectCard(card: Card): void {
        this.selectedCard = card;
        this.selectedUnit = undefined;
        this.gameMode = 'card-play';
    }

    private clearSelection(): void {
        this.selectedCard = undefined;
        this.selectedUnit = undefined;
        this.gameMode = 'none';
    }

    public updateDisplay(): void {
        this.updateGameInfo();
        this.updateBoard();
        this.updatePlayerAreas();
        this.updateGameLog();
        this.updateActionButtons();
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
}