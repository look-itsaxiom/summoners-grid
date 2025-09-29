#!/usr/bin/env node

/**
 * Interactive CLI tool for testing the Summoner's Grid game engine
 * CommonJS version for better compatibility
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Import the compiled engine
const { createGameEngine } = require('./dist/index.js');

class SummonersGridCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'summoners-grid> '
    });

    this.engine = null;
    this.cardDatabase = [];
    this.currentPlayerId = '';

    this.loadCardDatabase();
    this.setupEventHandlers();
  }

  loadCardDatabase() {
    try {
      // Load alpha set cards
      const alphaSetPath = path.join(__dirname, 'dist/data/cards/alpha-set.json');
      const summonsPath = path.join(__dirname, 'dist/data/cards/summons.json');
      
      if (fs.existsSync(alphaSetPath)) {
        const alphaCards = JSON.parse(fs.readFileSync(alphaSetPath, 'utf8'));
        this.cardDatabase.push(...alphaCards);
      }

      if (fs.existsSync(summonsPath)) {
        const summonCards = JSON.parse(fs.readFileSync(summonsPath, 'utf8'));
        this.cardDatabase.push(...summonCards);
      }

      console.log(`📚 Loaded ${this.cardDatabase.length} cards from database`);
    } catch (error) {
      console.warn('⚠️  Could not load card database, using empty database');
      this.cardDatabase = [];
    }
  }

  setupEventHandlers() {
    this.rl.on('line', (input) => this.handleCommand(input.trim()));
    this.rl.on('close', () => {
      console.log('\n👋 Goodbye!');
      process.exit(0);
    });
  }

  start() {
    console.log('🎮 Summoner\'s Grid Engine CLI Tool');
    console.log('=====================================');
    console.log('Type "help" for available commands');
    console.log('');
    this.rl.prompt();
  }

  handleCommand(input) {
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

        case 'cards':
        case 'list-cards':
          this.listCards(args[0]);
          break;

        case 'current':
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
      console.error(`❌ Error: ${error.message}`);
    }

    this.rl.prompt();
  }

  showHelp() {
    console.log(`
🎮 Summoner's Grid Engine CLI Commands:

Game Management:
  new, create              Create a new game engine instance
  player <id> [name]       Add a player to the game
  deck <playerId> [cards]  Load deck for player
  start                    Start the game
  current <playerId>       Set current player context

Game State:
  state, status            Show current game state summary
  phase, advance           Advance to next phase
  actions [playerId]       Show legal actions for player

Card Database:
  cards [filter]           List available cards
  list-cards [filter]      Same as cards

Utilities:
  clear                    Clear screen
  help, h                  Show this help message

Examples:
  new
  player alice "Alice Player"
  player bob "Bob Player"  
  start
  phase
  actions alice
`);
  }

  createGame() {
    this.engine = createGameEngine();
    console.log('✅ Created new game engine');
  }

  addPlayer(playerId, playerName) {
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

  loadDeck(playerId, cardIds) {
    if (!this.engine) {
      throw new Error('No game engine created. Use "new" command first.');
    }

    // For now, load a simple default deck
    const defaultDeck = this.createDefaultDeck();
    this.engine.loadDeck(playerId, defaultDeck);
    console.log(`✅ Loaded default deck for ${playerId} (${defaultDeck.length} cards)`);
  }

  startGame() {
    if (!this.engine) {
      throw new Error('No game engine created. Use "new" command first.');
    }

    this.engine.startGame();
    console.log('✅ Game started!');
    this.showGameState();
  }

  showGameState() {
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

👥 Players:`);

    for (const [playerId, player] of Object.entries(state.players)) {
      const priority = player.priority ? '🎯' : '  ';
      const vp = player.victoryPoints.length;
      console.log(`  ${priority} ${player.name} (${playerId}): ${vp} VP, ${player.summons.length} summons`);
    }
  }

  advancePhase() {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    this.engine.advancePhase();
    console.log('✅ Advanced to next phase');
    this.showGameState();
  }

  showLegalActions(playerId) {
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
      console.log(`  ${index + 1}. ${action.type}`);
    });
  }

  listCards(filter) {
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

    filteredCards.slice(0, 10).forEach(card => {
      console.log(`  ${card.id} - ${card.name} (${card.type})`);
    });

    if (filteredCards.length > 10) {
      console.log(`  ... and ${filteredCards.length - 10} more cards`);
    }
  }

  setCurrentPlayer(playerId) {
    this.currentPlayerId = playerId;
    console.log(`🎯 Set current player context to: ${playerId}`);
  }

  createDefaultDeck() {
    // Create a simple default deck with available cards
    const deck = [];
    
    // Add some summons
    const summons = this.cardDatabase.filter(card => card.type === 'summon').slice(0, 3);
    deck.push(...summons);
    
    // Add some action cards
    const actions = this.cardDatabase.filter(card => card.type === 'action').slice(0, 5);
    deck.push(...actions);
    
    return deck;
  }
}

// Main execution
if (require.main === module) {
  console.log('🧪 Starting CLI Tool...');
  const cli = new SummonersGridCLI();
  cli.start();
}

module.exports = { SummonersGridCLI };