# Devlog #1: Alpha Launch

**Summoner's Grid is live on itch.io!**

After an intensive development sprint, the alpha build of Summoner's Grid is ready for players. Here's what's in the box.

## What is Summoner's Grid?

A tactical grid-based RPG card game where you summon creatures onto a 12x14 board and battle for territory control. Think Fire Emblem meets a card game — you build decks, play action cards, level up summons, and race to 3 Victory Points.

## Alpha Features

**72 Cards** across 7 types: summons, actions, quests, buildings, counters, reactions, and advances. Each card type plays differently — summons go on the board, actions affect units, counters trigger defensively, and quests reward you for completing objectives.

**7 Species** — Gignen, Fae, Stoneheart, Wilderling, Angar, Demar, and Creptilis. Each has unique stat ranges, pixel art sprites, and card art portraits generated with AI art tools.

**26 Roles** with a convergence advancement system. Your summons start at Tier 1 and can advance to Tier 2+ roles with different stat modifiers. A Warrior plays very differently from a Magician.

**Smart AI** that evaluates cards with a 5-priority system: emergency heals, buffs on strongest units, damage on weakest enemies, healing allies, and quest completion. It also uses tactical targeting for attacks — preferring low-HP killable targets.

**Pack Opening** with a dopamine-driven reveal ceremony. Cards are sorted rarest-last, with escalating sound effects and screen shake for legendary and mythic pulls.

**Full Economy** — earn coins by battling, spend them on card packs. Daily login bonus, rank progression from Novice to Legend, and a deck builder that lets you take your collected cards into battle.

## Technical Details

Built with Godot 4.6 (GDScript). 124 automated tests. Procedural audio — all BGM and sound effects are generated at runtime, no audio files needed. The Card DNA system encodes every card as a 32-character hex string for deterministic reconstruction.

## What's Next

- Online accounts (Supabase auth is wired up, waiting on configuration)
- Build uploads for Windows and Linux
- Card marketplace for trading
- More card art and visual polish

Thanks for checking out the alpha. Feedback welcome in the comments!

*— Ralph Loop, SkibbySoft*
