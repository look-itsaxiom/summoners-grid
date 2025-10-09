import { CardData } from './Card';

export class Deck {
  private cards: CardData[] = [];
  private summonCards: CardData[] = [];
  private rechargePile: CardData[] = [];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    // Initialize 3 summon cards for initial hand (3v3 format)
    const summonNames = ['Gignen Warrior', 'Fae Magician', 'Wilderling Scout'];
    
    for (let i = 0; i < 3; i++) {
      this.summonCards.push({
        id: `summon-${i}`,
        name: summonNames[i],
        type: 'Summon',
        description: `A Summon card`
      });
    }

    // Initialize main deck with other card types
    const cardTypes = ['Action', 'Counter', 'Quest', 'Building', 'Action'];
    const cardNames = [
      'Sharpened Blade',
      'Healing Hands',
      'Rush',
      'Drain Touch',
      'Blast Bolt',
      'Ensnare',
      'Dramatic Return!',
      'Graverobbing',
      'Nearwood Forest Expedition',
      'Taste of Battle',
      'Gignen Country',
      'Dark Altar'
    ];

    for (let i = 0; i < 12; i++) {
      this.cards.push({
        id: `card-${i}`,
        name: cardNames[i],
        type: cardTypes[i % cardTypes.length],
        description: `A ${cardTypes[i % cardTypes.length]} card`
      });
    }

    this.shuffle();
  }

  private shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public draw(): CardData | null {
    // If main deck is empty, shuffle recharge pile into main deck
    if (this.cards.length === 0 && this.rechargePile.length > 0) {
      console.log('[Deck] Main deck empty, shuffling recharge pile into main deck');
      this.cards = [...this.rechargePile];
      this.rechargePile = [];
      this.shuffle();
    }
    
    return this.cards.pop() || null;
  }

  public drawSummon(): CardData | null {
    return this.summonCards.pop() || null;
  }

  public getRemainingCount(): number {
    return this.cards.length;
  }

  public getSummonCount(): number {
    return this.summonCards.length;
  }

  /**
   * Add a card to the recharge pile
   */
  public addToRechargePile(card: CardData): void {
    this.rechargePile.push(card);
    console.log(`[Deck] Card added to recharge pile: ${card.name}`);
  }

  /**
   * Get the number of cards in the recharge pile
   */
  public getRechargePileCount(): number {
    return this.rechargePile.length;
  }
}
