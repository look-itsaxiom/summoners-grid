import { CardData } from './Card';

export class Deck {
  private cards: CardData[] = [];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    // Initialize with sample cards based on the game design
    const cardTypes = ['Action', 'Summon', 'Counter', 'Quest', 'Building'];
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
    return this.cards.pop() || null;
  }

  public getRemainingCount(): number {
    return this.cards.length;
  }
}
