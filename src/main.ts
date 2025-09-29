import { GameEngine } from './engine';
import { DeckSummon, PlayerAction } from './interfaces';
import * as s from './data/summons';
import * as c from './data/cards';

console.log('--- Summoner\'s Grid Engine Verification Test ---');

// 1. Define the decks for the players as per the play example.
const playerADeck: DeckSummon[] = [
    { summon: s.playerA_gignenWarrior, role: c.warrior, equipment: { weapon: c.heirloomSword } },
    { summon: s.playerA_gignenMagician, role: c.magician, equipment: { weapon: c.apprenticesWand } },
    { summon: s.playerA_gignenScout, role: c.scout, equipment: { weapon: c.huntingBow } },
];

const playerBDeck: DeckSummon[] = [
    { summon: s.playerB_faeMagician, role: c.magician, equipment: { weapon: c.apprenticesWand } },
    { summon: s.playerB_stoneheartWarrior, role: c.warrior, equipment: { weapon: c.heirloomSword } },
    { summon: s.playerB_wilderlingScout, role: c.scout, equipment: { weapon: c.huntingBow } },
];

// Add the action cards to the players' hands for the test
playerADeck[0].summon.type; // This is just to satisfy TS compiler unused var for now
playerBDeck[0].summon.type; // This is just to satisfy TS compiler unused var for now


// 2. Initialize the engine with a seed that matches the play example's outcomes.
// The seed 'play-example' will be used to ensure the RNG is deterministic.
const engine = new GameEngine(playerADeck, playerBDeck, 'play-example-seed');

let gameState = engine.getGameState();
console.log('Initial Game State:', JSON.stringify(gameState, null, 2));


// --- TURN 1: PLAYER A ---
console.log('\n--- TURN 1: PLAYER A ---');

// Player A plays "Sharpened Blade" on their Gignen Warrior.
const playerAWarrior = gameState.players['player-a'].summons[0];
console.log(`Player A's Warrior (${playerAWarrior.id}) initial weapon power: ${playerAWarrior.equipment.weapon?.power}`);

// To play the card, we need to add it to Player A's hand first for the test.
engine.primeHandForTest('player-a', c.sharpenedBlade);

const playSharpenedBladeAction: PlayerAction = {
    type: 'PLAY_CARD',
    payload: {
        cardId: c.sharpenedBlade.id,
        context: { targetUnitId: playerAWarrior.id }
    }
};

// Player A (active player) submits the action. Priority goes to Player B.
gameState = engine.submitAction('player-a', playSharpenedBladeAction);
console.log('Player A plays Sharpened Blade. Stack:', JSON.stringify(gameState.stack, null, 2));

// Player B passes priority.
gameState = engine.submitAction('player-b', { type: 'PASS_PRIORITY', payload: {} });
console.log('Player B passes.');

// Player A passes priority. This triggers stack resolution.
gameState = engine.submitAction('player-a', { type: 'PASS_PRIORITY', payload: {} });
console.log('Player A passes. Resolving stack...');

const finalWarrior = gameState.players['player-a'].summons.find(s => s.id === playerAWarrior.id)!;
console.log(`Player A's Warrior final weapon power: ${finalWarrior.equipment.weapon?.power}`);

if (finalWarrior.equipment.weapon?.power !== 40) {
    throw new Error('VERIFICATION FAILED: Sharpened Blade did not correctly modify weapon power.');
}
console.log('VERIFICATION PASSED: Sharpened Blade resolved correctly.');


// --- TURN 2: PLAYER B ---
console.log('\n--- TURN 2: PLAYER B ---');
// Manually advance to Player B's turn for the test
engine.advancePhase();
gameState = engine.getGameState();

// Player B plays "Blast Bolt" on Player A's Gignen Warrior.
const playerBMagician = gameState.players['player-b'].summons[0];
console.log(`Player A's Warrior initial HP: ${finalWarrior.maxHp - finalWarrior.damageTaken}/${finalWarrior.maxHp}`);

// Add Blast Bolt to Player B's hand.
engine.primeHandForTest('player-b', c.blastBolt);

const playBlastBoltAction: PlayerAction = {
    type: 'PLAY_CARD',
    payload: {
        cardId: c.blastBolt.id,
        context: { casterUnitId: playerBMagician.id, targetUnitId: finalWarrior.id }
    }
};

// Player B (active player) submits the action. Priority goes to Player A.
gameState = engine.submitAction('player-b', playBlastBoltAction);
console.log('Player B plays Blast Bolt. Stack:', JSON.stringify(gameState.stack, null, 2));

// Player A passes.
gameState = engine.submitAction('player-a', { type: 'PASS_PRIORITY', payload: {} });
console.log('Player A passes.');

// Player B passes. This triggers stack resolution.
gameState = engine.submitAction('player-b', { type: 'PASS_PRIORITY', payload: {} });
console.log('Player B passes. Resolving stack...');

const finalWarriorAfterAttack = gameState.players['player-a'].summons.find(s => s.id === playerAWarrior.id)!;
const damageTaken = finalWarriorAfterAttack.damageTaken;

console.log(`Player A's Warrior final HP: ${finalWarriorAfterAttack.maxHp - damageTaken}/${finalWarriorAfterAttack.maxHp}`);

// With our new RNG, the deterministic outcome is 76 damage.
if (damageTaken !== 76) {
    throw new Error(`VERIFICATION FAILED: Blast Bolt dealt ${damageTaken} damage, but expected 76.`);
}
console.log('VERIFICATION PASSED: Blast Bolt resolved correctly.');
console.log('\n--- Engine Verification Test Completed Successfully! ---');