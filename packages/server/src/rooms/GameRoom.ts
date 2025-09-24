import { Room, Client } from 'colyseus';
import {
  GameState,
  Player,
  CardInstance,
  GamePhase,
  PlayerID,
  SummonInstance,
} from '@summoners-grid/common';
import { cardData } from '@summoners-grid/common/game/data/card-data';
import { recalculateSummonStats, calculateCombat } from '@summoners-grid/common/game/utils';
import { v4 as uuidv4 } from 'uuid';
import { CardType } from '@summoners-grid/common/game/types';

// --- DECKLISTS (omitted for brevity, same as before) ---
const playerADeck = {
  summonSlots: ['pa-gignen-warrior', 'pa-gignen-magician', 'pa-gignen-scout'],
  mainDeck: [
    '005-sharpened-blade', '006-healing-hands', '004-gignen-country',
    '037-nearwood-forest-expedition', '009-rush', '013-adventurous-spirit'
  ],
  advanceDeck: ['040-alrecht-barkstep', 'custom-berserker-rage'],
};

const playerBDeck = {
  summonSlots: ['pb-stoneheart-warrior', 'pb-fae-magician', 'pb-wilderling-scout'],
  mainDeck: [
    '001-blast-bolt', '003-dramatic-return', '011-ensnare', '010-dark-altar',
    '012-drain-touch', '015-spell-recall', '016-life-alchemy',
    '017-dual-shot', '041-graverobbing'
  ],
  advanceDeck: ['039-shadow-pact'],
};


export class GameRoom extends Room<GameState> {
  maxClients = 2;

  onCreate(options: any) {
    this.setState(new GameState());
    this.state.gameStatusMessage = 'Waiting for players...';
    this.registerMessageHandlers();
    this.clock.start();
    this.clock.setInterval(this.tick.bind(this), 1000);
  }

  registerMessageHandlers() {
    this.onMessage('endTurn', (client) => {
      const player = this.getPlayerBySessionId(client.sessionId);
      if (this.isValidAction(player, GamePhase.ACTION)) this.advanceToPhase(GamePhase.END);
    });

    this.onMessage('playCard', (client, message: { cardInstanceId: string, position?: any, targets?: string[] }) => {
      const player = this.getPlayerBySessionId(client.sessionId);
      if (!this.isValidAction(player, GamePhase.ACTION)) return;
      const cardInHand = player.hand.find(c => c.instanceId === message.cardInstanceId);
      if (!cardInHand) return this.logToGame(`Validation Error: Card not in hand.`);
      const cardDef = cardData[cardInHand.cardId] as any;
      if (cardDef.type === CardType.SUMMON) this.handlePlaySummonCard(player, cardInHand, message.position);
      if (cardDef.type === CardType.ACTION) this.handlePlayActionCard(player, cardInHand, message.targets);
    });

    this.onMessage('moveSummon', (client, message: { summonInstanceId: string, targetPosition: { x: number, y: number }}) => {
        const player = this.getPlayerBySessionId(client.sessionId);
        if (!this.isValidAction(player, GamePhase.ACTION)) return;
        const summon = this.state.board.get(message.summonInstanceId);
        if (!summon || summon.ownerId !== client.sessionId) return this.logToGame(`Validation Error: Summon not found or not owned by player.`);
        if (!summon.canMove) return this.logToGame(`Validation Error: ${summon.name} has already moved.`);
        const distance = Math.max(Math.abs(summon.position.x - message.targetPosition.x), Math.abs(summon.position.y - message.targetPosition.y));
        if (distance === 0 || distance > summon.calculatedProperties.movement) return this.logToGame(`Validation Error: Invalid move distance.`);
        summon.position.x = message.targetPosition.x;
        summon.position.y = message.targetPosition.y;
        summon.canMove = false;
        this.logToGame(`${summon.name} moved to (${summon.position.x}, ${summon.position.y}).`);
    });

    this.onMessage('attack', (client, message: { attackerId: string, defenderId: string }) => {
        const player = this.getPlayerBySessionId(client.sessionId);
        if (!this.isValidAction(player, GamePhase.ACTION)) return;
        const attacker = this.state.board.get(message.attackerId);
        const defender = this.state.board.get(message.defenderId);
        if (!attacker || attacker.ownerId !== client.sessionId) return this.logToGame(`Validation Error: Attacker not found or not owned.`);
        if (!defender || defender.ownerId === client.sessionId) return this.logToGame(`Validation Error: Defender not found or is friendly.`);
        if (!attacker.canAttack) return this.logToGame(`Validation Error: ${attacker.name} has already attacked.`);

        const attackerCardDef = cardData[attacker.cardId] as any;
        const weapon = cardData[attackerCardDef.equipment[0]] as any; // Assumes first equipment is weapon

        const range = weapon.range || 1;
        const distance = Math.max(Math.abs(attacker.position.x - defender.position.x), Math.abs(attacker.position.y - defender.position.y));
        if (distance > range) return this.logToGame(`Validation Error: ${defender.name} is out of range.`);

        this.handleAttack(attacker, defender, { basePower: weapon.power, damageFormula: weapon.damageStat === 'INT' ? 'magical' : 'physical' });
    });
  }

  handleAttack(attacker: SummonInstance, defender: SummonInstance, ability: any) {
    const combatResult = calculateCombat(attacker, defender, ability);
    if (!combatResult.hits) {
        this.logToGame(`${attacker.name}'s attack misses ${defender.name}!`);
        return;
    }

    if (combatResult.isCritical) this.logToGame('Critical Hit!');
    this.logToGame(`${attacker.name} attacks ${defender.name} for ${combatResult.damage} damage!`);
    defender.currentHP -= combatResult.damage;

    if (defender.currentHP <= 0) {
        this.handleSummonDefeat(defender);
    }
    attacker.canAttack = false;
  }

  handleSummonDefeat(summon: SummonInstance) {
    this.logToGame(`${summon.name} has been defeated!`);
    this.state.board.delete(summon.instanceId);
    const opponent = Array.from(this.state.players.values()).find(p => p.sessionId !== summon.ownerId);
    if (opponent) {
        opponent.victoryPoints++;
        this.logToGame(`Player ${opponent.playerId} gains 1 Victory Point!`);
        if (opponent.victoryPoints >= 3) {
            this.state.winner = opponent.playerId;
            this.state.gameStatusMessage = `Player ${opponent.playerId} wins!`;
            this.lock();
        }
    }
  }

  handlePlaySummonCard(player: Player, card: CardInstance, position: {x: number, y: number}) {
    if (player.hasPlayedTurnSummon) return this.logToGame(`Validation Error: Already played a summon this turn.`);
    if (!this.isValidSummonPlacement(player.playerId, position)) return this.logToGame(`Validation Error: Invalid summon placement.`);
    player.hand.splice(player.hand.findIndex(c => c.instanceId === card.instanceId), 1);
    const summon = new SummonInstance();
    summon.instanceId = card.instanceId;
    summon.cardId = card.cardId;
    summon.ownerId = player.sessionId;
    summon.name = cardData[card.cardId].name;
    summon.position.x = position.x;
    summon.position.y = position.y;
    recalculateSummonStats(summon);
    summon.currentHP = summon.calculatedProperties.maxHP;
    this.state.board.set(summon.instanceId, summon);
    player.hasPlayedTurnSummon = true;
    this.logToGame(`${summon.name} summoned to (${position.x}, ${position.y}). Player draws 3 cards.`);
    for (let i = 0; i < 3; i++) this.drawCard(player);
  }

  handlePlayActionCard(player: Player, card: CardInstance, targets: string[]) {
    const cardDef = cardData[card.cardId] as any;
    this.logToGame(`Player ${player.playerId} plays ${cardDef.name}.`);

    switch(card.cardId) {
        case '001-blast-bolt':
            if (!targets || targets.length === 0) return this.logToGame('Validation Error: Blast Bolt requires a target.');
            const target = this.state.board.get(targets[0]);
            if (!target || target.ownerId === player.sessionId) return this.logToGame('Validation Error: Invalid target for Blast Bolt.');

            // For action cards, we need a "caster" summon. For now, we'll assume the first summon is the caster.
            const caster = Array.from(this.state.board.values()).find(s => s.ownerId === player.sessionId);
            if (!caster) return this.logToGame('Validation Error: No summon available to cast the spell.');

            this.handleAttack(caster, target, { basePower: 60, baseAccuracy: 85, damageFormula: 'magical'});
            break;
    }
    player.hand.splice(player.hand.findIndex(c => c.instanceId === card.instanceId), 1);
    player.discardPile.push(card);
  }

  tick() {
    if (!this.state.gameStarted || this.state.currentPhase === GamePhase.ACTION || this.state.winner) return;
    switch (this.state.currentPhase) {
      case GamePhase.DRAW: this.handleDrawPhase(); break;
      case GamePhase.LEVEL: this.handleLevelPhase(); break;
      case GamePhase.END: this.handleEndPhase(); break;
    }
  }

  handleDrawPhase() {
    const player = this.getActivePlayer();
    this.logToGame(`--- Turn ${this.state.turn}: ${player.name}'s Draw Phase ---`);
    if (this.state.turn > 1) this.drawCard(player);
    else this.logToGame(`Skipping draw phase for the first turn.`);
    this.advanceToPhase(GamePhase.LEVEL);
  }

  drawCard(player: Player) {
    if (player.mainDeck.length === 0 && player.rechargePile.length > 0) {
        this.logToGame(`${player.name}'s main deck is empty. Shuffling recharge pile.`);
        player.mainDeck.push(...player.rechargePile);
        player.rechargePile.clear();
        this.shuffleDeck(player.mainDeck);
    }
    if (player.mainDeck.length > 0) {
        const drawnCard = player.mainDeck.pop();
        player.hand.push(drawnCard);
        this.logToGame(`${player.name} drew "${cardData[drawnCard.cardId].name}".`);
    } else this.logToGame(`${player.name}'s deck is empty. Cannot draw.`);
  }

  handleLevelPhase() {
    const player = this.getActivePlayer();
    this.logToGame(`--- ${player.name}'s Level Phase ---`);
    this.state.board.forEach((summon) => {
      if (summon.ownerId === player.sessionId) {
        summon.level++;
        recalculateSummonStats(summon);
        summon.canMove = true;
        summon.canAttack = true;
        this.logToGame(`${summon.name} leveled up to ${summon.level}! Actions reset.`);
      }
    });
    this.advanceToPhase(GamePhase.ACTION);
  }

  handleEndPhase() {
    const player = this.getActivePlayer();
    this.logToGame(`--- ${player.name}'s End Phase ---`);
    while (player.hand.length > 6) {
      const discardedCard = player.hand.pop();
      player.rechargePile.push(discardedCard);
      this.logToGame(`${player.name} discards "${cardData[discardedCard.cardId].name}".`);
    }
    player.hasPlayedTurnSummon = false;
    this.state.turn++;
    this.state.activePlayerId = this.state.activePlayerId === 'A' ? 'B' : 'A';
    this.advanceToPhase(GamePhase.DRAW);
  }

  advanceToPhase(newPhase: GamePhase) {
    this.state.currentPhase = newPhase;
    this.logToGame(`Advancing to ${newPhase} Phase.`);
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.sessionId = client.sessionId;
    player.name = options.name || 'Anonymous';
    player.playerId = this.state.players.size === 0 ? 'A' : 'B';
    this.state.players.set(client.sessionId, player);
    this.logToGame(`Player ${player.playerId} (${player.name}) has joined.`);
    if (this.state.players.size === 2) {
      this.lock();
      this.startGame();
    }
  }

  startGame() {
    this.state.gameStarted = true;
    this.state.players.forEach((player) => {
      const decklist = player.playerId === 'A' ? playerADeck : playerBDeck;
      player.hand.push(...this.createDeck(decklist.summonSlots));
      const mainDeck = this.createDeck(decklist.mainDeck);
      this.shuffleDeck(mainDeck);
      player.mainDeck.push(...mainDeck);
      player.advanceDeck.push(...this.createDeck(decklist.advanceDeck));
    });
    const firstPlayerId = Math.random() < 0.5 ? 'A' : 'B';
    this.state.activePlayerId = firstPlayerId;
    this.state.turn = 1;
    this.advanceToPhase(GamePhase.DRAW);
    this.logToGame(`Game started. Player ${firstPlayerId} will go first.`);
  }

  private createDeck(cardIds: string[]): CardInstance[] {
    return cardIds.map((id) => {
      const card = new CardInstance();
      card.instanceId = uuidv4();
      card.cardId = id;
      return card;
    });
  }

  private shuffleDeck(deck: CardInstance[]) {
    let currentIndex = deck.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
    }
  }

  private getPlayerBySessionId(sessionId: string): Player { return this.state.players.get(sessionId); }
  private getActivePlayer(): Player { return Array.from(this.state.players.values()).find(p => p.playerId === this.state.activePlayerId); }

  private isValidAction(player: Player, requiredPhase: GamePhase): boolean {
    if (!player || this.state.winner) return false;
    if (this.state.currentPhase !== requiredPhase) return false;
    if (player.playerId !== this.state.activePlayerId) return false;
    return true;
  }

  private isValidSummonPlacement(playerId: PlayerID, position: {x: number, y: number}): boolean {
    if (!position) return false;
    const { x, y } = position;
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return false;
    const territoryRow = playerId === 'A' ? 2 : BOARD_HEIGHT - 3;
    if ((playerId === 'A' && y > territoryRow) || (playerId === 'B' && y < territoryRow)) return false;
    return !Array.from(this.state.board.values()).some(s => s.position.x === x && s.position.y === y);
  }

  private logToGame(message: string) {
    console.log(message);
    this.state.gameLog.push(message);
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.getPlayerBySessionId(client.sessionId);
    if (player) {
      player.connected = false;
      this.logToGame(`Player ${player.playerId} (${player.name}) disconnected.`);
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }
}
