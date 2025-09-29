#!/usr/bin/env node

/**
 * Interactive CLI tool for testing the Summoner's Grid game engine
 * 
 * Provides a "soft" client for manually testing various pieces of the engine
 * with dynamic command execution and real-time state inspection.
 */

import { createInterface, Interface } from 'readline';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createGameEngine, GameEngine } from './index';
import { 
  ActionType, 
  PlayCardAction, 
  MoveSummonAction, 
  AttackAction, 
  PassPriorityAction 
} from './types/action';
import { Card, SummonCard, ActionCard } from './types/card';
import { Phase, CardType, Attribute, SpeedLevel, RoleType } from './types/base';

// Handle __dirname in CommonJS
const __dirname = dirname(__filename);

class SummonersGridCLI {
  private rl: Interface;
  private engine: GameEngine | null = null;
  private cardDatabase: Card[] = [];
  private currentPlayerId: string = '';

  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'summoners-grid> '
    });

    this.loadCardDatabase();
    this.setupEventHandlers();
  }

  private loadCardDatabase(): void {
    try {
      // Load alpha set cards
      const alphaSetPath = join(__dirname, 'data/cards/alpha-set.json');
      const summonsPath = join(__dirname, 'data/cards/summons.json');
      
      if (existsSync(alphaSetPath)) {
        const alphaCards = JSON.parse(readFileSync(alphaSetPath, 'utf8'));
        this.cardDatabase.push(...alphaCards);
      }

      if (existsSync(summonsPath)) {
        const summonCards = JSON.parse(readFileSync(summonsPath, 'utf8'));
        this.cardDatabase.push(...summonCards);
      }

      console.log(`📚 Loaded ${this.cardDatabase.length} cards from database`);
    } catch (error) {
      console.warn('⚠️  Could not load card database, using empty database');
      this.cardDatabase = [];
    }
  }

  private setupEventHandlers(): void {
    this.rl.on('line', (input) => this.handleCommand(input.trim()));
    this.rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    });
  }

  public start(): void {
    console.log('🎮 Summoner\'s Grid Engine CLI Tool');
    console.log('=====================================');
    console.log('Type "help" for available commands');
    console.log('');
    this.rl.prompt();
  }

  private handleCommand(input: string): void {
    const [command, ...args] = input.split(' ');

    try {
      switch (command.toLowerCase()) {
        case 'help':
        case 'h':
          this.showHelp();
          break;

        case 'new':
        case 'create':
          this.createGame();
          break;

        case 'player':
        case 'add-player':
          this.addPlayer(args[0], args.slice(1).join(' ') || args[0]);
          break;

        case 'deck':
        case 'load-deck':
          this.loadDeck(args[0], args.slice(1));
          break;

        case 'start':
          this.startGame();
          break;

        case 'state':
        case 'status':
          this.showGameState();
          break;

        case 'phase':
        case 'advance':
          this.advancePhase();
          break;

        case 'actions':
        case 'legal':
          this.showLegalActions(args[0] || this.currentPlayerId);
          break;

        case 'play':
          this.playCard(args);
          break;

        case 'move':
          this.moveSummon(args);
          break;

        case 'attack':
          this.attackWithSummon(args);
          break;

        case 'pass':
          this.passPriority(args[0] || this.currentPlayerId);
          break;

        case 'cards':
        case 'list-cards':
          this.listCards(args[0]);
          break;

        case 'summons':
          this.showSummons(args[0] || this.currentPlayerId);
          break;

        case 'events':
          this.showEvents();
          break;

        case 'serialize':
        case 'save':
          this.serializeGame();
          break;

        case 'current':
        case 'player-current':
          this.setCurrentPlayer(args[0]);
          break;

        case 'clear':
          console.clear();
          break;

        case '':
          // Empty line, just prompt again
          break;

        default:
          console.log(`❌ Unknown command: ${command}`);
          console.log('Type "help" for available commands');
      }
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : error}`);
    }

    this.rl.prompt();
  }

  private showHelp(): void {
    console.log(`
🎮 Summoner's Grid Engine CLI Commands:

Game Management:
  new, create              Create a new game engine instance
  player <id> [name]       Add a player to the game
  deck <playerId> [cards]  Load deck for player (use card IDs or shortcuts)
  start                    Start the game
  current <playerId>       Set current player context for commands

Game State:
  state, status            Show current game state summary
  phase, advance           Advance to next phase
  summons [playerId]       Show summons for player
  events                   Show recent game events
  serialize, save          Serialize current game state to JSON

Actions:
  actions [playerId]       Show legal actions for player
  play <cardId> [args]     Play a card (use "cards" to see available cards)
  move <summonId> <x> <y>  Move a summon to coordinates
  attack <attackerId> <targetId>  Attack target with summon
  pass [playerId]          Pass priority

Card Database:
  cards [filter]           List available cards (filter by type/name)
  list-cards [filter]      Same as cards

Utilities:
  clear                    Clear screen
  help, h                  Show this help message

Examples:
  new
  player alice "Alice Player"
  player bob "Bob Player"  
  deck alice gignen-warrior-001 005-sharpened-blade
  start
  phase
  phase
  actions alice
  play gignen-warrior-001 5 2
`);
  }

  private createGame(): void {
    this.engine = createGameEngine();
    console.log('✅ Created new game engine');
  }

  private addPlayer(playerId: string, playerName: string): void {
    if (!this.engine) {
      throw new Error('No game engine created. Use "new" command first.');
    }

    this.engine.addPlayer(playerId, playerName);
    console.log(`✅ Added player: ${playerName} (${playerId})`);
    
    if (!this.currentPlayerId) {
      this.currentPlayerId = playerId;
      console.log(`🎯 Set current player context to: ${playerId}`);
    }
  }

  private loadDeck(playerId: string, cardIds: string[]): void {
    if (!this.engine) {
      throw new Error('No game engine created. Use "new" command first.');
    }

    if (cardIds.length === 0) {
      // Load a default deck
      const defaultDeck = this.createDefaultDeck();
      this.engine.loadDeck(playerId, defaultDeck);
      console.log(`✅ Loaded default deck for ${playerId} (${defaultDeck.length} cards)`);
      return;
    }

    const deck: Card[] = [];
    for (const cardId of cardIds) {
      const card = this.findCard(cardId);
      if (card) {
        deck.push(card);
      } else {
        console.warn(`⚠️  Card not found: ${cardId}`);
      }
    }

    if (deck.length > 0) {
      this.engine.loadDeck(playerId, deck);
      console.log(`✅ Loaded deck for ${playerId} (${deck.length} cards)`);
    } else {
      console.log(`❌ No valid cards found in deck specification`);
    }
  }

  private startGame(): void {
    if (!this.engine) {
      throw new Error('No game engine created. Use "new" command first.');
    }

    this.engine.startGame();
    console.log('✅ Game started!');
    this.showGameState();
  }

  private showGameState(): void {
    if (!this.engine) {
      console.log('❌ No game engine created');
      return;
    }

    const state = this.engine.getState();
    console.log(`
🎮 Game State:
  Game ID: ${state.gameId}
  Turn: ${state.turnState.turnNumber}
  Phase: ${state.turnState.phase}
  Current Player: ${state.turnState.currentPlayer}
  Effect Stack: ${state.effectStack.length} effects
  Priority Queue: ${state.priorityQueue.length} windows

👥 Players:`);

    for (const [playerId, player] of Object.entries(state.players)) {
      const priority = player.priority ? '🎯' : '  ';
      const vp = player.victoryPoints.length;
      console.log(`  ${priority} ${player.name} (${playerId}): ${vp} VP, ${player.summons.length} summons, ${player.zones.hand.length} cards in hand`);
    }

    if (state.effectStack.length > 0) {
      console.log(`\n⚡ Effect Stack (LIFO):`);
      state.effectStack.slice().reverse().forEach((effect, index) => {
        console.log(`  ${index + 1}. ${effect.effectId} (${effect.speed}) by ${effect.ownerId}`);
      });
    }
  }

  private advancePhase(): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    this.engine.advancePhase();
    console.log('✅ Advanced to next phase');
    this.showGameState();
  }

  private showLegalActions(playerId: string): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    const actions = this.engine.getLegalActions(playerId);
    console.log(`\n🎯 Legal Actions for ${playerId}:`);
    
    if (actions.length === 0) {
      console.log('  No legal actions available');
      return;
    }

    actions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.type} - ${this.formatAction(action)}`);
    });
  }

  private playCard(args: string[]): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    if (args.length < 1) {
      throw new Error('Usage: play <cardId> [x] [y] [targetId]');
    }

    const [cardId, x, y, targetId] = args;
    const playerId = this.currentPlayerId;

    if (!playerId) {
      throw new Error('No current player set. Use "current <playerId>" first.');
    }

    const action: PlayCardAction = {
      type: ActionType.PlayCard,
      playerId,
      cardId,
      timestamp: Date.now(),
      position: x && y ? { x: parseInt(x), y: parseInt(y) } : undefined,
      targets: targetId ? [targetId] : undefined
    };

    this.engine.submitAction(action);
    console.log(`✅ Played card: ${cardId}`);
    this.showGameState();
  }

  private moveSummon(args: string[]): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    if (args.length < 3) {
      throw new Error('Usage: move <summonId> <x> <y>');
    }

    const [summonId, x, y] = args;
    const playerId = this.currentPlayerId;

    if (!playerId) {
      throw new Error('No current player set. Use "current <playerId>" first.');
    }

    // Find the current position of the summon
    const state = this.engine.getState();
    const player = state.players[playerId];
    const summon = player?.summons.find(s => s.id === summonId);

    if (!summon) {
      throw new Error(`Summon ${summonId} not found`);
    }

    const action: MoveSummonAction = {
      type: ActionType.MoveSummon,
      playerId,
      summonId,
      fromPosition: summon.position,
      toPosition: { x: parseInt(x), y: parseInt(y) },
      movementCost: 1, // Simplified
      timestamp: Date.now()
    };

    this.engine.submitAction(action);
    console.log(`✅ Moved summon ${summonId} to (${x}, ${y})`);
    this.showGameState();
  }

  private attackWithSummon(args: string[]): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    if (args.length < 2) {
      throw new Error('Usage: attack <attackerId> <targetId>');
    }

    const [attackerId, targetId] = args;
    const playerId = this.currentPlayerId;

    if (!playerId) {
      throw new Error('No current player set. Use "current <playerId>" first.');
    }

    const action: AttackAction = {
      type: ActionType.AttackWithSummon,
      playerId,
      attackerId,
      targetId,
      timestamp: Date.now()
    };

    this.engine.submitAction(action);
    console.log(`✅ ${attackerId} attacked ${targetId}`);
    this.showGameState();
  }

  private passPriority(playerId: string): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    const action: PassPriorityAction = {
      type: ActionType.PassPriority,
      playerId: playerId || this.currentPlayerId,
      timestamp: Date.now()
    };

    this.engine.submitAction(action);
    console.log(`✅ ${playerId} passed priority`);
    this.showGameState();
  }

  private listCards(filter?: string): void {
    console.log(`\n📚 Available Cards (${this.cardDatabase.length} total):`);
    
    let filteredCards = this.cardDatabase;
    if (filter) {
      const filterLower = filter.toLowerCase();
      filteredCards = this.cardDatabase.filter(card => 
        card.name.toLowerCase().includes(filterLower) ||
        card.type.toLowerCase().includes(filterLower) ||
        card.id.toLowerCase().includes(filterLower)
      );
    }

    if (filteredCards.length === 0) {
      console.log('  No cards found matching filter');
      return;
    }

    filteredCards.slice(0, 20).forEach(card => {
      console.log(`  ${card.id} - ${card.name} (${card.type}) - ${card.attribute}`);
    });

    if (filteredCards.length > 20) {
      console.log(`  ... and ${filteredCards.length - 20} more cards`);
    }
  }

  private showSummons(playerId: string): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    const state = this.engine.getState();
    const player = state.players[playerId];

    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`\n⚔️  Summons for ${player.name}:`);
    
    if (player.summons.length === 0) {
      console.log('  No summons deployed');
      return;
    }

    player.summons.forEach(summon => {
      const hp = `${summon.combatStats.hp - summon.damage}/${summon.combatStats.hp}`;
      const pos = `(${summon.position.x}, ${summon.position.y})`;
      const status = summon.hasAttacked ? '🗡️' : summon.movementUsed > 0 ? '👟' : '✨';
      console.log(`  ${status} ${summon.id} - Level ${summon.level} - HP: ${hp} - Position: ${pos}`);
    });
  }

  private showEvents(): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    const events = this.engine.getEvents();
    console.log(`\n📋 Recent Events (${events.length} total):`);
    
    events.slice(-10).forEach((event, index) => {
      const time = new Date(event.timestamp).toLocaleTimeString();
      console.log(`  ${events.length - 10 + index + 1}. [${time}] ${event.type} by ${event.playerId}`);
    });
  }

  private serializeGame(): void {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    const json = this.engine.serialize();
    console.log('\n💾 Serialized Game State:');
    console.log(json);
  }

  private setCurrentPlayer(playerId: string): void {
    this.currentPlayerId = playerId;
    console.log(`🎯 Set current player context to: ${playerId}`);
  }

  // Helper methods
  private findCard(cardId: string): Card | undefined {
    return this.cardDatabase.find(card => 
      card.id === cardId || 
      card.name.toLowerCase() === cardId.toLowerCase()
    );
  }

  private createDefaultDeck(): Card[] {
    // Create a simple default deck with available cards
    const deck: Card[] = [];
    
    // Add some summons
    const summons = this.cardDatabase.filter(card => card.type === 'summon').slice(0, 3);
    deck.push(...summons);
    
    // Add some action cards
    const actions = this.cardDatabase.filter(card => card.type === 'action').slice(0, 5);
    deck.push(...actions);
    
    return deck;
  }

  private formatAction(action: any): string {
    switch (action.type) {
      case ActionType.PlayCard:
        return `Play ${action.cardId}${action.position ? ` at (${action.position.x}, ${action.position.y})` : ''}`;
      case ActionType.MoveSummon:
        return `Move ${action.summonId} to (${action.toPosition.x}, ${action.toPosition.y})`;
      case ActionType.AttackWithSummon:
        return `Attack ${action.targetId} with ${action.attackerId}`;
      case ActionType.PassPriority:
        return 'Pass priority';
      case ActionType.AdvancePhase:
        return `Advance from ${action.fromPhase} to ${action.toPhase}`;
      default:
        return 'Unknown action';
    }
  }
}

export { SummonersGridCLI };

// Main execution
if (require.main === module) {
  const cli = new SummonersGridCLI();
  cli.start();
}