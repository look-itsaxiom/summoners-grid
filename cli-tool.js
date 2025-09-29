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
      // Load alpha set cards - use src directory since data files aren't copied to dist
      const alphaSetPath = path.join(__dirname, 'src/data/cards/alpha-set.json');
      const summonsPath = path.join(__dirname, 'src/data/cards/summons.json');
      
      if (fs.existsSync(alphaSetPath)) {
        const alphaCards = JSON.parse(fs.readFileSync(alphaSetPath, 'utf8'));
        this.cardDatabase.push(...alphaCards);
        console.log(`📚 Loaded ${alphaCards.length} alpha set cards`);
      }

      if (fs.existsSync(summonsPath)) {
        const summonCards = JSON.parse(fs.readFileSync(summonsPath, 'utf8'));
        this.cardDatabase.push(...summonCards);
        console.log(`📚 Loaded ${summonCards.length} summon cards`);
      }

      console.log(`📚 Total cards loaded: ${this.cardDatabase.length}`);
    } catch (error) {
      console.warn('⚠️  Could not load card database:', error.message);
      console.warn('⚠️  Using empty database - you can still test basic engine functionality');
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

        case 'play':
          this.playCard(args);
          break;

        case 'current':
          this.setCurrentPlayer(args[0]);
          break;

        case 'hand':
          this.showHand(args[0] || this.currentPlayerId);
          break;

        case 'debug':
          this.debugPlayer(args[0] || this.currentPlayerId);
          break;

        case 'draw':
          this.drawCard(args[0] || this.currentPlayerId);
          break;

        case 'clear':
          console.clear();
          break;

        case 'quit':
        case 'exit':
          console.log('\n👋 Goodbye!');
          process.exit(0);
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

=== Quick Start Guide ===
1. new                      # Create game engine
2. player alice "Alice"     # Add first player
3. player bob "Bob"         # Add second player  
4. deck alice               # Load default deck for Alice
5. deck bob                 # Load default deck for Bob
6. start                    # Start the game
7. state                    # See current game state
8. phase                    # Advance through phases

=== Game Management ===
  new, create              Create a new game engine instance
  player <id> [name]       Add a player to the game
  deck <playerId>          Load default deck for player
  start                    Start the game
  current <playerId>       Set current player context

=== Turn Phases (GDD-based) ===
  phase, advance           Advance to next phase
  state, status            Show game state with phase guidance
  
  Phase Flow: DRAW → LEVEL → ACTION → END
  • Draw: Draw 1 card (skipped first turn)
  • Level: All summons gain 1 level  
  • Action: Play cards, move, attack
  • End: Discard to 6 cards, pass turn

=== Action Phase Commands ===
  actions [playerId]       Show legal actions for current phase
  hand [playerId]          Show player's cards in hand
  play <cardName>          Play a card by name (e.g. "Gignen Warrior")
  summons [playerId]       Show deployed summons
  cards [filter]           Browse available cards

=== Card Database ===
  cards                    List all available cards
  cards summon             Show only summon cards
  cards action             Show only action cards

=== Examples from Play Example ===
  play "Gignen Warrior"    # Deploy summon (triggers draw 3)
  play "Rush"              # Play action card
  play "Blast Bolt"        # Play magic attack

=== Utilities ===
  clear                    Clear screen
  help, h                  Show this help message

💡 Tip: Start with the Quick Start Guide above!
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
    const summons = defaultDeck.filter(card => card.type === 'summon');
    const mainDeck = defaultDeck.filter(card => card.type !== 'summon');
    
    this.engine.loadDeck(playerId, defaultDeck);
    console.log(`✅ Loaded deck for ${playerId}:`);
    console.log(`   📋 ${summons.length} summon cards → starting hand`);
    console.log(`   🎴 ${mainDeck.length} main deck cards → draw pile`);
    console.log(`   💡 According to GDD, players start with all 3 summons in hand`);
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
  Game ID: ${state.gameId.substring(0, 8)}...
  Turn: ${state.turnState.turnNumber}
  Phase: ${state.turnState.phase.toUpperCase()}
  Current Player: ${state.turnState.currentPlayer}
  Effect Stack: ${state.effectStack.length} effects

👥 Players:`);

    for (const [playerId, player] of Object.entries(state.players)) {
      const priority = player.priority ? '🎯' : '  ';
      const vp = player.victoryPoints.length;
      const handSize = player.zones.hand.length;
      console.log(`  ${priority} ${player.name} (${playerId}): ${vp} VP, ${player.summons.length} summons, ${handSize} cards in hand`);
    }

    // Show phase-specific guidance
    this.showPhaseGuidance(state.turnState.phase, state.turnState.currentPlayer);
  }

  showPhaseGuidance(phase, currentPlayer) {
    console.log(`\n💡 Phase Guidance (${phase.toUpperCase()}):`);
    
    switch (phase) {
      case 'draw':
        console.log('  → Draw 1 card from Main Deck (or shuffle Recharge Pile if needed)');
        console.log('  → Use "phase" command to advance to Level Phase');
        break;
      
      case 'level':
        console.log('  → All your summons automatically gain 1 level');
        console.log('  → HP damage is retained (not proportional to new max HP)');
        console.log('  → Use "phase" command to advance to Action Phase');
        break;
      
      case 'action':
        console.log('  → Play ONE summon per turn (triggers draw 3 cards)');
        console.log('  → Play action cards, buildings, quests');
        console.log('  → Move summons (split movement before/after actions)');
        console.log('  → Attack with summons (once per summon per turn)');
        console.log('  → Available commands: play, move, attack, actions');
        break;
      
      case 'end':
        console.log('  → Discard down to 6 cards if hand size > 6');
        console.log('  → Turn passes to opponent');
        console.log('  → Use "phase" command to end turn');
        break;
    }
    
    if (currentPlayer === this.currentPlayerId) {
      console.log(`  🎯 It's your turn! Try "actions ${currentPlayer}" to see what you can do.`);
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

  playCard(args) {
    if (!this.engine) {
      throw new Error('No game engine created. Use "new" command first.');
    }

    if (args.length < 1) {
      console.log('❌ Usage: play <cardName>');
      console.log('💡 Examples:');
      console.log('   play "Gignen Warrior"');
      console.log('   play "Rush"');
      console.log('   play "Blast Bolt"');
      console.log('💡 Use "cards" to see available cards');
      return;
    }

    const cardName = args.join(' ').replace(/"/g, ''); // Remove quotes and join args
    const playerId = this.currentPlayerId;

    if (!playerId) {
      throw new Error('No current player set. Use "current <playerId>" first.');
    }

    // Find card by name in player's hand
    const state = this.engine.getState();
    const player = state.players[playerId];
    
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Look for card in hand by name
    const cardInHand = player.zones.hand.find(card => 
      card.name.toLowerCase() === cardName.toLowerCase() ||
      card.id.toLowerCase() === cardName.toLowerCase()
    );

    if (!cardInHand) {
      console.log(`❌ Card "${cardName}" not found in ${player.name}'s hand`);
      console.log(`💡 Cards in hand:`);
      player.zones.hand.forEach(card => {
        console.log(`   • ${card.name} (${card.type})`);
      });
      return;
    }

    try {
      // Create play action - for now using basic structure
      const action = {
        type: 'playCard',
        playerId,
        cardId: cardInHand.id,
        timestamp: Date.now()
      };

      this.engine.submitAction(action);
      console.log(`✅ ${player.name} played "${cardInHand.name}"`);
      
      // Show updated state
      this.showGameState();
      
      // Show updated hand
      console.log(`\n🃏 ${player.name}'s remaining hand:`);
      const updatedState = this.engine.getState();
      const updatedPlayer = updatedState.players[playerId];
      updatedPlayer.zones.hand.forEach(card => {
        console.log(`   • ${card.name} (${card.type})`);
      });
      
    } catch (error) {
      console.log(`❌ Cannot play "${cardInHand.name}": ${error.message}`);
      console.log(`💡 Try "actions ${playerId}" to see what you can do right now`);
    }
  }

  createDefaultDeck() {
    // Create a deck according to GDD: exactly 3 summon cards + main deck cards
    const deck = [];
    
    // Add exactly 3 summons (these will go to starting hand per GDD)
    // Use the first 3 summons for consistency
    const allSummons = this.cardDatabase.filter(card => card.type === 'summon');
    const selectedSummons = allSummons.slice(0, 3);
    deck.push(...selectedSummons);
    
    // Add main deck cards (actions, buildings, quests, counters)
    // These go to the main deck for drawing during the game
    const mainDeckCards = this.cardDatabase.filter(card => 
      card.type !== 'summon' && 
      ['action', 'building', 'quest', 'counter'].includes(card.type)
    );
    deck.push(...mainDeckCards);
    
    return deck;
  }

  showHand(playerId) {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    const state = this.engine.getState();
    const player = state.players[playerId];

    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`\n🃏 ${player.name}'s Hand (${player.zones.hand.length} cards):`);
    
    if (player.zones.hand.length === 0) {
      console.log('  No cards in hand');
      return;
    }

    // Group cards by type for better display
    const summons = player.zones.hand.filter(card => card.type === 'summon');
    const others = player.zones.hand.filter(card => card.type !== 'summon');

    if (summons.length > 0) {
      console.log(`  🏹 Summon Cards (${summons.length}):`);
      summons.forEach((card, index) => {
        console.log(`    ${index + 1}. ${card.name} (${card.species} ${card.role})`);
      });
    }

    if (others.length > 0) {
      console.log(`  🎴 Other Cards (${others.length}):`);
      others.forEach((card, index) => {
        const cost = card.cost?.type === 'role_requirement' ? 
          `Req: ${card.cost.requirements.roles.join(', ')}` : 
          'No cost';
        console.log(`    ${summons.length + index + 1}. ${card.name} (${card.type}) - ${cost}`);
      });
    }
  }

  debugPlayer(playerId) {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    const state = this.engine.getState();
    const player = state.players[playerId];

    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`\n🔧 Debug Info for ${player.name}:`);
    console.log(`  Hand: ${player.zones.hand.length} cards`);
    console.log(`  Main Deck: ${player.zones.mainDeck.length} cards`);
    console.log(`  Recharge Pile: ${player.zones.rechargePile.length} cards`);
    console.log(`  Discard Pile: ${player.zones.discardPile.length} cards`);
    console.log(`  Summons: ${player.summons.length}`);
    
    if (player.zones.mainDeck.length > 0) {
      console.log(`  Top card of deck: ${player.zones.mainDeck[0].name}`);
    }
  }

  drawCard(playerId) {
    if (!this.engine) {
      throw new Error('No game engine created');
    }

    console.log(`💡 Manual draw functionality - this should normally be handled by phase progression`);
    console.log(`💡 According to GDD: Draw 1 card in Draw phase (skipped first turn)`);
    console.log(`💡 Players should have starting hands - this might be an engine issue`);
    
    // Show the player some cards manually for testing
    const state = this.engine.getState();
    const player = state.players[playerId];
    
    if (player && player.zones.mainDeck.length > 0) {
      console.log(`🃏 ${player.name} would draw: ${player.zones.mainDeck[0].name}`);
    }
  }
}

// Main execution
if (require.main === module) {
  console.log('🧪 Starting CLI Tool...');
  const cli = new SummonersGridCLI();
  cli.start();
}

module.exports = { SummonersGridCLI };