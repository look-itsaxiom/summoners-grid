import { Speed } from './types.js';
import { Player } from './player.js';
import { Card } from './cards.js';
import { Game } from './game.js';

export interface StackedEffect {
    id: string;
    card: Card;
    controller: Player;
    target?: any;
    speed: Speed;
    execute: (game: Game) => void;
    description: string;
}

export interface GameEvent {
    type: string;
    source?: any;
    target?: any;
    data?: any;
    preventable?: boolean;
    prevented?: boolean;
}

export class EffectStack {
    private effects: StackedEffect[] = [];
    private game: Game;
    private isResolving: boolean = false;
    private pendingEvents: GameEvent[] = [];

    constructor(game: Game) {
        this.game = game;
    }

    // Add effect to stack based on speed priority
    addEffect(effect: StackedEffect): void {
        if (this.isResolving) {
            // During resolution, only allow faster effects
            const topSpeed = this.getTopSpeed();
            if (this.isSpeedFaster(effect.speed, topSpeed)) {
                this.effects.push(effect);
                this.game.addToLog(`${effect.card.name} added to stack (${effect.speed} speed)`);
            } else {
                this.game.addToLog(`Cannot add ${effect.card.name} - speed lock in effect`);
                return;
            }
        } else {
            this.effects.push(effect);
            this.game.addToLog(`${effect.card.name} added to stack (${effect.speed} speed)`);
        }
    }

    // Check if there are effects waiting to resolve
    hasEffects(): boolean {
        return this.effects.length > 0;
    }

    // Get the speed of the top effect on stack
    private getTopSpeed(): Speed | null {
        if (this.effects.length === 0) return null;
        return this.effects[this.effects.length - 1].speed;
    }

    // Check if speed1 is faster than speed2
    private isSpeedFaster(speed1: Speed, speed2: Speed | null): boolean {
        if (speed2 === null) return true;
        
        const speedOrder = {
            [Speed.Counter]: 3,
            [Speed.Reaction]: 2,
            [Speed.Action]: 1
        };
        
        return speedOrder[speed1] > speedOrder[speed2];
    }

    // Resolve the stack (LIFO order)
    async resolveStack(): Promise<void> {
        if (this.isResolving || this.effects.length === 0) return;
        
        this.isResolving = true;
        this.game.addToLog('--- Resolving Effect Stack ---');

        while (this.effects.length > 0) {
            // Get the top effect (most recently added)
            const effect = this.effects.pop()!;
            
            this.game.addToLog(`Resolving: ${effect.card.name}`);
            
            try {
                effect.execute(this.game);
            } catch (error) {
                this.game.addToLog(`Error resolving ${effect.card.name}: ${error}`);
            }

            // Allow for responses after each effect resolves
            await this.checkForResponses();
        }

        this.game.addToLog('--- Stack Resolution Complete ---');
        this.isResolving = false;

        // Process any events that occurred during resolution
        this.processEvents();
    }

    // Check if players want to respond
    private async checkForResponses(): Promise<void> {
        // In a real implementation, this would pause for player input
        // For demo purposes, we'll just check for automatic triggers
        
        // Check for counter card triggers
        this.checkCounterTriggers();
    }

    // Check for counter cards that should automatically trigger
    private checkCounterTriggers(): void {
        // Check both players for set counter cards
        const allPlayers = [this.game.playerA, this.game.playerB];
        
        for (const player of allPlayers) {
            // Check for face-down counter cards in play
            const faceDownCounters = player.faceDownCards || [];
            
            for (const counterCard of faceDownCounters) {
                const counter = counterCard as any; // Type assertion for dynamic properties
                if (counter.shouldTrigger && counter.shouldTrigger(this.game)) {
                    // Activate the counter
                    this.activateCounter(counter, player);
                    // Remove from face-down cards
                    const index = faceDownCounters.indexOf(counterCard);
                    if (index > -1) {
                        faceDownCounters.splice(index, 1);
                    }
                }
            }
        }
    }

    // Activate a counter card
    private activateCounter(counterCard: any, controller: Player): void {
        const effect: StackedEffect = {
            id: `counter-${Date.now()}`,
            card: counterCard,
            controller: controller,
            speed: Speed.Counter,
            execute: (game: Game) => {
                if (counterCard.effect && counterCard.effect.execute) {
                    counterCard.effect.execute(game, controller, null);
                }
                // Move to appropriate pile
                controller.moveToDiscard(counterCard);
            },
            description: `Counter activation: ${counterCard.name}`
        };

        this.addEffect(effect);
        this.game.addToLog(`${counterCard.name} automatically triggers!`);
    }

    // Add a game event for processing
    addEvent(event: GameEvent): void {
        this.pendingEvents.push(event);
    }

    // Process all pending events
    private processEvents(): void {
        while (this.pendingEvents.length > 0) {
            const event = this.pendingEvents.shift()!;
            this.processEvent(event);
        }
    }

    // Process a single event
    private processEvent(event: GameEvent): void {
        // Check for triggers and responses to this event
        this.checkEventTriggers(event);
        
        // Execute the event if not prevented
        if (!event.prevented) {
            this.executeEvent(event);
        }
    }

    // Check for cards that trigger on specific events
    private checkEventTriggers(event: GameEvent): void {
        const allPlayers = [this.game.playerA, this.game.playerB];
        
        for (const player of allPlayers) {
            // Check face-down counter cards
            const counters = player.faceDownCards || [];
            for (const counter of counters) {
                const counterCard = counter as any; // Type assertion for dynamic properties
                if (counterCard.triggerEvent === event.type && counterCard.effect) {
                    this.activateCounter(counterCard, player);
                }
            }
        }
    }

    // Execute the actual event
    private executeEvent(event: GameEvent): void {
        switch (event.type) {
            case 'summon-defeated':
                this.handleSummonDefeated(event);
                break;
            case 'damage-dealt':
                this.handleDamageDealt(event);
                break;
            case 'victory-point-gained':
                this.handleVictoryPointGained(event);
                break;
            default:
                // Generic event handling
                break;
        }
    }

    private handleSummonDefeated(event: GameEvent): void {
        const { target, attacker } = event.data;
        if (target && attacker) {
            // Award victory points
            const vp = target.level >= 10 ? 2 : 1; // Tier 2+ summons give 2 VP
            attacker.owner.victoryPoints += vp;
            this.game.addToLog(`${attacker.owner.name} gains ${vp} Victory Point(s)!`);
            
            // Create VP gain event for counters to potentially respond to
            this.addEvent({
                type: 'victory-point-gained',
                source: attacker,
                target: attacker.owner,
                data: { amount: vp }
            });
        }
    }

    private handleDamageDealt(event: GameEvent): void {
        // Check for damage-triggered effects
        const { target, damage, source } = event.data;
        
        // Check for Warlock Nightmare Pain trigger
        if (target && target.role && target.role.name === 'Warlock') {
            // Find Nightmare Pain counter if set
            const owner = target.owner;
            const nightmarePain = owner.faceDownCards?.find((card: any) => card.name === 'Nightmare Pain');
            if (nightmarePain) {
                this.activateCounter(nightmarePain, owner);
            }
        }
    }

    private handleVictoryPointGained(event: GameEvent): void {
        // Check for VP-negating counters like Graverobbing
        const allPlayers = [this.game.playerA, this.game.playerB];
        
        for (const player of allPlayers) {
            if (player === event.target) continue; // Don't let player counter their own VP gain
            
            const graverobbing = player.faceDownCards?.find((card: any) => card.name === 'Graverobbing');
            if (graverobbing) {
                this.activateCounter(graverobbing, player);
                // Prevent the VP gain
                event.prevented = true;
                event.data.amount = 0;
                break;
            }
        }
    }

    // Clear the stack (used when game ends or resets)
    clear(): void {
        this.effects = [];
        this.pendingEvents = [];
        this.isResolving = false;
    }
}