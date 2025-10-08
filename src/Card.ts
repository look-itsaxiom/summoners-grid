export interface CardData {
  id: string;
  name: string;
  type: string;
  description: string;
}

export class Card extends Phaser.GameObjects.Container {
  private cardData: CardData;
  private background: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private typeText: Phaser.GameObjects.Text;
  private isSelected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, cardData: CardData) {
    super(scene, x, y);
    this.cardData = cardData;

    // Create card background
    this.background = scene.add.rectangle(0, 0, 80, 110, 0x2a2a2a);
    this.background.setStrokeStyle(2, 0x666666);
    this.add(this.background);

    // Create card name text
    this.nameText = scene.add.text(0, -40, cardData.name, {
      fontSize: '10px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 70 }
    });
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Create card type text
    this.typeText = scene.add.text(0, 35, cardData.type, {
      fontSize: '8px',
      color: '#aaaaaa',
      align: 'center'
    });
    this.typeText.setOrigin(0.5);
    this.add(this.typeText);

    // Make card interactive
    this.background.setInteractive();
    this.background.on('pointerdown', () => this.onCardClick());
    this.background.on('pointerover', () => this.onCardHover());
    this.background.on('pointerout', () => this.onCardOut());

    scene.add.existing(this);
  }

  private onCardClick(): void {
    this.isSelected = !this.isSelected;
    this.updateVisuals();
    
    if (this.isSelected) {
      this.emit('cardSelected', this.cardData);
    } else {
      this.emit('cardDeselected', this.cardData);
    }
  }

  private onCardHover(): void {
    if (!this.isSelected) {
      this.background.setFillStyle(0x3a3a3a);
      this.setScale(1.05);
    }
  }

  private onCardOut(): void {
    if (!this.isSelected) {
      this.background.setFillStyle(0x2a2a2a);
      this.setScale(1.0);
    }
  }

  private updateVisuals(): void {
    if (this.isSelected) {
      this.background.setFillStyle(0x4a6fa5);
      this.background.setStrokeStyle(2, 0x6a9fc5);
      this.setScale(1.05);
    } else {
      this.background.setFillStyle(0x2a2a2a);
      this.background.setStrokeStyle(2, 0x666666);
      this.setScale(1.0);
    }
  }

  public getCardData(): CardData {
    return this.cardData;
  }

  public deselect(): void {
    this.isSelected = false;
    this.updateVisuals();
  }
}
