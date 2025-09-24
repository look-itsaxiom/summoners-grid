import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import { GameState, Player, SummonInstance, CardInstance, BOARD_WIDTH, BOARD_HEIGHT, TILE_SIZE, CardType as CardTypeEnum } from '@summoners-grid/common';
import { cardData } from '@summoners-grid/common/build/game/data/card-data';

export class GameScene extends Phaser.Scene {
    private client!: Colyseus.Client;
    private room!: Colyseus.Room<GameState>;

    private summons: Map<string, Phaser.GameObjects.Container> = new Map();
    private hand: Map<string, Phaser.GameObjects.Container> = new Map();
    private infoText!: Phaser.GameObjects.Text;
    private territoryGraphics!: Phaser.GameObjects.Graphics;
    private endTurnButton!: Phaser.GameObjects.Container;

    private gridOffsetX!: number;
    private gridOffsetY!: number;

    // UI State
    private selectedCard: { instanceId: string, cardId: string } | null = null;
    private selectedSummon: string | null = null; // instanceId of the summon selected for an action
    private targetingMode: 'move' | 'attack' | 'playCard' | null = null;
    private activeActionMenu: Phaser.GameObjects.Container | null = null;

    constructor() { super({ key: 'GameScene' }); }

    async create() {
        this.gridOffsetX = (this.scale.width - (BOARD_WIDTH * TILE_SIZE)) / 2;
        this.gridOffsetY = (this.scale.height - (BOARD_HEIGHT * TILE_SIZE)) / 2;

        const connectingText = this.add.text(100, 100, 'Connecting...', { font: '32px Arial', color: '#ffffff' });

        this.client = new Colyseus.Client('ws://localhost:2567');
        try {
            this.room = await this.client.joinOrCreate<GameState>('game', { name: `Player_${Math.floor(Math.random()*100)}`});
            connectingText.destroy();
            this.drawGrid();
            this.drawTerritories();
            this.createUI();
            this.registerStateHandlers();
            this.registerInputHandlers();
        } catch (e) {
            console.error('Join error', e);
            connectingText.setText('Failed to connect.');
        }
    }

    private registerInputHandlers() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.activeActionMenu) {
                // If clicking outside the menu, close it
                if (!this.activeActionMenu.getBounds().contains(pointer.x, pointer.y)) {
                    this.clearSelection();
                }
            }

            if (this.targetingMode) {
                const gridX = Math.floor((pointer.x - this.gridOffsetX) / TILE_SIZE);
                const gridY = Math.floor((pointer.y - this.gridOffsetY) / TILE_SIZE);

                if (this.targetingMode === 'playCard' && this.selectedCard) {
                    this.room.send('playCard', { cardInstanceId: this.selectedCard.instanceId, position: { x: gridX, y: gridY } });
                    this.clearSelection();
                } else if (this.targetingMode === 'move' && this.selectedSummon) {
                    this.room.send('moveSummon', { summonInstanceId: this.selectedSummon, targetPosition: { x: gridX, y: gridY } });
                    this.clearSelection();
                }
            }
        });
    }

    private registerStateHandlers() {
        this.room.state.board.onAdd((summon, key) => this.drawSummon(summon));
        this.room.state.board.onRemove((_, key) => this.removeSummon(key));
        this.room.state.board.onChange((summon, key) => this.updateSummon(summon));
        this.room.state.players.onAdd((player, sessionId) => { if (sessionId === this.room.sessionId) this.listenToHand(player); });
        this.room.onStateChange((state) => this.updateInfoPanel(state));
    }

    private listenToHand(player: Player) {
        player.hand.onAdd((card, _) => this.redrawHand(player.hand));
        player.hand.onRemove((_, __) => this.redrawHand(player.hand));
    }

    private redrawHand(hand: any) {
        this.hand.forEach(go => go.destroy());
        this.hand.clear();
        hand.forEach((card, index) => this.drawCard(card, index));
    }

    private drawSummon(summon: SummonInstance) {
        this.removeSummon(summon.instanceId); // Remove if exists, to prevent duplicates
        const player = this.room.state.players.get(summon.ownerId);
        const color = player.playerId === 'A' ? 0x0000ff : 0xff0000;
        const circle = this.add.ellipse(0, 0, TILE_SIZE * 0.8, TILE_SIZE * 0.8, color);
        const text = this.add.text(0, 0, `${summon.name}\nHP: ${summon.currentHP}/${summon.calculatedProperties.maxHP}`, { font: '10px Arial', color: '#ffffff', align: 'center' }).setOrigin(0.5);
        const container = this.add.container(
            this.gridOffsetX + summon.position.x * TILE_SIZE + TILE_SIZE / 2,
            this.gridOffsetY + summon.position.y * TILE_SIZE + TILE_SIZE / 2,
            [circle, text]
        ).setInteractive(new Phaser.Geom.Ellipse(0, 0, TILE_SIZE * 0.8, TILE_SIZE * 0.8), Phaser.Geom.Ellipse.Contains);

        container.on('pointerdown', () => {
            if (this.targetingMode === 'attack' && this.selectedSummon) {
                this.room.send('attack', { attackerId: this.selectedSummon, defenderId: summon.instanceId });
                this.clearSelection();
            } else if (summon.ownerId === this.room.sessionId) {
                this.showActionMenu(summon, container);
            }
        });
        this.summons.set(summon.instanceId, container);
    }

    private removeSummon(key: string) {
        const summonGO = this.summons.get(key);
        if (summonGO) {
            summonGO.destroy();
            this.summons.delete(key);
        }
    }

    private updateSummon(summon: SummonInstance) {
        const summonGO = this.summons.get(summon.instanceId);
        if (summonGO) {
            summonGO.x = this.gridOffsetX + summon.position.x * TILE_SIZE + TILE_SIZE / 2;
            summonGO.y = this.gridOffsetY + summon.position.y * TILE_SIZE + TILE_SIZE / 2;
            const text = summonGO.getAt(1) as Phaser.GameObjects.Text;
            text.setText(`${summon.name}\nHP: ${summon.currentHP}/${summon.calculatedProperties.maxHP}`);
        }
    }

    private drawCard(card: CardInstance, index: number) {
        const cardDef = cardData[card.cardId];
        const cardWidth = 80, cardHeight = 110;
        const handSize = this.room.state.players.get(this.room.sessionId)?.hand.length || 1;
        const handX = (this.scale.width / 2) - (handSize * (cardWidth + 10) / 2);
        const rect = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x333333).setStrokeStyle(2, 0xffffff);
        const text = this.add.text(0, 5 - cardHeight / 2, cardDef.name, { font: '12px Arial', color: '#ffffff', align: 'center', wordWrap: { width: cardWidth - 10 } }).setOrigin(0.5, 0);
        const container = this.add.container(handX + index * (cardWidth + 10), this.scale.height - (cardHeight / 2) - 10, [rect, text]).setInteractive();

        container.on('pointerdown', () => {
            this.clearSelection();
            this.selectedCard = { instanceId: card.instanceId, cardId: card.cardId };
            if (cardDef.type === CardTypeEnum.SUMMON) {
                this.targetingMode = 'playCard';
                console.log(`Selected ${cardDef.name}, click a tile to summon.`);
            }
            // Add other card type interactions here
        });
        this.hand.set(card.instanceId, container);
    }

    private showActionMenu(summon: SummonInstance, summonGO: Phaser.GameObjects.Container) {
        this.clearSelection();
        this.selectedSummon = summon.instanceId;

        const menuBg = this.add.graphics().fillStyle(0x000000, 0.8).fillRect(-32, -22, 64, 44);
        const moveText = this.add.text(0, -10, 'Move', { font: '12px Arial' }).setOrigin(0.5).setInteractive();
        const attackText = this.add.text(0, 10, 'Attack', { font: '12px Arial' }).setOrigin(0.5).setInteractive();

        moveText.on('pointerdown', (p: Phaser.Input.Pointer) => { p.stopPropagation(); this.targetingMode = 'move'; this.activeActionMenu.destroy(); });
        attackText.on('pointerdown', (p: Phaser.Input.Pointer) => { p.stopPropagation(); this.targetingMode = 'attack'; this.activeActionMenu.destroy(); });

        this.activeActionMenu = this.add.container(summonGO.x, summonGO.y - TILE_SIZE, [menuBg, moveText, attackText]);
    }

    private clearSelection() {
        this.selectedCard = null;
        this.selectedSummon = null;
        this.targetingMode = null;
        if (this.activeActionMenu) this.activeActionMenu.destroy();
        this.activeActionMenu = null;
    }

    private createUI() {
        this.infoText = this.add.text(10, 10, 'Waiting...', { font: '16px Arial', color: '#ffffff', backgroundColor: '#000000' }).setPadding(5);
        const endTurnRect = this.add.rectangle(0, 0, 100, 40, 0x990000).setStrokeStyle(2, 0xffffff);
        const endTurnText = this.add.text(0, 0, 'End Turn', { font: '16px Arial' }).setOrigin(0.5);
        this.endTurnButton = this.add.container(this.scale.width - 60, this.scale.height - 30, [endTurnRect, endTurnText]).setInteractive();
        this.endTurnButton.on('pointerdown', () => this.room.send('endTurn'));
    }

    private updateInfoPanel(state: GameState) {
        if (!this.infoText || !state.gameStarted) return;
        const activePlayer = Array.from(state.players.values()).find(p => p.playerId === state.activePlayerId);
        const playerA = Array.from(state.players.values()).find(p => p.playerId === 'A');
        const playerB = Array.from(state.players.values()).find(p => p.playerId === 'B');
        this.infoText.setText(
`Turn: ${state.turn} | Phase: ${state.currentPhase}
Active: ${activePlayer?.name} (${activePlayer?.playerId})
VP: ${playerA?.victoryPoints || 0} (A) vs ${playerB?.victoryPoints || 0} (B)
Status: ${state.winner ? `Player ${state.winner} Wins!` : state.gameStatusMessage}`
        );
    }

    private drawGrid() {
        // ... (same as before)
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x00ff00, 0.5);
        for (let i = 0; i <= BOARD_WIDTH; i++) {
          const x = this.gridOffsetX + i * TILE_SIZE;
          graphics.moveTo(x, this.gridOffsetY);
          graphics.lineTo(x, this.gridOffsetY + BOARD_HEIGHT * TILE_SIZE);
        }
        for (let i = 0; i <= BOARD_HEIGHT; i++) {
          const y = this.gridOffsetY + i * TILE_SIZE;
          graphics.moveTo(this.gridOffsetX, y);
          graphics.lineTo(this.gridOffsetX + BOARD_WIDTH * TILE_SIZE, y);
        }
        graphics.strokePath();
    }

    private drawTerritories() {
        // ... (same as before)
        this.territoryGraphics = this.add.graphics({ alpha: 0.1 });
        this.territoryGraphics.fillStyle(0x0000ff);
        this.territoryGraphics.fillRect(this.gridOffsetX, this.gridOffsetY, BOARD_WIDTH * TILE_SIZE, 3 * TILE_SIZE);
        this.territoryGraphics.fillStyle(0xff0000);
        this.territoryGraphics.fillRect(this.gridOffsetX, this.gridOffsetY + (BOARD_HEIGHT - 3) * TILE_SIZE, BOARD_WIDTH * TILE_SIZE, 3 * TILE_SIZE);
    }
}
