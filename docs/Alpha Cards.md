# Alpha Set Card Reference

_Implementation-Agnostic Documentation for Summoner's Grid_

## Overview

The Alpha Set contains 42 cards across multiple types, representing the core foundation of Summoner's Grid gameplay. This document provides human-readable descriptions of each card's game mechanics, requirements, and effects for easy re-implementation.

## Card Types Summary

- **Action Cards**: 10 cards - Instant effects and tactical abilities
- **Role Cards**: 13 cards - Base classes and advanced roles with stat modifiers
- **Building Cards**: 2 cards - Permanent board structures with ongoing effects
- **Weapon Cards**: 3 cards - Equipment providing combat bonuses
- **Advance Cards**: 5 cards - Role advancement abilities
- **Counter Cards**: 3 cards - Reactive defensive abilities
- **Quest Cards**: 2 cards - Objective-based challenges with rewards
- **Unique Cards**: 4 cards - Special abilities tied to specific characters

---

## Action Cards (10 cards)

### 001 - Blast Bolt

- **Rarity**: Common
- **Attribute**: Fire
- **Speed**: Action Speed
- **Requirements**: Control a magician-family role
- **Effect**: Deal fire damage to target opponent summon
- **Range**: Any distance
- **Description**: A basic magical attack spell accessible to all magician-family roles

### 005 - Sharpened Blade

- **Rarity**: Common
- **Attribute**: Neutral
- **Speed**: Action Speed
- **Requirements**: Control a warrior-family role
- **Effect**: Grant +5 power bonus to target summon's weapon until end of turn
- **Target**: Your controlled summon
- **Description**: Temporary weapon enhancement for physical combat

### 006 - Healing Hands

- **Rarity**: Common
- **Attribute**: Light
- **Speed**: Action Speed
- **Requirements**: Control a magician-family role
- **Effect**: Restore HP to target summon
- **Target**: Any summon on the board
- **Description**: Basic healing spell that can target allies or enemies

### 009 - Rush

- **Rarity**: Common
- **Attribute**: Neutral
- **Speed**: Action Speed
- **Requirements**: Control a scout-family role
- **Effect**: Grant target summon an extra movement and attack this turn
- **Target**: Your controlled summon
- **Description**: Provides additional combat actions for tactical positioning

### 011 - Ensnare

- **Rarity**: Uncommon
- **Attribute**: Nature
- **Speed**: Action Speed
- **Requirements**: Control a scout-family role
- **Effect**: Prevent target summon from moving or attacking next turn
- **Target**: Any summon on the board
- **Description**: Crowd control effect that immobilizes enemies

### 012 - Drain Touch

- **Rarity**: Uncommon
- **Attribute**: Dark
- **Speed**: Action Speed
- **Requirements**: Control a magician-family role
- **Effect**: Deal dark damage to target and heal yourself for the same amount
- **Target**: Enemy summon
- **Description**: Life-steal spell that damages enemies while healing caster

### 013 - Adventurous Spirit

- **Rarity**: Common
- **Attribute**: Neutral
- **Speed**: Action Speed
- **Requirements**: Control a scout-family role
- **Effect**: Search your deck for a Quest card and add it to your hand
- **Description**: Deck searching ability for quest-based strategies

### 015 - Spell Recall

- **Rarity**: Uncommon
- **Attribute**: Neutral
- **Speed**: Action Speed
- **Requirements**: Control a magician-family role
- **Effect**: Return target Action card from your discard pile to your hand
- **Description**: Spell recursion for repeated magical effects

### 016 - Life Alchemy

- **Rarity**: Rare
- **Attribute**: Light
- **Speed**: Action Speed
- **Requirements**: Control a magician-family role
- **Effect**: Sacrifice target summon to fully heal another target summon
- **Description**: Powerful healing at the cost of sacrificing an ally

### 017 - Dual Shot

- **Rarity**: Uncommon
- **Attribute**: Neutral
- **Speed**: Action Speed
- **Requirements**: Control a scout-family role with equipped bow
- **Effect**: Make two separate ranged attacks with your bow in one action
- **Description**: Enhanced archery allowing multiple shots per turn

---

## Role Cards (13 cards)

### Tier 1 Base Roles

### 020 - Warrior

- **Rarity**: Common
- **Tier**: 1 (Base Role)
- **Family**: Warrior
- **Stat Modifiers**: +25% STR, +25% END
- **Advancement Paths**: Berserker, Knight
- **Description**: Foundation warrior role focused on physical combat and durability

### 021 - Magician

- **Rarity**: Common
- **Tier**: 1 (Base Role)
- **Family**: Magician
- **Stat Modifiers**: +25% INT, +25% SPI
- **Advancement Paths**: Element Mage, Light Mage, Dark Mage
- **Description**: Foundation magical role with access to elemental and divine magic

### 022 - Scout

- **Rarity**: Common
- **Tier**: 1 (Base Role)
- **Family**: Scout
- **Stat Modifiers**: +25% SPD, +25% ACC
- **Advancement Paths**: Rogue, Explorer
- **Description**: Foundation agility role focused on speed and precision

### Tier 2 Advanced Roles

### 023 - Berserker

- **Rarity**: Uncommon
- **Tier**: 2 (Advanced Role)
- **Family**: Warrior
- **Stat Modifiers**: +50% STR, +10% SPD, -10% DEF
- **Advancement From**: Warrior
- **Advancement Paths**: None (terminal role)
- **Description**: Aggressive warrior sacrificing defense for overwhelming offense

### 024 - Knight

- **Rarity**: Uncommon
- **Tier**: 2 (Advanced Role)
- **Family**: Warrior
- **Stat Modifiers**: +30% STR, +30% DEF, +20% END
- **Advancement From**: Warrior
- **Advancement Paths**: Paladin, Sentinel
- **Description**: Defensive warrior specialized in protection and armor

### 025 - Explorer

- **Rarity**: Uncommon
- **Tier**: 2 (Advanced Role)
- **Family**: Scout
- **Stat Modifiers**: +30% SPD, +20% END, +15% ACC
- **Advancement From**: Scout
- **Advancement Paths**: None (terminal role)
- **Description**: Hardy scout capable of long journeys and survival

### 026 - Element Mage

- **Rarity**: Uncommon
- **Tier**: 2 (Advanced Role)
- **Family**: Magician
- **Stat Modifiers**: +40% INT, +20% SPI, +10% LCK
- **Advancement From**: Magician
- **Advancement Paths**: None (terminal role)
- **Description**: Mage specialized in elemental magic and nature forces

### 027 - Light Mage

- **Rarity**: Uncommon
- **Tier**: 2 (Advanced Role)
- **Family**: Magician
- **Stat Modifiers**: +35% SPI, +25% INT, +15% MDF
- **Advancement From**: Magician
- **Advancement Paths**: Paladin
- **Description**: Divine caster focused on healing and protective magic

### 028 - Rogue

- **Rarity**: Uncommon
- **Tier**: 2 (Advanced Role)
- **Family**: Scout
- **Stat Modifiers**: +40% SPD, +25% ACC, +20% LCK
- **Advancement From**: Scout
- **Advancement Paths**: None (terminal role)
- **Description**: Stealthy scout specialized in precision strikes and evasion

### 029 - Dark Mage

- **Rarity**: Uncommon
- **Tier**: 2 (Advanced Role)
- **Family**: Magician
- **Stat Modifiers**: +40% INT, +20% SPI, -10% MDF
- **Advancement From**: Magician
- **Advancement Paths**: Warlock
- **Description**: Forbidden magic user with powerful but risky spells

### Tier 3 Master Roles

### 030 - Paladin

- **Rarity**: Rare
- **Tier**: 3 (Master Role)
- **Family**: Warrior (Hybrid with Magician)
- **Stat Modifiers**: +25% STR, +25% DEF, +25% SPI, +15% INT
- **Advancement From**: Knight or Light Mage
- **Advancement Paths**: None (terminal role)
- **Description**: Holy warrior combining martial prowess with divine magic

### 031 - Sentinel

- **Rarity**: Rare
- **Tier**: 3 (Master Role)
- **Family**: Warrior
- **Stat Modifiers**: +20% STR, +50% DEF, +30% END, +15% MDF
- **Advancement From**: Knight
- **Advancement Paths**: None (terminal role)
- **Description**: Ultimate defensive warrior focused on protection and endurance

### 032 - Warlock

- **Rarity**: Rare
- **Tier**: 3 (Master Role)
- **Family**: Magician
- **Stat Modifiers**: +60% INT, +30% SPI, +20% LCK, -20% MDF, -15% DEF
- **Advancement From**: Dark Mage
- **Advancement Paths**: None (terminal role)
- **Description**: Master of forbidden magic with immense power at great personal cost

---

## Building Cards (2 cards)

### 004 - Gignen Country

- **Rarity**: Uncommon
- **Attribute**: Neutral
- **Dimensions**: 3x2 (occupies 6 board spaces)
- **Speed**: Action Speed
- **Placement**: Must be placed in unoccupied 3x2 area in your territory
- **Effect**: Gignen-based summons occupying this building's spaces gain +1 additional level whenever they level up
- **Destination**: Discard pile when destroyed
- **Description**: Species-specific territory that enhances Gignen growth rates

### 010 - Dark Altar

- **Rarity**: Rare
- **Attribute**: Dark
- **Dimensions**: 2x2 (occupies 4 board spaces)
- **Speed**: Action Speed
- **Placement**: Must be placed in unoccupied 2x2 area in your territory
- **Effect**: At the end of your next turn, this building and any summons occupying its spaces are destroyed. If a summon was destroyed this way, target magician-family summon you control becomes level 20 and can immediately advance.
- **Destination**: Discard pile when destroyed
- **Description**: Sacrificial structure that enables rapid role advancement through dark rituals

---

## Weapon Cards (3 cards)

### 033 - Apprentice's Wand

- **Rarity**: Common
- **Attribute**: Neutral
- **Equipment Slot**: Weapon
- **Power**: 15 (low damage)
- **Range**: 2 (short-range magic)
- **Damage Stat**: INT (magical damage)
- **Stat Bonuses**: +2 INT, +1 SPI
- **Description**: Basic magical implement for beginning spellcasters

### 034 - Heirloom Sword

- **Rarity**: Common
- **Attribute**: Neutral
- **Equipment Slot**: Weapon
- **Power**: 30 (moderate damage)
- **Range**: 1 (melee)
- **Damage Stat**: STR (physical damage)
- **Stat Bonuses**: +1 to all stats except LCK (+1% LCK)
- **Description**: Balanced weapon providing modest improvements across all attributes

### 035 - Hunting Bow

- **Rarity**: Common
- **Attribute**: Neutral
- **Equipment Slot**: Weapon
- **Power**: 25 (moderate damage)
- **Range**: 3 (long-range)
- **Damage Stat**: (STR + ACC)/2 (hybrid physical/accuracy)
- **Stat Bonuses**: +2 ACC, +1 SPD
- **Description**: Ranged weapon favoring accuracy and speed over raw power

---

## Advance Cards (5 cards)

### 036 - Berserker Rage

- **Rarity**: Uncommon
- **Requirements**: Control a Berserker role
- **Effect**: Grant target Berserker +100% STR and +50% SPD for 3 turns, but they take 10% more damage
- **Description**: Temporary power boost with defensive vulnerability

### 037 - Knighthood Ceremony

- **Rarity**: Uncommon
- **Requirements**: Control a Knight role
- **Effect**: Permanently increase target Knight's DEF by 25% and gain immunity to fear effects
- **Description**: Permanent defensive enhancement and mental fortification

### 038 - Oath of Light

- **Rarity**: Rare
- **Requirements**: Control a Paladin role
- **Effect**: Target Paladin gains ability to heal all allies within 2 spaces at start of each turn
- **Description**: Ongoing area healing ability for divine warriors

### 039 - Shadow Pact

- **Rarity**: Rare
- **Requirements**: Control a Dark Mage or Warlock role
- **Effect**: Sacrifice 25% of current HP to double the power of next 3 spells cast
- **Description**: High-risk enhancement trading health for magical power

### 040 - Alrecht Barkstep, Scoutmaster

- **Rarity**: Legendary
- **Requirements**: Control an Explorer role at level 15+
- **Effect**: Transform target Explorer into named unique "Alrecht Barkstep" with +50% to all Scout family stats and ability to move through occupied spaces
- **Description**: Legendary transformation creating a unique named character with special movement

---

## Counter Cards (3 cards)

### 003 - Dramatic Return!

- **Rarity**: Legendary
- **Attribute**: Light
- **Speed**: Counter Speed
- **Placement**: Set face-down in In Play Zone
- **Trigger**: When a summon you control is defeated and removed from play
- **Effect**: Return that summon to an unoccupied space in your territory with 10% HP, preserving level, role, and equipment
- **Restrictions**: Does not trigger Summon Draws, clears ongoing effects
- **Destination**: Discard pile after activation
- **Description**: Miraculous resurrection that brings back fallen allies at critical moments

### 041 - Graverobbing

- **Rarity**: Uncommon
- **Speed**: Counter Speed (can interrupt opponent actions)
- **Requirements**: None (can be played by any role family)
- **Effect**: When opponent attempts to destroy or sacrifice a summon, instead move that summon to your control
- **Description**: Defensive counter that steals enemies' sacrificial targets

### 132 - Nightmare Pain

- **Rarity**: Common
- **Attribute**: Dark
- **Speed**: Counter Speed
- **Requirements**: Control a Warlock role
- **Trigger**: A Warlock summon you control takes damage
- **Effect**: Target any summon receives equal damage as Dark attribute magical damage
- **Hit Formula**: Always hits (automatic)
- **Critical**: Cannot critically hit
- **Destination**: Removed from game after activation
- **Description**: Warlock counter that reflects suffering onto enemies through dark magic

---

## Quest Cards (2 cards)

### 002 - Taste of Battle

- **Rarity**: Uncommon
- **Attribute**: Fire
- **Speed**: Action Speed
- **Zone**: Enters In Play Zone (acts like building)
- **Objective**: Control a summon under level 10 that deals damage to an enemy this turn
- **Failure Condition**: Any of your summons under level 10 takes damage from an enemy
- **Reward**: Target qualifying summon gains 2 levels
- **Success Destination**: Recharge pile
- **Failure Destination**: Discard pile
- **Description**: Risk/reward quest requiring aggressive play while protecting low-level summons

### 037 - Nearwood Forest Expedition

- **Rarity**: Common
- **Attribute**: Earth
- **Speed**: Action Speed
- **Zone**: Enters In Play Zone (acts like building)
- **Objective**: Control a Warrior, Scout, or Magician summon under level 10
- **Failure Condition**: None (safe quest)
- **Reward**: Target qualifying summon gains 2 levels
- **Destination**: Recharge pile after completion
- **Description**: Safe exploration quest providing guaranteed progression for base role families

---

## Unique Cards (4 cards)

### 050 - Follow Me!

- **Rarity**: Special (Generated Card)
- **Attribute**: Neutral
- **Speed**: Action Speed
- **Requirements**: Control Alrecht Barkstep, Scoutmaster
- **Effect**: Teleport target summon you control to unoccupied space adjacent to Alrecht Barkstep (not movement)
- **Destination**: Removed from game after use
- **Description**: Special ability card generated by legendary Alrecht Barkstep character

### 051 - Healing Touch

- **Rarity**: Special (Generated Card)
- **Attribute**: Light
- **Speed**: Action Speed
- **Requirements**: Control a Paladin role as caster
- **Effect**: Heal target summon within range 1 using formula: caster.SPI × (1 + base_power/100) with base power 20
- **Critical Hits**: Can achieve 1.5× healing multiplier
- **Range**: 1 space from Paladin caster
- **Destination**: Removed from game after use
- **Description**: Paladin-generated healing spell with significant restorative power

---

## Card Design Notes

### Family Requirements

Most Action cards require control of specific role families:

- **Warrior Family**: Physical combat and equipment enhancement cards
- **Scout Family**: Movement, archery, and quest-seeking abilities
- **Magician Family**: Elemental damage, healing, and spell manipulation

### Rarity Distribution

- **Common** (12 cards): Basic effects accessible early in gameplay
- **Uncommon** (10 cards): Enhanced versions with additional requirements
- **Rare** (4 cards): Powerful effects with significant strategic impact
- **Legendary** (2 cards): Unique transformative and resurrection abilities
- **Special** (4 cards): Generated cards not available in packs

### Attribute System

Cards utilize a 6-attribute system:

- **Neutral**: Universal effects usable by any role
- **Fire/Nature/Dark/Light**: Elemental themes matching magical specializations
- Attributes affect damage calculations and resistances

### Advancement Mechanics

Role progression follows family trees:

- **Tier 1→2**: Base roles advance to specialized versions
- **Tier 2→3**: Some advanced roles can reach master tier
- **Cross-Family**: Paladin accessible from both Warrior and Magician paths
- **Terminal Roles**: Many Tier 2+ roles have no further advancement

This Alpha Set establishes the core mechanical foundation for tactical grid-based combat with role-playing progression elements.

---

## Example Play Data

_From the comprehensive play example documentation_

### Player A's Deck (Gignen Focus)

**Format**: 3v3
**Strategy**: Gignen species synergy with territorial building support

**Summon Squad**:

1. **Gignen Warrior** (Level 12) - Heirloom Sword equipped
2. **Gignen Magician** (Level 10) - Apprentice's Wand equipped
3. **Gignen Scout** (Level 10) - Hunting Bow equipped

**Main Deck** (6 cards):

- Sharpened Blade (warrior enhancement)
- Healing Hands (magician healing)
- Gignen Country (species building)
- Nearwood Forest Expedition (safe quest)
- Rush (scout mobility)
- Adventurous Spirit (quest search)

**Advance Deck** (2 cards):

- Alrecht Barkstep (legendary scout transformation)
- Berserker Rage (warrior enhancement)

### Player B's Deck (Mixed Species Control)

**Format**: 3v3  
**Strategy**: Dark magic and control effects with species diversity

**Summon Squad**:

1. **Stoneheart Warrior** (Level 12) - Heirloom Sword equipped
2. **Fae Magician** (Level 8) - Apprentice's Wand equipped
3. **Wilderling Scout** (Level 15) - Hunting Bow equipped

**Main Deck** (9 cards):

- Blast Bolt (fire damage)
- Dramatic Return! (resurrection counter)
- Ensnare (crowd control)
- Dark Altar (sacrifice building)
- Drain Touch (life steal)
- Spell Recall (spell recursion)
- Life Alchemy (sacrifice healing)
- Dual Shot (bow enhancement)
- Graverobbing (steal counter)

**Advance Deck** (1 card):

- Shadow Pact (dark magic enhancement)

### Deck Analysis Notes

- **Player A**: Focused strategy around single species (Gignen) with building synergy
- **Player B**: Control-oriented with diverse species and powerful magic/counter effects
- **Common Elements**: Both use same weapon loadouts (Heirloom Sword, Apprentice's Wand, Hunting Bow)
- **Role Distribution**: Both follow standard Warrior/Magician/Scout trio setup
- **Complexity**: Player A has simpler, more straightforward effects; Player B has complex interactions and risk/reward mechanics
