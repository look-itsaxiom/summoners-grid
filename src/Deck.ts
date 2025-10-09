import { CardData } from './Card';
import { GrowthRate, BaseStats, StatGrowthRates } from './types/Stats';

export class Deck {
  private cards: CardData[] = [];
  private summonCards: CardData[] = [];
  private rechargePile: CardData[] = [];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    // Initialize 3 summon cards for initial hand (3v3 format)
    // Based on the Play Example.md, we'll use realistic stats for these summons
    
    // Gignen Warrior - Balanced fighter
    this.summonCards.push({
      id: 'summon-0',
      name: 'Gignen Warrior',
      type: 'Summon',
      description: 'A Summon card',
      summonData: {
        baseStats: {
          STR: 14,
          END: 9,
          DEF: 11,
          INT: 10,
          SPI: 9,
          MDF: 6,
          SPD: 8,
          ACC: 9,  // Corrected from 10 to 9
          LCK: 16
        },
        growthRates: {
          STR: GrowthRate.Normal,      // 1.0
          END: GrowthRate.Normal,      // 1.0
          DEF: GrowthRate.Normal,      // 1.0
          INT: GrowthRate.Normal,      // 1.0
          SPI: GrowthRate.Normal,      // 1.0
          MDF: GrowthRate.Normal,      // 1.0
          SPD: GrowthRate.Normal,      // 1.0
          ACC: GrowthRate.Steady,      // 0.67
          LCK: GrowthRate.Normal       // 1.0
        }
      }
    });

    // Fae Magician - High INT and SPI
    this.summonCards.push({
      id: 'summon-1',
      name: 'Fae Magician',
      type: 'Summon',
      description: 'A Summon card',
      summonData: {
        baseStats: {
          STR: 8,
          END: 8,
          DEF: 10,
          INT: 20,
          SPI: 21,
          MDF: 11,
          SPD: 10,
          ACC: 11,
          LCK: 8
        },
        growthRates: {
          STR: GrowthRate.Normal,      // 1.0
          END: GrowthRate.Normal,      // 1.0
          DEF: GrowthRate.Normal,      // 1.0
          INT: GrowthRate.Normal,      // 1.0
          SPI: GrowthRate.Normal,      // 1.0
          MDF: GrowthRate.Normal,      // 1.0
          SPD: GrowthRate.Normal,      // 1.0
          ACC: GrowthRate.Steady,      // 0.67
          LCK: GrowthRate.Normal       // 1.0
        }
      }
    });

    // Wilderling Scout - High SPD and ACC
    this.summonCards.push({
      id: 'summon-2',
      name: 'Wilderling Scout',
      type: 'Summon',
      description: 'A Summon card',
      summonData: {
        baseStats: {
          STR: 10,
          END: 9,
          DEF: 8,
          INT: 10,
          SPI: 11,
          MDF: 9,
          SPD: 16,
          ACC: 13,
          LCK: 20
        },
        growthRates: {
          STR: GrowthRate.Normal,      // 1.0
          END: GrowthRate.Normal,      // 1.0
          DEF: GrowthRate.Normal,      // 1.0
          INT: GrowthRate.Normal,      // 1.0
          SPI: GrowthRate.Normal,      // 1.0
          MDF: GrowthRate.Normal,      // 1.0
          SPD: GrowthRate.Gradual,     // 1.33
          ACC: GrowthRate.Normal,      // 1.0
          LCK: GrowthRate.Normal       // 1.0
        }
      }
    });

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
