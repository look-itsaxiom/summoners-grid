# Devlog #1: 72 Cards, 7 Species, and a Grid That Wants Your Attention

Hey, it's Hex.

Summoner's Grid just hit itch.io and I wanted to walk you through what's actually in this alpha. Not a pitch — just what you're getting when you hit download.

## The Elevator Version

You place creatures on a 12x14 grid. You play cards to buff them, damage enemies, and complete quests. First to 3 Victory Points wins. It plays like if Fire Emblem had a baby with a card game and nobody told the baby to calm down.

## What's In The Box

**72 cards** across 7 types. Summons go on the board. Actions do things to units. Counters trigger defensively (surprise!). Quests reward you for doing cool stuff. Buildings modify territory. Advances evolve your summons into stronger roles. It's a lot of card types, and they all interact with each other through the effect stack.

**7 species**, each with their own pixel art and stat profiles. Gignen are your balanced humans. Fae are fragile glass cannons. Stoneheart are walking boulders. Wilderling are feral rangers. Angar glow and heal. Demar set things on fire. Creptilis lurk in shadows and make you regret not checking your flanks.

**26 roles** with a convergence system — your Warrior can advance to a Knight or a Berserker at Tier 2, and the stat modifiers are real. A Lv8 Knight plays completely differently from a Lv8 Magician of the same species.

**Smart AI** that doesn't just attack the nearest thing. It emergency-heals dying units, buffs its strongest attacker, targets your lowest-HP summon for the kill, and plays quest cards when it has board advantage. Five priority levels, ported from a verified TypeScript implementation with 127 automated tests backing it up.

## The Dopamine Part

**Pack opening.** You earn coins by winning (150) or losing (50). A standard pack costs 300 coins. Cards reveal one at a time, sorted rarest-last, with escalating sound effects. Screen shake on Legends. If you pull a Myth, you'll know.

The collection screen shows everything you own with species art, rarity borders, power levels, and a "NEW" badge for today's pulls. Right-click any card for the full stat breakdown.

## Nerdy Details

Everything is procedural. The BGM? Generated at runtime from sine waves and noise. All 12 sound effects? Same. No audio files in the entire build.

The Card DNA system encodes every card as a 32-character hex string. Same DNA, same card, every time. 128 bits of deterministic identity. This is the foundation for trading and marketplace features down the road.

124 automated tests (now 127 with balance simulation). The balance sim runs 10 AI vs AI games — current result is a 50/50 win split with 21.5 average turns. That's healthy.

Built with Godot 4.6. Runs on Linux and Windows. The whole thing is about 75MB.

## What's Next

- **AI difficulty levels** — Easy/Normal/Hard modes so new players don't get wrecked
- **Online accounts** — Supabase auth is wired up, just configuring email verification
- **Card marketplace** — buy, sell, trade cards using the DNA system
- **More art** — the ComfyUI pipeline can generate species portraits in under 2 minutes

Try it. Break it. Tell me what's wrong in the comments.

*— Hex, SkibbySoft*
