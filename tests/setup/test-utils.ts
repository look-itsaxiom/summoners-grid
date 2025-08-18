import { Page, Locator, expect } from '@playwright/test';

/**
 * Utility class for interacting with the Summoner's Grid game in tests
 */
export class GameTestUtils {
  constructor(private page: Page) {}

  // Navigation and basic setup
  async navigateToGame(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForSelector('.game-container', { timeout: 10000 });
  }

  // Turn management
  async getCurrentTurnInfo(): Promise<string> {
    return await this.page.locator('#turn-info').textContent() || '';
  }

  async getCurrentPhase(): Promise<string> {
    const turnInfo = await this.getCurrentTurnInfo();
    const match = turnInfo.match(/- (\w+) Phase/);
    return match ? match[1] : '';
  }

  async getCurrentPlayer(): Promise<string> {
    const turnInfo = await this.getCurrentTurnInfo();
    const match = turnInfo.match(/^(Player [AB])/);
    return match ? match[1] : '';
  }

  async endPhase(): Promise<void> {
    await this.page.click('#end-phase-btn');
    await this.page.waitForTimeout(500); // Wait for UI update
  }

  async passPriority(): Promise<void> {
    await this.page.click('#pass-priority-btn');
    await this.page.waitForTimeout(500);
  }

  async resetGame(): Promise<void> {
    await this.page.click('#reset-game-btn');
    await this.page.waitForTimeout(1000); // Wait for game reset
  }

  // Card management
  async getPlayerHandCount(player: 'A' | 'B'): Promise<number> {
    const count = await this.page.locator(`#player-${player.toLowerCase()}-hand-count`).textContent();
    return parseInt(count || '0');
  }

  async getPlayerDeckCount(player: 'A' | 'B'): Promise<number> {
    const count = await this.page.locator(`#player-${player.toLowerCase()}-deck-count`).textContent();
    return parseInt(count || '0');
  }

  async getPlayerRechargeCount(player: 'A' | 'B'): Promise<number> {
    const count = await this.page.locator(`#player-${player.toLowerCase()}-recharge-count`).textContent();
    return parseInt(count || '0');
  }

  async getPlayerDiscardCount(player: 'A' | 'B'): Promise<number> {
    const count = await this.page.locator(`#player-${player.toLowerCase()}-discard-count`).textContent();
    return parseInt(count || '0');
  }

  async getPlayerVictoryPoints(player: 'A' | 'B'): Promise<number> {
    const vp = await this.page.locator(`#player-${player.toLowerCase()}-vp`).textContent();
    return parseInt(vp || '0');
  }

  async getCardsInPlayerHand(player: 'A' | 'B'): Promise<string[]> {
    const cards = await this.page.locator(`#player-${player.toLowerCase()}-hand .card`).all();
    const cardNames: string[] = [];
    for (const card of cards) {
      const name = await card.locator('.card-name').textContent();
      if (name) cardNames.push(name);
    }
    return cardNames;
  }

  async getPlayableCardsInHand(player: 'A' | 'B'): Promise<string[]> {
    const cards = await this.page.locator(`#player-${player.toLowerCase()}-hand .card.playable`).all();
    const cardNames: string[] = [];
    for (const card of cards) {
      const name = await card.locator('.card-name').textContent();
      if (name) cardNames.push(name);
    }
    return cardNames;
  }

  async playCardFromHand(player: 'A' | 'B', cardName: string): Promise<void> {
    const cardSelector = `#player-${player.toLowerCase()}-hand .card:has(.card-name:text("${cardName}"))`;
    await this.page.click(cardSelector);
    await this.page.waitForTimeout(500);
  }

  async selectCardInHand(player: 'A' | 'B', cardName: string): Promise<void> {
    const cardSelector = `#player-${player.toLowerCase()}-hand .card:has(.card-name:text("${cardName}"))`;
    await this.page.click(cardSelector);
    await this.page.waitForTimeout(300);
  }

  // Board interaction
  async getBoardCellContent(x: number, y: number): Promise<string> {
    const cellSelector = `[data-x="${x}"][data-y="${y}"]`;
    const cell = this.page.locator(cellSelector);
    
    // Check for summon unit
    const summonUnit = cell.locator('.summon-unit');
    if (await summonUnit.count() > 0) {
      return await summonUnit.textContent() || 'Summon Unit';
    }
    
    // Check for building
    const building = cell.locator('.building');
    if (await building.count() > 0) {
      return await building.textContent() || 'Building';
    }
    
    return 'Empty';
  }

  async clickBoardCell(x: number, y: number): Promise<void> {
    const cellSelector = `[data-x="${x}"][data-y="${y}"]`;
    await this.page.click(cellSelector);
    await this.page.waitForTimeout(300);
  }

  async getSummonUnitAt(x: number, y: number): Promise<SummonUnitInfo | null> {
    const cellSelector = `[data-x="${x}"][data-y="${y}"] .summon-unit`;
    const summon = this.page.locator(cellSelector);
    
    if (await summon.count() === 0) {
      return null;
    }
    
    const text = await summon.textContent() || '';
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      name: lines[0] || '',
      level: parseInt(lines[1]?.replace('Lv ', '') || '0'),
      hp: lines[2] || '',
      position: { x, y }
    };
  }

  async getValidMovePositions(): Promise<{x: number, y: number}[]> {
    const validMoveCells = await this.page.locator('.grid-cell.valid-move').all();
    const positions: {x: number, y: number}[] = [];
    
    for (const cell of validMoveCells) {
      const x = parseInt(await cell.getAttribute('data-x') || '0');
      const y = parseInt(await cell.getAttribute('data-y') || '0');
      positions.push({ x, y });
    }
    
    return positions;
  }

  async getValidAttackPositions(): Promise<{x: number, y: number}[]> {
    const validAttackCells = await this.page.locator('.grid-cell.valid-attack').all();
    const positions: {x: number, y: number}[] = [];
    
    for (const cell of validAttackCells) {
      const x = parseInt(await cell.getAttribute('data-x') || '0');
      const y = parseInt(await cell.getAttribute('data-y') || '0');
      positions.push({ x, y });
    }
    
    return positions;
  }

  async selectSummonUnit(x: number, y: number): Promise<void> {
    const cellSelector = `[data-x="${x}"][data-y="${y}"] .summon-unit`;
    await this.page.click(cellSelector);
    await this.page.waitForTimeout(300);
  }

  // Quest management
  async getActiveQuests(player: 'A' | 'B'): Promise<string[]> {
    const quests = await this.page.locator(`#player-${player.toLowerCase()}-quests .card`).all();
    const questNames: string[] = [];
    for (const quest of quests) {
      const name = await quest.locator('.card-name').textContent();
      if (name) questNames.push(name);
    }
    return questNames;
  }

  // Face-down cards (Counter cards)
  async getFaceDownCards(player: 'A' | 'B'): Promise<number> {
    const cards = await this.page.locator(`#player-${player.toLowerCase()}-face-down .card`).count();
    return cards;
  }

  // Buildings
  async getBuildingsInPlay(player: 'A' | 'B'): Promise<string[]> {
    const buildings = await this.page.locator(`#player-${player.toLowerCase()}-buildings .card`).all();
    const buildingNames: string[] = [];
    for (const building of buildings) {
      const name = await building.locator('.card-name').textContent();
      if (name) buildingNames.push(name);
    }
    return buildingNames;
  }

  // Advance cards
  async getAdvanceCards(player: 'A' | 'B'): Promise<string[]> {
    const cards = await this.page.locator(`#player-${player.toLowerCase()}-advance .card`).all();
    const cardNames: string[] = [];
    for (const card of cards) {
      const name = await card.locator('.card-name').textContent();
      if (name) cardNames.push(name);
    }
    return cardNames;
  }

  // Game log utilities
  async getGameLogEntries(): Promise<string[]> {
    const entries = await this.page.locator('#game-log .log-entry').all();
    const logEntries: string[] = [];
    for (const entry of entries) {
      const text = await entry.textContent();
      if (text) logEntries.push(text.trim());
    }
    return logEntries;
  }

  async getLatestLogEntry(): Promise<string> {
    const entries = await this.getGameLogEntries();
    return entries.length > 0 ? entries[entries.length - 1] : '';
  }

  // Wait utilities
  async waitForTurnPhase(phase: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(
      (expectedPhase) => {
        const turnInfo = document.querySelector('#turn-info')?.textContent || '';
        return turnInfo.includes(`- ${expectedPhase} Phase`);
      },
      phase,
      { timeout }
    );
  }

  async waitForPlayer(player: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForFunction(
      (expectedPlayer) => {
        const turnInfo = document.querySelector('#turn-info')?.textContent || '';
        return turnInfo.startsWith(expectedPlayer);
      },
      player,
      { timeout }
    );
  }

  // Modal interaction
  async isUnitDetailModalVisible(): Promise<boolean> {
    const modal = this.page.locator('#unit-detail-modal');
    const display = await modal.evaluate(el => window.getComputedStyle(el).display);
    return display !== 'none';
  }

  async closeUnitDetailModal(): Promise<void> {
    await this.page.click('#close-unit-modal');
    await this.page.waitForTimeout(300);
  }

  // Complex actions
  async completeTurn(): Promise<void> {
    // Navigate through all phases of a turn
    while (true) {
      const phase = await this.getCurrentPhase();
      if (phase === 'Draw' || phase === 'Level' || phase === 'Action' || phase === 'End') {
        await this.endPhase();
        const newPhase = await this.getCurrentPhase();
        if (newPhase === phase) {
          // Phase didn't change, we're done
          break;
        }
      } else {
        break;
      }
    }
  }

  // Assertion helpers
  async expectTurnPhase(expectedPhase: string): Promise<void> {
    const currentPhase = await this.getCurrentPhase();
    expect(currentPhase).toBe(expectedPhase);
  }

  async expectCurrentPlayer(expectedPlayer: string): Promise<void> {
    const currentPlayer = await this.getCurrentPlayer();
    expect(currentPlayer).toBe(expectedPlayer);
  }

  async expectCardInHand(player: 'A' | 'B', cardName: string): Promise<void> {
    const cards = await this.getCardsInPlayerHand(player);
    expect(cards).toContain(cardName);
  }

  async expectSummonUnitAt(x: number, y: number, expectedName?: string): Promise<void> {
    const unit = await this.getSummonUnitAt(x, y);
    expect(unit).not.toBeNull();
    if (expectedName) {
      expect(unit?.name).toContain(expectedName);
    }
  }

  async expectEmptyBoardCell(x: number, y: number): Promise<void> {
    const content = await this.getBoardCellContent(x, y);
    expect(content).toBe('Empty');
  }
}

export interface SummonUnitInfo {
  name: string;
  level: number;
  hp: string;
  position: { x: number; y: number };
}

export interface GameState {
  currentPlayer: string;
  currentPhase: string;
  playerAVP: number;
  playerBVP: number;
  playerAHandCount: number;
  playerBHandCount: number;
  playerADeckCount: number;
  playerBDeckCount: number;
}

export async function captureGameState(utils: GameTestUtils): Promise<GameState> {
  return {
    currentPlayer: await utils.getCurrentPlayer(),
    currentPhase: await utils.getCurrentPhase(),
    playerAVP: await utils.getPlayerVictoryPoints('A'),
    playerBVP: await utils.getPlayerVictoryPoints('B'),
    playerAHandCount: await utils.getPlayerHandCount('A'),
    playerBHandCount: await utils.getPlayerHandCount('B'),
    playerADeckCount: await utils.getPlayerDeckCount('A'),
    playerBDeckCount: await utils.getPlayerDeckCount('B'),
  };
}