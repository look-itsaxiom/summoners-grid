import { TurnPhase, PlayerType, Position } from './types.js';
import { Player } from './player.js';
import { GameBoard } from './game-board.js';
import { SummonUnit } from './summon-unit.js';
import { Card, SummonCard } from './cards.js';
import { createDemoSummons, createDemoActionCards, createDemoRoles } from './card-definitions.js';

export class Game {
    public playerA: Player;
    public playerB: Player;
    public board: GameBoard;
    public currentPlayer: Player;
    public currentPhase: TurnPhase;
    public turnNumber: number;
    public gameLog: string[] = [];
    public isGameOver: boolean = false;
    public winner?: Player;

    constructor() {
        this.board = new GameBoard();
        this.playerA = new Player('Player A', PlayerType.PlayerA);
        this.playerB = new Player('Player B', PlayerType.PlayerB);
        this.currentPlayer = this.playerA; // Player A goes first
        this.currentPhase = TurnPhase.Draw;
        this.turnNumber = 1;

        this.setupDemoGame();
    }

    private setupDemoGame(): void {
        // Create identical demo decks for both players
        this.setupPlayerDeck(this.playerA);
        this.setupPlayerDeck(this.playerB);

        // Draw initial hands (3 summon cards)
        const summons = createDemoSummons();
        this.playerA.hand = [...summons];
        this.playerB.hand = [...summons];

        // Add action cards to main deck
        const actionCards = createDemoActionCards();
        this.playerA.mainDeck = [...actionCards, ...actionCards]; // Duplicate for more cards
        this.playerB.mainDeck = [...actionCards, ...actionCards];

        // Shuffle main decks
        this.shuffleDeck(this.playerA.mainDeck);
        this.shuffleDeck(this.playerB.mainDeck);

        this.addToLog('Game started! Player A goes first.');
        
        // Skip first turn draw phase since it's turn 1
        if (this.turnNumber === 1) {
            this.advancePhase();
        }
    }

    private setupPlayerDeck(_player: Player): void {
        // This is simplified - in a real game, players would build their own decks
        // const roles = createDemoRoles();
        // Roles aren't added to decks directly, they're assigned during summon creation
    }

    private shuffleDeck(deck: Card[]): void {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    public createSummonUnit(summonCard: SummonCard, player: Player, position: Position): SummonUnit {
        // Assign appropriate role based on summon name
        const roles = createDemoRoles();
        let role = roles[0]; // default to warrior
        
        if (summonCard.name.includes('Magician')) {
            role = roles[1]; // magician
        } else if (summonCard.name.includes('Scout')) {
            role = roles[2]; // scout
        }

        const unitId = `${player.type}-${summonCard.id}-${Date.now()}`;
        const unit = new SummonUnit(unitId, summonCard, role, player.type, position);
        
        this.board.placeUnit(unit, position);
        return unit;
    }

    public getCurrentPhaseDisplay(): string {
        return `${this.currentPlayer.name}'s Turn - ${this.currentPhase} Phase`;
    }

    public advancePhase(): void {
        switch (this.currentPhase) {
            case TurnPhase.Draw:
                this.executeLevelPhase();
                break;
            case TurnPhase.Level:
                this.executeActionPhase();
                break;
            case TurnPhase.Action:
                this.executeEndPhase();
                break;
            case TurnPhase.End:
                this.nextTurn();
                break;
        }
    }

    private executeDrawPhase(): void {
        this.currentPhase = TurnPhase.Draw;
        
        if (this.turnNumber > 1) {
            const card = this.currentPlayer.drawCard();
            if (card) {
                this.addToLog(`${this.currentPlayer.name} draws a card`);
            } else {
                this.addToLog(`${this.currentPlayer.name} has no cards to draw`);
            }
        }
        
        // Automatically advance to level phase
        setTimeout(() => this.advancePhase(), 1000);
    }

    private executeLevelPhase(): void {
        this.currentPhase = TurnPhase.Level;
        
        if (this.currentPlayer.summonUnits.length > 0) {
            this.currentPlayer.levelUpSummons();
            this.addToLog(`${this.currentPlayer.name}'s summons level up!`);
        }
        
        // Automatically advance to action phase
        setTimeout(() => this.advancePhase(), 1000);
    }

    private executeActionPhase(): void {
        this.currentPhase = TurnPhase.Action;
        this.currentPlayer.resetTurnFlags();
        this.addToLog(`${this.currentPlayer.name} begins their Action Phase`);
    }

    private executeEndPhase(): void {
        this.currentPhase = TurnPhase.End;
        
        // Discard excess cards
        this.currentPlayer.discardExcessCards();
        
        // Check for victory
        this.checkVictoryConditions();
        
        if (!this.isGameOver) {
            // Automatically advance to next turn
            setTimeout(() => this.advancePhase(), 1000);
        }
    }

    private nextTurn(): void {
        this.currentPlayer = this.currentPlayer === this.playerA ? this.playerB : this.playerA;
        this.turnNumber++;
        this.executeDrawPhase();
    }

    public endCurrentPhase(): void {
        if (this.currentPhase === TurnPhase.Action) {
            this.advancePhase();
        }
    }

    public playCard(card: Card, targets?: any[]): boolean {
        if (this.currentPhase !== TurnPhase.Action) {
            this.addToLog('Can only play cards during Action Phase');
            return false;
        }

        if (!this.currentPlayer.hand.includes(card)) {
            this.addToLog('Card not in hand');
            return false;
        }

        if (!card.canPlay(this, this.currentPlayer)) {
            this.addToLog('Cannot play this card now');
            return false;
        }

        // Remove card from hand
        this.currentPlayer.playCard(card, targets);
        
        // Execute card effect
        card.play(this, this.currentPlayer, targets);
        
        return true;
    }

    public moveUnit(unit: SummonUnit, newPosition: Position): boolean {
        if (this.currentPhase !== TurnPhase.Action) {
            this.addToLog('Can only move units during Action Phase');
            return false;
        }

        if (unit.owner !== this.currentPlayer.type) {
            this.addToLog('Cannot move opponent units');
            return false;
        }

        if (!unit.canMoveTo(newPosition)) {
            this.addToLog('Unit cannot move that far');
            return false;
        }

        if (this.board.getUnitAt(newPosition.x, newPosition.y)) {
            this.addToLog('Position is occupied');
            return false;
        }

        // Perform the move
        this.board.moveUnit(unit, newPosition);
        unit.moveTo(newPosition);
        
        this.addToLog(`${unit.getDisplayName()} moves to (${newPosition.x}, ${newPosition.y})`);
        return true;
    }

    public attackUnit(attacker: SummonUnit, target: SummonUnit): boolean {
        if (this.currentPhase !== TurnPhase.Action) {
            this.addToLog('Can only attack during Action Phase');
            return false;
        }

        if (attacker.owner !== this.currentPlayer.type) {
            this.addToLog('Cannot attack with opponent units');
            return false;
        }

        if (attacker.owner === target.owner) {
            this.addToLog('Cannot attack your own units');
            return false;
        }

        if (!attacker.canAttackTarget(target)) {
            this.addToLog('Target is out of range or unit has already attacked');
            return false;
        }

        // Perform the attack
        const result = attacker.performAttack(target);
        
        if (result.hit && result.damage) {
            this.addToLog(`${attacker.getDisplayName()} attacks ${target.getDisplayName()} for ${result.damage.damage} damage${result.damage.isCritical ? ' (Critical!)' : ''}`);
            
            if (target.isDefeated()) {
                this.handleUnitDefeat(target);
            }
        } else {
            this.addToLog(`${attacker.getDisplayName()} misses ${target.getDisplayName()}`);
        }

        return result.hit;
    }

    private handleUnitDefeat(unit: SummonUnit): void {
        const owner = unit.owner === PlayerType.PlayerA ? this.playerA : this.playerB;
        const opponent = unit.owner === PlayerType.PlayerA ? this.playerB : this.playerA;
        
        // Award victory points
        const vpAwarded = unit.level >= 2 ? 2 : 1; // Tier 2+ units give 2 VP
        opponent.addVictoryPoints(vpAwarded);
        
        // Remove unit from board and player
        this.board.removeUnit(unit);
        owner.removeSummonUnit(unit);
        
        this.addToLog(`${unit.getDisplayName()} is defeated! ${opponent.name} gains ${vpAwarded} Victory Point${vpAwarded > 1 ? 's' : ''}`);
    }

    private checkVictoryConditions(): void {
        if (this.playerA.victoryPoints >= 3) {
            this.endGame(this.playerA);
        } else if (this.playerB.victoryPoints >= 3) {
            this.endGame(this.playerB);
        } else if (this.playerA.hasLost()) {
            this.endGame(this.playerB);
        } else if (this.playerB.hasLost()) {
            this.endGame(this.playerA);
        }
    }

    private endGame(winner: Player): void {
        this.isGameOver = true;
        this.winner = winner;
        this.addToLog(`Game Over! ${winner.name} wins!`);
    }

    public addToLog(message: string): void {
        this.gameLog.push(message);
        console.log(message); // Also log to console for debugging
    }

    public getValidMovementPositions(unit: SummonUnit): Position[] {
        return this.board.getValidMovementPositions(unit);
    }

    public getValidAttackTargets(unit: SummonUnit): SummonUnit[] {
        return this.board.getValidAttackTargets(unit);
    }

    public canPlayCard(card: Card): boolean {
        return this.currentPhase === TurnPhase.Action && card.canPlay(this, this.currentPlayer);
    }

    public getGameState(): any {
        return {
            currentPlayer: this.currentPlayer.name,
            currentPhase: this.currentPhase,
            turnNumber: this.turnNumber,
            playerAVP: this.playerA.victoryPoints,
            playerBVP: this.playerB.victoryPoints,
            isGameOver: this.isGameOver,
            winner: this.winner?.name
        };
    }
}