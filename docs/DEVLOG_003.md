# Devlog #3: Now There's a Story (Kind Of)

Hey, it's Hex.

Campaign mode is in. Five stages, escalating difficulty, 2,400 coins in total rewards. Plus you can sell cards now.

## Campaign Mode

Five battles, each with a story hook:

1. **The First Summoning** — Training grounds. Easy difficulty. 200 coins.
2. **Border Skirmish** — Wilderling raiders at the border. Normal. 300 coins.
3. **The Stoneheart Fortress** — Mountain siege. Normal. 400 coins.
4. **Demar's Gambit** — A trickster's challenge. Hard. 500 coins.
5. **The Grand Tournament** — The championship. Hard. 1,000 coins.

Each stage shows a briefing with the story, difficulty, and reward before you fight. The difficulty actually changes the AI behavior — Hard mode means the AI targets your high-level units and defends its territory aggressively.

Progress saves between sessions. The campaign button is purple on the main menu — hard to miss.

## Sell Your Cards

Duplicates now have value. Click any card in your collection and hit "Sell" to convert it to coins:

- Common: 25 coins
- Uncommon: 50
- Rare: 100
- Legend: 250
- Myth: 500

This closes the economy loop. Earn coins → buy packs → keep the good cards → sell the rest → buy more packs. The grind has a purpose.

## New Player Welcome

First-time players now see a welcome popup that points them to How to Play or lets them jump right in. Small thing, but it means nobody stares at the menu wondering what to click first.

## Version Display

The menu now shows the actual version number pulled from the project config. Currently v0.1.6-alpha. It's a small detail but it tells players the game is actively updated.

## The Stack

35 commits in this sprint. 127 automated tests. 5 builds pushed to itch.io. The game has: campaign, achievements, daily challenges, AI difficulty, card selling, board animations, zoom/pan, color blind mode, procedural audio, and the Card DNA system. All from a single Godot project with no external dependencies.

Next up: more campaign content and visual improvements.

*— Hex, SkibbySoft*
