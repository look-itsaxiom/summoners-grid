# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Summoner's Grid is a tactical grid-based RPG card game being developed for competitive multiplayer online play. The game design is documented in detail; implementation is the next phase.

## Design Reference Documents

- **Summoner's Grid GDD.md** - Authoritative game design document covering all mechanics, rules, and systems
- **Alpha Cards.md** - Complete card definitions for the Alpha set (42 cards across 8 types)
- **Summoner's Grid Play Example.md** - Detailed 10-turn example demonstrating combat, advancement, and victory conditions

## Core Game Architecture

### Game Format
- 3v3 tactical combat on 12x14 grid (coordinates 0,0 at bottom-left)
- Turn structure: Draw → Level → Action → End phases
- Victory condition: First to 3 VP (1 VP per Tier 1 defeat, 2 VP per Tier 2+)

### Effect System
- Stack-based resolution (LIFO)
- Speed hierarchy: Counter > Reaction > Action
- Speed Lock prevents lower-speed responses until higher-speed effects resolve

### Summon System
- Procedurally generated from species templates at pack opening
- Stats determined by: base stats, growth rates, level, role modifiers, equipment
- Level range: 5 (starting) to 20 (max)
- Seven species: Gignen, Fae, Stoneheart, Wilderling, Angar, Demar, Creptilis

### Role System
- Three families: Warrior, Magician, Scout
- Tier progression: Tier 1 → Tier 2 → Tier 3 (some with multi-path convergence)
- Named Summons: Special transformations with unique abilities

### Key Formulas
```
FinalStat = (BaseStat + Floor(Level × GrowthRate)) × RoleModifier + EquipmentBonus
MaxHP = 50 + Floor(END^1.5)
PhysicalDamage = STR × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
MagicalDamage = INT × (1 + BasePower/100) × (INT/TargetMDF) × CritMultiplier
ToHit = BaseAccuracy + (ACC/10)
CritChance = Floor((LCK × 0.3375) + 1.65)
MovementSpeed = 2 + Floor((SPD - 10) / 5)
```

### Growth Rate Scale
- Minimal: 0.5/level (`--`)
- Steady: 0.67/level (`-`)
- Normal: 1.0/level (`_`)
- Gradual: 1.33/level (`+`)
- Accelerated: 1.5/level (`++`)
- Exceptional: 2.0/level (`*`)

## Implementation Considerations

### Data-Driven Design
The GDD emphasizes all card mechanics, effects, and rules should be defined as structured data. Card effects use formula strings that reference caster/target stats.

### Zone Management
- Player zones: Hand (6 card limit), Main Deck, Advance Deck, Discard Pile, Recharge Pile, Removed from Play
- Shared zones: In Play Zone, Game Board

### Card Destinations
- Counter, Building, Quest → Discard Pile
- Action, Reaction → Recharge Pile
- Summon (defeated) → Removed from game

### Digital Provenance
Each summon card requires cryptographic signature with timestamp and opener identity for ownership tracking.
