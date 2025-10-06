import Phaser from 'phaser';
import { GameState, TurnPhase, SummonUnit, Card, SummonCard, Position } from './types';
import { BOARD_CONFIG, COLORS, UI_CONFIG, GAME_CONFIG } from './constants';
import { getPlayerADeck, getPlayerBDeck } from './cardData';
import { calculateStats, calculateMaxHP, calculateMovement, levelUpSummon } from './gameUtils';

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private summonSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private uiText: Map<string, Phaser.GameObjects.Text> = new Map();
  private selectedSummon: SummonUnit | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.initializeGameState();
    this.drawBoard();
    this.createUI();
    this.setupInput();
    
    // Place initial summons for both players
    this.placeInitialSummons();
    this.updateUI();
  }

  private initializeGameState() {
    const boardWidth = BOARD_CONFIG.WIDTH;
    const boardHeight = BOARD_CONFIG.HEIGHT;
    
    this.gameState = {
      currentTurn: 'PLAYER_A',
      turnNumber: 1,
      phase: TurnPhase.DRAW,
      playerA: {
        victoryPoints: 0,
        mainDeck: [],
        hand: getPlayerADeck(),
        discardPile: [],
        rechargePile: [],
        advanceDeck: [],
        summons: [],
        hasPlayedSummonThisTurn: false,
      },
      playerB: {
        victoryPoints: 0,
        mainDeck: [],
        hand: getPlayerBDeck(),
        discardPile: [],
        rechargePile: [],
        advanceDeck: [],
        summons: [],
        hasPlayedSummonThisTurn: false,
      },
      board: Array(boardHeight).fill(null).map(() => Array(boardWidth).fill(null)),
    };
  }

  private drawBoard() {
    this.gridGraphics = this.add.graphics();
    
    const cellSize = BOARD_CONFIG.CELL_SIZE;
    const width = BOARD_CONFIG.WIDTH;
    const height = BOARD_CONFIG.HEIGHT;
    
    // Draw territory backgrounds
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let color = COLORS.NEUTRAL_TERRITORY;
        if (y <= BOARD_CONFIG.PLAYER_A_TERRITORY_END) {
          color = COLORS.PLAYER_A_TERRITORY;
        } else if (y >= BOARD_CONFIG.PLAYER_B_TERRITORY_START) {
          color = COLORS.PLAYER_B_TERRITORY;
        }
        
        this.gridGraphics.fillStyle(color, 0.3);
        this.gridGraphics.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    
    // Draw grid lines
    this.gridGraphics.lineStyle(1, COLORS.GRID_LINE, 1);
    for (let y = 0; y <= height; y++) {
      this.gridGraphics.lineBetween(0, y * cellSize, width * cellSize, y * cellSize);
    }
    for (let x = 0; x <= width; x++) {
      this.gridGraphics.lineBetween(x * cellSize, 0, x * cellSize, height * cellSize);
    }
    
    // Add coordinate labels
    for (let x = 0; x < width; x++) {
      this.add.text(x * cellSize + cellSize / 2, height * cellSize + 5, x.toString(), {
        fontSize: '10px',
        color: '#888'
      }).setOrigin(0.5, 0);
    }
    for (let y = 0; y < height; y++) {
      this.add.text(-15, y * cellSize + cellSize / 2, y.toString(), {
        fontSize: '10px',
        color: '#888'
      }).setOrigin(0.5, 0.5);
    }
  }

  private placeInitialSummons() {
    // Player A summons in their territory
    const playerACards = this.gameState.playerA.hand.filter(c => c.type === 'SUMMON') as SummonCard[];
    const playerAPositions: Position[] = [
      { x: 3, y: 1 },
      { x: 6, y: 1 },
      { x: 9, y: 1 },
    ];
    
    playerACards.forEach((card, index) => {
      if (index < playerAPositions.length) {
        const summon = this.createSummonUnit(card, playerAPositions[index], 'PLAYER_A');
        this.gameState.playerA.summons.push(summon);
        this.gameState.board[playerAPositions[index].y][playerAPositions[index].x] = summon;
        this.drawSummon(summon);
      }
    });
    
    // Player B summons in their territory
    const playerBCards = this.gameState.playerB.hand.filter(c => c.type === 'SUMMON') as SummonCard[];
    const playerBPositions: Position[] = [
      { x: 3, y: 12 },
      { x: 6, y: 12 },
      { x: 9, y: 12 },
    ];
    
    playerBCards.forEach((card, index) => {
      if (index < playerBPositions.length) {
        const summon = this.createSummonUnit(card, playerBPositions[index], 'PLAYER_B');
        this.gameState.playerB.summons.push(summon);
        this.gameState.board[playerBPositions[index].y][playerBPositions[index].x] = summon;
        this.drawSummon(summon);
      }
    });
    
    // Remove summon cards from hands
    this.gameState.playerA.hand = this.gameState.playerA.hand.filter(c => c.type !== 'SUMMON');
    this.gameState.playerB.hand = this.gameState.playerB.hand.filter(c => c.type !== 'SUMMON');
  }

  private createSummonUnit(card: SummonCard, position: Position, owner: 'PLAYER_A' | 'PLAYER_B'): SummonUnit {
    const stats = calculateStats(card.baseStats, card.growthRates, card.level);
    const maxHP = calculateMaxHP(stats.END);
    const movement = calculateMovement(stats.SPD);
    
    return {
      card,
      position,
      currentHP: maxHP,
      maxHP,
      movement,
      owner,
      calculatedStats: stats,
    };
  }

  private drawSummon(summon: SummonUnit) {
    const cellSize = BOARD_CONFIG.CELL_SIZE;
    const x = summon.position.x * cellSize + cellSize / 2;
    const y = summon.position.y * cellSize + cellSize / 2;
    
    const container = this.add.container(x, y);
    
    // Draw summon circle
    const circle = this.add.circle(0, 0, cellSize * 0.4, 
      summon.owner === 'PLAYER_A' ? COLORS.SUMMON_PLAYER_A : COLORS.SUMMON_PLAYER_B);
    circle.setStrokeStyle(2, COLORS.CARD_BORDER);
    container.add(circle);
    
    // Draw level
    const levelText = this.add.text(0, -10, `Lv${summon.card.level}`, {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(levelText);
    
    // Draw name (abbreviated)
    const nameText = this.add.text(0, 5, summon.card.name.split(' ')[1] || summon.card.name, {
      fontSize: '9px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);
    
    // Make interactive
    circle.setInteractive({ useHandCursor: true });
    circle.on('pointerdown', () => {
      this.selectSummon(summon);
    });
    
    this.summonSprites.set(summon.card.id + summon.owner, container);
  }

  private selectSummon(summon: SummonUnit) {
    // Clear previous selection
    this.summonSprites.forEach(sprite => {
      const circle = sprite.list[0] as Phaser.GameObjects.Arc;
      circle.setStrokeStyle(2, COLORS.CARD_BORDER);
    });
    
    // Highlight selected summon
    const sprite = this.summonSprites.get(summon.card.id + summon.owner);
    if (sprite) {
      const circle = sprite.list[0] as Phaser.GameObjects.Arc;
      circle.setStrokeStyle(3, COLORS.HIGHLIGHT);
    }
    
    this.selectedSummon = summon;
    this.updateUI();
  }

  private createUI() {
    const boardWidth = BOARD_CONFIG.WIDTH * BOARD_CONFIG.CELL_SIZE;
    const uiX = boardWidth + 20;
    
    // Title
    this.add.text(uiX, 20, "Summoner's Grid", {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    // Turn info
    this.uiText.set('turn', this.add.text(uiX, 60, '', {
      fontSize: '16px',
      color: '#ffffff'
    }));
    
    this.uiText.set('phase', this.add.text(uiX, 85, '', {
      fontSize: '14px',
      color: '#aaaaaa'
    }));
    
    // VP counters
    this.uiText.set('playerAVP', this.add.text(uiX, 120, '', {
      fontSize: '14px',
      color: '#4dabf7'
    }));
    
    this.uiText.set('playerBVP', this.add.text(uiX, 145, '', {
      fontSize: '14px',
      color: '#f76d6d'
    }));
    
    // Selected summon info
    this.add.text(uiX, 180, 'Selected Summon:', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    this.uiText.set('summonInfo', this.add.text(uiX, 205, 'Click a summon to view details', {
      fontSize: '12px',
      color: '#aaaaaa'
    }));
    
    // Next turn button
    const button = this.add.rectangle(uiX + 100, 500, 180, 40, COLORS.SUMMON_PLAYER_A)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.nextPhase());
    
    this.add.text(uiX + 100, 500, 'Next Phase', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Instructions
    this.add.text(uiX, 560, 'Controls:\n- Click summon to select\n- Next Phase button to\n  advance through turn', {
      fontSize: '11px',
      color: '#888888'
    });
  }

  private updateUI() {
    const turn = this.uiText.get('turn');
    if (turn) {
      turn.setText(`Turn ${this.gameState.turnNumber} - ${this.gameState.currentTurn === 'PLAYER_A' ? 'Player A' : 'Player B'}`);
    }
    
    const phase = this.uiText.get('phase');
    if (phase) {
      phase.setText(`Phase: ${this.gameState.phase}`);
    }
    
    const playerAVP = this.uiText.get('playerAVP');
    if (playerAVP) {
      playerAVP.setText(`Player A VP: ${this.gameState.playerA.victoryPoints}/3`);
    }
    
    const playerBVP = this.uiText.get('playerBVP');
    if (playerBVP) {
      playerBVP.setText(`Player B VP: ${this.gameState.playerB.victoryPoints}/3`);
    }
    
    const summonInfo = this.uiText.get('summonInfo');
    if (summonInfo && this.selectedSummon) {
      const s = this.selectedSummon;
      const info = `${s.card.name}\n` +
        `Level: ${s.card.level}\n` +
        `HP: ${s.currentHP}/${s.maxHP}\n` +
        `Movement: ${s.movement}\n` +
        `Role: ${s.card.role}\n` +
        `Species: ${s.card.species}\n` +
        `\nStats:\n` +
        `STR: ${s.calculatedStats.STR}  INT: ${s.calculatedStats.INT}\n` +
        `END: ${s.calculatedStats.END}  SPI: ${s.calculatedStats.SPI}\n` +
        `DEF: ${s.calculatedStats.DEF}  MDF: ${s.calculatedStats.MDF}\n` +
        `SPD: ${s.calculatedStats.SPD}  ACC: ${s.calculatedStats.ACC}\n` +
        `LCK: ${s.calculatedStats.LCK}`;
      summonInfo.setText(info);
    }
  }

  private nextPhase() {
    const phases: TurnPhase[] = [TurnPhase.DRAW, TurnPhase.LEVEL, TurnPhase.ACTION, TurnPhase.END];
    const currentIndex = phases.indexOf(this.gameState.phase);
    
    if (currentIndex < phases.length - 1) {
      this.gameState.phase = phases[currentIndex + 1];
      
      // Handle phase-specific actions
      if (this.gameState.phase === TurnPhase.LEVEL) {
        this.handleLevelPhase();
      }
    } else {
      // Move to next turn
      this.endTurn();
    }
    
    this.updateUI();
  }

  private handleLevelPhase() {
    const currentPlayer = this.gameState.currentTurn === 'PLAYER_A' ? 
      this.gameState.playerA : this.gameState.playerB;
    
    currentPlayer.summons.forEach(summon => {
      const oldLevel = summon.card.level;
      levelUpSummon(summon);
      
      // Update the sprite
      const sprite = this.summonSprites.get(summon.card.id + summon.owner);
      if (sprite && summon.card.level > oldLevel) {
        const levelText = sprite.list[1] as Phaser.GameObjects.Text;
        levelText.setText(`Lv${summon.card.level}`);
        
        // Flash effect
        this.tweens.add({
          targets: sprite,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          yoyo: true,
        });
      }
    });
  }

  private endTurn() {
    // Switch player
    this.gameState.currentTurn = this.gameState.currentTurn === 'PLAYER_A' ? 'PLAYER_B' : 'PLAYER_A';
    
    // Increment turn number when returning to player A
    if (this.gameState.currentTurn === 'PLAYER_A') {
      this.gameState.turnNumber++;
    }
    
    // Reset phase to DRAW
    this.gameState.phase = TurnPhase.DRAW;
    
    // Reset summon played flag
    const currentPlayer = this.gameState.currentTurn === 'PLAYER_A' ? 
      this.gameState.playerA : this.gameState.playerB;
    currentPlayer.hasPlayedSummonThisTurn = false;
  }

  private setupInput() {
    // Add keyboard shortcuts
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.nextPhase();
    });
  }
}
