import { TurnPhase, PlayerType, Position } from './types.js';
import { Player } from './player.js';
import { GameBoard } from './game-board.js';
import { SummonUnit } from './summon-unit.js';
import { Card, SummonCard } from './cards.js';
import { createDemoSummons, createDemoActionCards, createDemoRoles, createDemoCounterCards, createDemoBuildingCards, createDemoQuestCards, createDemoAdvanceCards } from './card-definitions.js';
import { EffectStack, GameEvent } from './effect-stack.js';

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
    public effectStack: EffectStack;
    public buildingEffects: Map<string, any> = new Map();
    public scheduledEvents: Map<number, any[]> = new Map();

    constructor() {
        this.board = new GameBoard();
        this.playerA = new Player('Player A', PlayerType.PlayerA);
        this.playerB = new Player('Player B', PlayerType.PlayerB);
        this.currentPlayer = this.playerA; // Player A goes first
        this.currentPhase = TurnPhase.Draw;
        this.turnNumber = 1;
        this.effectStack = new EffectStack(this);

        this.setupDemoGame();
    }

    private setupDemoGame(): void {
        // Create comprehensive demo decks for both players
        this.setupPlayerDeck(this.playerA);
        this.setupPlayerDeck(this.playerB);

        // Draw initial hands (only 3 summon slot cards)
        const summons = createDemoSummons();
        this.playerA.hand = [...summons];
        this.playerB.hand = [...summons];

        // Add all card types to main deck
        const actionCards = createDemoActionCards();
        const counterCards = createDemoCounterCards();
        const buildingCards = createDemoBuildingCards();
        const questCards = createDemoQuestCards();
        
        this.playerA.mainDeck = [...actionCards, ...counterCards, ...buildingCards, ...questCards];
        this.playerB.mainDeck = [...actionCards, ...counterCards, ...buildingCards, ...questCards];
        
        // Add advance cards to advance deck
        const advanceCards = createDemoAdvanceCards();
        this.playerA.advanceDeck = [...advanceCards];
        this.playerB.advanceDeck = [...advanceCards];

        // Shuffle main decks
        this.shuffleDeck(this.playerA.mainDeck);
        this.shuffleDeck(this.playerB.mainDeck);

        this.addToLog('Game started! Player A goes first.');
        this.addToLog('Demo includes all card types: Summon, Action, Counter, Building, Quest, and Advance cards.');
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
        
        this.addToLog(`${this.currentPlayer.name} - Draw Phase. Click "End Phase" to continue.`);
    }

    private executeLevelPhase(): void {
        this.currentPhase = TurnPhase.Level;
        
        if (this.currentPlayer.summonUnits.length > 0) {
            this.currentPlayer.levelUpSummons();
            this.addToLog(`${this.currentPlayer.name}'s summons level up!`);
        }
        
        this.addToLog(`${this.currentPlayer.name} - Level Phase. Click "End Phase" to continue.`);
    }

    private executeActionPhase(): void {
        this.currentPhase = TurnPhase.Action;
        this.currentPlayer.resetTurnFlags();
        this.addToLog(`${this.currentPlayer.name} begins their Action Phase`);
    }

    private executeEndPhase(): void {
        this.currentPhase = TurnPhase.End;
        
        // Process scheduled events for this turn
        this.processScheduledEvents();
        
        // Discard excess cards
        this.currentPlayer.discardExcessCards();
        
        // Check for victory
        this.checkVictoryConditions();
        
        if (!this.isGameOver) {
            this.addToLog(`${this.currentPlayer.name} - End Phase. Click "End Phase" to pass turn to next player.`);
        }
    }

    private nextTurn(): void {
        this.currentPlayer = this.currentPlayer === this.playerA ? this.playerB : this.playerA;
        this.turnNumber++;
        this.executeDrawPhase();
    }

    public endCurrentPhase(): void {
        this.advancePhase();
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
        
        // Create defeat event for the effect stack to handle
        const defeatEvent: GameEvent = {
            type: 'summon-defeated',
            source: null, // Could be the attacking unit
            target: unit,
            data: { 
                target: unit, 
                attacker: { owner: opponent } // Simplified for demo
            }
        };
        
        this.effectStack.addEvent(defeatEvent);
        
        // Remove unit from board and player
        this.board.removeUnit(unit);
        owner.removeSummonUnit(unit);
        
        // Move defeated summon to removed from game pile
        owner.moveToRemoved(unit as any);
        
        this.addToLog(`${unit.getDisplayName()} is defeated!`);
        
        // Process the event through the stack
        this.processEffectStack();
    }

    private checkVictoryConditions(): void {
        if (this.playerA.victoryPoints >= 3) {
            this.endGame(this.playerA);
        } else if (this.playerB.victoryPoints >= 3) {
            this.endGame(this.playerB);
        }
        // For demo purposes, don't check hasLost() conditions to allow full gameplay testing
        // In real game, these would be uncommented:
        // else if (this.playerA.hasLost()) {
        //     this.endGame(this.playerB);
        // } else if (this.playerB.hasLost()) {
        //     this.endGame(this.playerA);
        // }
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

    // Process the effect stack
    public async processEffectStack(): Promise<void> {
        if (this.effectStack.hasEffects()) {
            await this.effectStack.resolveStack();
        }
    }

    // Methods for building effects and scheduled events
    public addBuildingEffect(buildingId: string, controller: Player, effect: (unit: any) => void): void {
        this.buildingEffects.set(buildingId, { controller, effect });
    }

    public isUnitInBuilding(unit: any, buildingId: string): boolean {
        const buildingEffect = this.buildingEffects.get(buildingId);
        if (!buildingEffect) return false;
        
        // Check if unit is in building's spaces
        const building = buildingEffect.controller.buildingsInPlay.find((b: any) => b.id === buildingId);
        if (!building || !building.positions) return false;
        
        return building.positions.some((pos: any) => 
            pos.x === unit.position.x && pos.y === unit.position.y
        );
    }

    public scheduleBuildingDestruction(buildingId: string, controller: Player, turn: number, callback: (destroyedUnits: any[]) => void): void {
        if (!this.scheduledEvents.has(turn)) {
            this.scheduledEvents.set(turn, []);
        }
        
        this.scheduledEvents.get(turn)!.push({
            type: 'building-destruction',
            buildingId,
            controller,
            callback
        });
    }

    // Process scheduled events for this turn
    private processScheduledEvents(): void {
        const events = this.scheduledEvents.get(this.turnNumber);
        if (!events) return;
        
        for (const event of events) {
            if (event.type === 'building-destruction') {
                this.executeBuildingDestruction(event);
            }
        }
        
        // Clear processed events
        this.scheduledEvents.delete(this.turnNumber);
    }

    private executeBuildingDestruction(event: any): void {
        const { buildingId, controller, callback } = event;
        
        // Find the building
        const buildingIndex = controller.buildingsInPlay.findIndex((b: any) => b.id === buildingId);
        if (buildingIndex === -1) return;
        
        const building = controller.buildingsInPlay[buildingIndex];
        
        // Find units in building spaces
        const destroyedUnits: any[] = [];
        
        if (building.positions) {
            for (const pos of building.positions) {
                const unit = this.board.getUnitAt(pos.x, pos.y);
                if (unit) {
                    destroyedUnits.push(unit);
                    this.handleUnitDefeat(unit);
                }
            }
        }
        
        // Remove building
        controller.buildingsInPlay.splice(buildingIndex, 1);
        controller.moveToDiscard(building);
        
        this.addToLog(`${building.name} is destroyed!`);
        
        // Execute callback with destroyed units
        if (callback) {
            callback(destroyedUnits);
        }
    }

    // Helper methods for card playing
    public playCounterCard(player: Player, card: any): void {
        player.setFaceDownCard(card);
    }

    public playBuildingCard(player: Player, building: any, positions: any[]): boolean {
        if (player.playBuilding(building, positions)) {
            this.addToLog(`${player.name} plays ${building.name}`);
            
            // Execute building effect
            if (building.effect && building.effect.execute) {
                building.effect.execute(this, player, null);
            }
            
            return true;
        }
        return false;
    }

    public playQuestCard(player: Player, quest: any): boolean {
        if (player.playQuest(quest)) {
            this.addToLog(`${player.name} begins quest: ${quest.name}`);
            
            // Check if quest can be completed immediately
            this.checkQuestCompletion(player, quest);
            
            return true;
        }
        return false;
    }

    private checkQuestCompletion(player: Player, quest: any): void {
        if (!quest.checkCompletion) return;
        
        // Check if any summon meets the quest requirements
        for (const unit of player.summonUnits) {
            if (quest.checkCompletion(unit)) {
                this.addToLog(`Quest objective met by ${unit.getDisplayName()}!`);
                player.completeQuest(quest, unit);
                return;
            }
        }
    }

    public playAdvanceCard(player: Player, advanceCard: any, target: any): boolean {
        if (!player.canPlayAdvanceCard(advanceCard)) {
            this.addToLog('Requirements not met for advance card');
            return false;
        }
        
        const validTargets = player.getValidAdvanceTargets(advanceCard);
        if (!validTargets.includes(target)) {
            this.addToLog('Invalid target for advance card');
            return false;
        }
        
        // Execute advance effect
        if (advanceCard.effect && advanceCard.effect.execute) {
            advanceCard.effect.execute(this, target, player);
        }
        
        this.addToLog(`${player.name} uses ${advanceCard.name} on ${target.getDisplayName()}`);
        return true;
    }

    // Method to add cards to hand (for effects that generate cards)
    public addToHand(player: Player, cardType: string): void {
        // This would create and add specific cards based on type
        // For demo purposes, simplified
        this.addToLog(`${player.name} gains a card: ${cardType}`);
    }

    // Territory position helpers
    public getValidTerritoryPositions(player: Player): Position[] {
        const positions: Position[] = [];
        
        // Player A territory: rows 0-2, Player B territory: rows 11-13
        const startRow = player.type === PlayerType.PlayerA ? 0 : 11;
        const endRow = player.type === PlayerType.PlayerA ? 2 : 13;
        
        for (let y = startRow; y <= endRow; y++) {
            for (let x = 0; x < 12; x++) {
                if (!this.board.getUnitAt(x, y)) {
                    positions.push({ x, y });
                }
            }
        }
        
        return positions;
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