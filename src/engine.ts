import {
    GameState,
    Player,
    Card,
    SummonCard,
    DeckSummon,
    Board,
    Coordinates,
    TurnPhase,
    PlayerAction,
    Effect,
    Zone,
    SummonUnit,
    RoleCard,
    ActionCard,
    CardType,
} from './interfaces';
import { cardDb } from './data/cards';
import { summonDb } from './data/summons';
import * as Formulas from './formulas';
import { SeedableRNG } from './utils';

export class GameEngine {
    private state: GameState;
    private consecutivePasses: number = 0;

    constructor(playerADeck: DeckSummon[], playerBDeck: DeckSummon[], seed: string) {
        this.state = this.initializeGameState(playerADeck, playerBDeck, seed);
    }

    public getGameState(): GameState {
        // Return a deep copy to prevent external mutation
        return JSON.parse(JSON.stringify(this.state));
    }

    public primeHandForTest(playerId: string, card: Card) {
        if (this.state.players[playerId]) {
            this.state.players[playerId].zones.Hand.push(card);
        }
    }

    public submitAction(playerId: string, action: PlayerAction): GameState {
        if (playerId !== this.state.priorityPlayerId) {
            this.state.gameLog.push(`Error: It is not player ${playerId}'s priority.`);
            throw new Error(`It is not player ${playerId}'s priority.`);
        }

        // Any action other than passing resets the pass counter
        if (action.type !== 'PASS_PRIORITY') {
            this.consecutivePasses = 0;
        }

        switch (action.type) {
            case 'PLAY_CARD':
                this.handlePlayCard(playerId, action.payload);
                break;
            // Other actions like 'MOVE_SUMMON' and 'ATTACK' would be handled here
            case 'PASS_PRIORITY':
                this.handlePassPriority(playerId);
                break;
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }

        // After an action, if the stack is empty and both players have passed, check to advance the phase
        if (this.state.stack.length === 0 && this.consecutivePasses >= 2) {
             if (this.state.phase === TurnPhase.Action) {
                this.advancePhase(); // -> End Phase
             }
        }

        return this.getGameState();
    }

    private handlePlayCard(playerId: string, payload: { cardId: string, context: any }) {
        const player = this.state.players[playerId];
        const cardIndex = player.zones.Hand.findIndex(c => c.id === payload.cardId);
        if (cardIndex === -1) throw new Error(`Card ${payload.cardId} not in hand.`);

        const card = player.zones.Hand[cardIndex];

        // This is a simplified check. We'll assume it's a playable Action card.
        if (card.type !== CardType.Action) throw new Error('Only Action cards can be played this way for now.');

        const actionCard = card as ActionCard;

        if (!actionCard.canPlay(this.state, playerId, payload.context)) {
            throw new Error(`Card ${card.name} cannot be played.`);
        }

        // Move card from hand to stack (conceptually) and then to discard/recharge after resolving
        player.zones.Hand.splice(cardIndex, 1);
        // The destination pile will be handled by the effect's resolution

        const effects = actionCard.getEffects(this.state, playerId, payload.context);
        this.state.stack.unshift(...effects); // Add to the front of the stack (LIFO)

        this.state.gameLog.push(`${playerId} plays ${card.name}, adding ${effects.length} effect(s) to the stack.`);
        this.switchPriority();
    }

    private handlePassPriority(playerId: string) {
        this.consecutivePasses++;
        this.state.gameLog.push(`${playerId} passes priority.`);

        if (this.consecutivePasses >= 2 && this.state.stack.length > 0) {
            this.resolveStack();
        } else {
            this.switchPriority();
        }
    }

    private switchPriority() {
        const opponentId = Object.keys(this.state.players).find(id => id !== this.state.activePlayerId)!;
        // In active player's turn, priority goes to opponent first in response.
        // If opponent passes, it comes back to active player.
        this.state.priorityPlayerId = this.state.priorityPlayerId === this.state.activePlayerId ? opponentId : this.state.activePlayerId;
        this.state.gameLog.push(`Priority passes to ${this.state.priorityPlayerId}.`);
    }

    private resolveStack() {
        this.state.gameLog.push('Both players passed. Resolving stack...');

        const effect = this.state.stack.shift(); // Resolve top effect (FIFO on array, but we treat as LIFO conceptually)
        if (!effect) {
            this.state.gameLog.push('Stack is empty.');
            return;
        }

        this.state.gameLog.push(`Resolving: ${effect.description}`);

        // The resolve function mutates and returns the new state
        this.state = effect.resolve(this.state);

        // After resolving, check for any new triggered effects (NYI)

        // After an effect resolves, priority is reset and goes to the opponent of the active player
        this.consecutivePasses = 0;
        const opponentId = Object.keys(this.state.players).find(id => id !== this.state.activePlayerId)!;
        this.state.priorityPlayerId = opponentId;
        this.state.gameLog.push(`Effect resolved. Priority returns to ${this.state.priorityPlayerId}.`);
    }

    private stringToSeed(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    private initializeGameState(playerADeck: DeckSummon[], playerBDeck: DeckSummon[], seed: string): GameState {
        const numericSeed = this.stringToSeed(seed);
        const rng = new SeedableRNG(numericSeed);
        const playerA = this.createPlayer('Player A', playerADeck);
        const playerB = this.createPlayer('Player B', playerBDeck);

        const initialState: GameState = {
            gameId: `game-${Date.now()}`,
            turn: 1,
            activePlayerId: playerA.id,
            priorityPlayerId: playerA.id,
            phase: TurnPhase.Action, // Start in action phase for testing
            players: { [playerA.id]: playerA, [playerB.id]: playerB },
            board: this.createBoard(),
            stack: [],
            rng: () => rng.next(),
            gameLog: ['Game initialized.'],
        };

        // For testing, we can pre-summon units like in the play example
        this.summonUnitForPlayer(initialState, playerA.id, playerADeck[0], {x: 5, y: 2});
        this.summonUnitForPlayer(initialState, playerB.id, playerBDeck[0], {x: 5, y: 11});

        return initialState;
    }

    private summonUnitForPlayer(state: GameState, playerId: string, deckSummon: DeckSummon, position: Coordinates) {
        const player = state.players[playerId];
        const summonCard = deckSummon.summon;
        const id = `${summonCard.species.slice(0,3)}-${Math.floor(state.rng() * 1000)}`;

        const summonUnit: SummonUnit = {
            id,
            cardId: summonCard.id,
            ownerPlayerId: playerId,
            level: 5,
            position,
            role: deckSummon.role,
            equipment: JSON.parse(JSON.stringify(deckSummon.equipment)), // Deep copy
            calculatedStats: {} as any, // will be calculated next
            maxHp: 0,
            movement: 0,
            damageTaken: 0,
            statuses: [],
            hasAttackedThisTurn: false,
            hasMovedThisTurn: 0,
        };
        this.updateSummonStats(summonUnit, summonCard);
        player.summons.push(summonUnit);
        state.board.grid[position.y][position.x].unitId = summonUnit.id;
        state.gameLog.push(`${playerId} summons ${summonUnit.id} at (${position.x}, ${position.y}).`);
    }

    private updateSummonStats(summon: SummonUnit, baseCard: SummonCard) {
        const finalStats = Formulas.calculateAllFinalStats(
            baseCard.baseStats,
            baseCard.growthRates,
            summon.level,
            summon.role,
            summon.equipment
        );
        summon.calculatedStats = finalStats;
        const newMaxHp = Formulas.calculateMaxHp(finalStats.end);
        summon.maxHp = newMaxHp;
        summon.movement = Formulas.calculateMovementSpeed(finalStats.spd);
    }

    // Unchanged methods from before
    private createPlayer(name: string, deck: DeckSummon[]): Player {
        const playerId = name.replace(' ', '-').toLowerCase();
        return {
            id: playerId,
            name: name,
            victoryPoints: 0,
            zones: {
                [Zone.Hand]: [], // Start with empty hand, summon from deck for test
                [Zone.MainDeck]: [],
                [Zone.AdvanceDeck]: [],
                [Zone.DiscardPile]: [],
                [Zone.RechargePile]: [],
            },
            summons: [],
            buildings: [],
        };
    }

    private createBoard(): Board {
        const board: Board = { grid: [] };
        for (let y = 0; y < 14; y++) {
            board.grid[y] = [];
            for (let x = 0; x < 12; x++) {
                board.grid[y][x] = { coordinates: { x, y } };
            }
        }
        return board;
    }

    public advancePhase() {
        // Simplified for now, will be driven by player passing in Action phase
        if (this.state.phase === TurnPhase.Action) {
            this.state.phase = TurnPhase.End;
            this.runEndPhase();
        }
    }

    private runEndPhase() {
        this.state.gameLog.push(`Turn ${this.state.turn} - ${this.state.activePlayerId} - End Phase`);
        this.state.turn++;
        this.state.activePlayerId = this.state.players[this.state.activePlayerId].id === 'player-a' ? 'player-b' : 'player-a';
        this.state.priorityPlayerId = this.state.activePlayerId;
        this.state.phase = TurnPhase.Action; // Loop back to action for next player
        this.state.gameLog.push(`It is now Turn ${this.state.turn}, ${this.state.activePlayerId}'s action phase.`);
    }
}