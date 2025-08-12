import { PlayerType } from './types.js';
import { Card } from './cards.js';
import { SummonUnit } from './summon-unit.js';

export class Player {
    public readonly name: string;
    public readonly type: PlayerType;
    public hand: Card[] = [];
    public mainDeck: Card[] = [];
    public rechargePile: Card[] = [];
    public discardPile: Card[] = [];
    public advanceDeck: Card[] = [];
    public summonUnits: SummonUnit[] = [];
    public victoryPoints: number = 0;
    public hasPlayedSummonThisTurn: boolean = false;
    public faceDownCards: Card[] = []; // For counter cards
    public buildingsInPlay: any[] = []; // For building cards
    public questsInPlay: any[] = []; // For quest cards
    public removedFromGame: Card[] = []; // For defeated summons

    constructor(name: string, type: PlayerType) {
        this.name = name;
        this.type = type;
    }

    drawCard(): Card | undefined {
        // If main deck is empty, shuffle recharge pile into main deck
        if (this.mainDeck.length === 0 && this.rechargePile.length > 0) {
            this.shuffleRechargeIntoDeck();
        }

        if (this.mainDeck.length === 0) {
            return undefined; // No cards to draw
        }

        const card = this.mainDeck.pop();
        if (card) {
            this.hand.push(card);
        }
        return card;
    }

    private shuffleRechargeIntoDeck(): void {
        // Move all cards from recharge pile to main deck and shuffle
        this.mainDeck = [...this.rechargePile];
        this.rechargePile = [];
        this.shuffleDeck(this.mainDeck);
    }

    private shuffleDeck(deck: Card[]): void {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    playCard(card: Card, _targets?: any[]): boolean {
        const cardIndex = this.hand.indexOf(card);
        if (cardIndex === -1) return false;

        // Remove card from hand
        this.hand.splice(cardIndex, 1);
        
        // Card will handle its own effects and destination
        return true;
    }

    addSummonUnit(unit: SummonUnit): void {
        this.summonUnits.push(unit);
    }

    removeSummonUnit(unit: SummonUnit): void {
        const index = this.summonUnits.indexOf(unit);
        if (index !== -1) {
            this.summonUnits.splice(index, 1);
        }
    }

    addVictoryPoints(points: number): void {
        this.victoryPoints += points;
    }

    levelUpSummons(): void {
        this.summonUnits.forEach(unit => {
            unit.levelUp();
        });
    }

    resetTurnFlags(): void {
        this.hasPlayedSummonThisTurn = false;
        this.summonUnits.forEach(unit => {
            unit.resetTurnFlags();
        });
    }

    discardExcessCards(): void {
        const handLimit = 6;
        while (this.hand.length > handLimit) {
            const card = this.hand.pop();
            if (card) {
                this.rechargePile.push(card);
            }
        }
    }

    getPlayableCards(game: any): Card[] {
        return this.hand.filter(card => card.canPlay(game, this));
    }

    hasLost(): boolean {
        // Only consider lost if player has no summon units AND no summon cards in hand/deck
        // This prevents immediate loss at game start
        const hasSummonCards = this.hand.some(card => card.type === 'summon') || 
                              this.mainDeck.some(card => card.type === 'summon');
        return this.summonUnits.length === 0 && !hasSummonCards;
    }

    getHandSize(): number {
        return this.hand.length;
    }

    getDeckSize(): number {
        return this.mainDeck.length;
    }

    getRechargeSize(): number {
        return this.rechargePile.length;
    }

    // New methods for advanced card types

    setFaceDownCard(card: Card): void {
        // Remove from hand and place face down
        const cardIndex = this.hand.indexOf(card);
        if (cardIndex !== -1) {
            this.hand.splice(cardIndex, 1);
            this.faceDownCards.push(card);
        }
    }

    playBuilding(building: any, positions: any[]): boolean {
        // Validate building placement
        if (!this.canPlaceBuilding(building, positions)) {
            return false;
        }

        // Remove from hand
        const cardIndex = this.hand.indexOf(building);
        if (cardIndex !== -1) {
            this.hand.splice(cardIndex, 1);
            building.positions = positions;
            this.buildingsInPlay.push(building);
            return true;
        }
        return false;
    }

    private canPlaceBuilding(building: any, positions: any[]): boolean {
        // Check if building can be placed at the given positions
        // This would validate territory requirements, space availability, etc.
        return positions.length === building.dimensions.width * building.dimensions.height;
    }

    playQuest(quest: any): boolean {
        // Remove from hand and place in play
        const cardIndex = this.hand.indexOf(quest);
        if (cardIndex !== -1) {
            this.hand.splice(cardIndex, 1);
            this.questsInPlay.push(quest);
            return true;
        }
        return false;
    }

    completeQuest(quest: any, target?: any): void {
        // Remove quest from play and trigger reward
        const questIndex = this.questsInPlay.indexOf(quest);
        if (questIndex !== -1) {
            this.questsInPlay.splice(questIndex, 1);
            
            // Quest goes to recharge pile
            this.rechargePile.push(quest);
            
            // Apply quest reward
            if (quest.reward && quest.reward.execute) {
                quest.reward.execute(null, target, null);
            }
        }
    }

    failQuest(quest: any): void {
        // Remove quest from play and trigger failure effect
        const questIndex = this.questsInPlay.indexOf(quest);
        if (questIndex !== -1) {
            this.questsInPlay.splice(questIndex, 1);
            
            // Failed quest goes to discard pile
            this.discardPile.push(quest);
            
            // Apply failure consequence if any
            if (quest.failure && quest.failure.execute) {
                quest.failure.execute(null, null, null);
            }
        }
    }

    moveToDiscard(card: Card): void {
        this.discardPile.push(card);
    }

    moveToRecharge(card: Card): void {
        this.rechargePile.push(card);
    }

    moveToRemoved(card: Card): void {
        this.removedFromGame.push(card);
    }

    canPlayAdvanceCard(advanceCard: any): boolean {
        // Check if requirements are met for advance card
        if (!advanceCard.requirements) return true;
        
        // Check for required role and level
        for (const unit of this.summonUnits) {
            if (advanceCard.checkRequirements && advanceCard.checkRequirements(unit)) {
                return true;
            }
        }
        
        return false;
    }

    getValidAdvanceTargets(advanceCard: any): SummonUnit[] {
        return this.summonUnits.filter(unit => 
            advanceCard.checkRequirements && advanceCard.checkRequirements(unit)
        );
    }

    addToHand(card: Card): void {
        this.hand.push(card);
    }
}