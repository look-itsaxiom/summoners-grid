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
        return this.summonUnits.length === 0;
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
}