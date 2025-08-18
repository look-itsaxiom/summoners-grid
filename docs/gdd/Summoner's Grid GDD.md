# Summoner's Grid - Game Design Document

## Table of Contents

1. [Game Overview](#game-overview)
2. [Core Mechanics](#core-mechanics)
3. [Victory Conditions](#victory-conditions)
4. [Game Board & Zones](#game-board--zones)
5. [Turn Structure](#turn-structure)
6. [Card Types](#card-types)
7. [Deck Construction](#deck-construction)
8. [Summon System](#summon-system)
9. [Role System](#role-system)
10. [Equipment System](#equipment-system)
11. [Combat System](#combat-system)
12. [Effect System](#effect-system)
13. [Stats & Formulas](#stats--formulas)
14. [Play Example](#play-example)

---

## Game Overview

**Summoner's Grid** is a tactical grid-based RPG card game with a fantasy theme designed for competitive multiplayer online play. Players collect unique cards, build strategic decks, and engage in turn-based combat using a comprehensive effect system with stack-based resolution.

### Game Modes

- **Player vs Player (PvP)**: Competitive multiplayer battles
- **Player vs Environment (PvE)**: Battles against AI opponents
- **Collection & Economy**: Card acquisition through packs, shops, and trading systems

### Core Game Loop

- **Card Collection**: Acquire unique cards through card packs and shop purchases
- **Gameplay Rewards**: All in-game currencies and cards obtainable through gameplay, not just purchase
- **Deck Building**: Create strategic decks using collected cards
- **Combat**: Engage in tactical battles (PvP or PvE)
- **Trading**: Exchange cards with other players via Auction House system

### Core Design Philosophy

- **Digital Provenance System**: Unique summon cards with cryptographic signatures and ownership tracking
- **Trading Verification**: Digital signatures maintain ownership history chains to prevent cheating and verify legitimate trades
- **Dynamic Interaction System**: Rich card interactions, effect combinations, and mechanical synergies through trigger-response-resolution chains
- **Universal Rule Override**: Every game rule, restriction, and property can be modified by card effects - no rule is absolute
- **Data-Driven Design**: All card mechanics, effects, and rules defined as structured data
- **Tactical Positioning**: Grid-based combat with movement, range, and positioning strategy
- **Dynamic Progression**: Role advancement system allowing strategic pivots during gameplay

---

## Core Mechanics

### Game Format

- **3v3 Tactical Combat**: Each player fields up to 3 summons
- **Turn-Based Phases**: Structured turn system with response windows
- **Stack-Based Resolution**: Effects resolve in Last-In-First-Out order with speed priorities

### Key Systems

- **Species Template System**: Unique Summon cards generated from species templates with stat ranges and trait effects
- **Role Advancement Trees**: Complex branching progression system with multi-path convergence at Tier 3 (e.g., Paladin accessible via Warrior→Knight or Magician→Light Mage paths)
- **Equipment Modularity**: Customizable summons with weapons, armor, and accessories
- **Territory Control**: Board divided into player territories and contested zones

---

## Victory Conditions

### Primary Objective

First player to reach **3 Victory Points (VP)** wins the game.

### Victory Point Sources

- **Tier 1 Summon defeat**: 1 VP
- **Tier 2+ Summon defeat**: 2 VP
- **Direct territory attack**: 1 VP (when controlling opponent's territory with no enemy summons)
- **Quest completion**: Variable VP (card-specific)
- **Card effects**: Some cards can grant or remove VP

### Tiebreakers

1. If both players reach 3 VP simultaneously, player with most summons in play wins
2. If summon count is tied, the game is a draw

---

## Game Board & Zones

### Board Layout

- **12x14 grid** battlefield with coordinate system (0,0 at bottom-left)
- **Territory Control**: Each player controls first 3 rows on their side
- **Unclaimed Territory**: Middle rows between player territories
- **Diagonal Movement**: Allowed with equivalent movement cost to orthogonal directions (up, down, left, right)

### Player Zones

- **Hand**: Cards available for play (6 card limit at turn end)
- **Main Deck**: Primary draw source, shuffled when searched
- **Advance Deck**: Role advancement cards (separate from hand, available when requirements met)
- **Discard Pile**: Spent cards that don't return to deck
- **Recharge Pile**: Spent cards that shuffle back when Main Deck is empty
- **Removed from Play**: Defeated summon units go here; rarely interacted with otherwise unless specific card effects allow; Cards that are in this non-zone zone don't technically exist in the game state

**Default Pile Destinations:**

- Counter, Building, Quest cards → Discard Pile
- Action, Reaction cards → Recharge Pile
- Summon cards → Removed from game completely

### Shared Zones

- **In Play Zone**: Active cards affecting the game state
- **Game Board**: Physical placement of summons and buildings

---

## Turn Structure

**Game Start**: Turn order determined by coin flip with winner choosing to go first or second.

Each turn consists of four sequential phases:

### 1. Draw Phase

- Draw 1 card from Main Deck (skipped on first turn of game)
- If Main Deck is empty, shuffle Recharge Pile to form new Main Deck
- If both Main Deck and Recharge Pile are empty, draw attempt fails

### 2. Level Phase

- All summons controlled by turn player gain 1 level
- Stat recalculation occurs immediately
- **HP Damage Retention**: When max HP increases, current damage taken remains the same (not proportional)
- Ongoing effects may trigger additional level gains

### 3. Action Phase

**Core Restrictions:**

- **One Turn Summon**: Only one summon can be played per turn
- **Summon Draws**: Playing a summon triggers drawing 3 cards from Main Deck
- **One Attack**: Each summon can only attack once per turn
- **Movement Limit**: Summons can move up to their movement speed per turn (can be split before/after other actions)
- **Split Actions**: Movement can be divided before/after attacking

**Action Speed Game Actions:**

- Using a summon to attack
- Moving a summon unit
- Playing your turn summon

**Available Actions:**

- Play summons, actions, buildings, quests from hand
- Play advance cards when requirements are met
- Move summons on the board
- Initiate attacks with summons
- Activate abilities and effects

**Action Modifications:**

- **Movement Speed**: Can be temporarily modified by card effects for increased tactical mobility
- **Multiple Attacks**: Card effects can grant additional attacks beyond the normal one-per-turn limit

### 4. End Phase

- If player has more than 6 cards in hand, discard excess to Recharge Pile
- Turn passes to opponent

---

## Card Types

### Summon Cards

**Unique Generation System:**

- Generated from species templates with stat ranges
- Each card has unique digital signature with timestamp and opener identity
- Base stats + growth rates determine progression curve
- Equipment slots define combat capabilities

### Action Cards

**Single-Use Effects:**

- Played during Action Phase with various effects
- Require specific conditions (summon roles, targets, etc.)
- Move to Discard or Recharge pile after resolution
- Various speeds: Action, Reaction, Counter

### Building Cards

**Persistent Board Effects:**

- Occupy specific board spaces with defined dimensions
- Provide ongoing effects while in play
- Require placement validation (valid spaces) and often role requirements to play
- Cannot be targeted by normal attacks (only destroyed by card effects)
- **Building Destruction**: When destroyed, may have special effects and can destroy units occupying the same spaces
- **Special Subtype**: Trap buildings (played face-down, activate on trigger such as opponent summon movement)

### Quest Cards

**Objective-Based Rewards:**

- Played at Action speed during Action Phase
- Remain in play until completed or failed
- Provide VP, levels, or other rewards upon completion
- **Failure Consequences**: Some quests may have negative consequences when objectives aren't met (card-specific)
- **Activation Control**: Individual quest cards specify whether they can be activated by the owner, opponent, or either player
- May have ongoing effects while active
- Can be completed immediately or over multiple turns

**Quest Completion Tracking:**

- Summon units permanently track which quests they have completed
- Completed quests unlock new targeting options and requirement fulfillment for future cards
- Some cards specifically require summons that have completed quests to use or target them
- Quest participation records track both primary targets and secondary participants

### Counter Cards

**Reactive Defense:**

- Must be set face-down before activation
- Trigger automatically when specific conditions are met
- Fast speed allows interruption of opponent actions
- **Special Effects**: Can negate various game events including Victory Point gains
- Move to appropriate pile after activation

### Reaction Cards

**Flexible Response:**

- Can be played from hand or set face-down
- Respond to opponent actions during either player's turn
- No specific trigger conditions required (unlike Counter cards)
- Effects are less potent than Counters in exchange for flexibility
- Medium speed, versatile timing
- Enable tactical counterplay

### Role Cards

**Class Definition:**

- Define summon's initial tier 1 role (Warrior, Scout, Magician)
- Provide stat modifiers and special abilities
- Foundation for advancement tree progression

### Equipment Cards

**Combat Enhancement:**

- **Weapon**: Defines attack type, damage, and range
- **Offhand**: Secondary weapons or defensive items
- **Armor**: Defensive bonuses and special effects
- **Accessory**: Utility effects and stat modifications

**Equipment Requirements:**

- All equipment slots are optional - summons can have empty equipment slots
- Summons without weapons have access to a basic melee attack (very weak, providing soft incentive to equip weapons)

### Advance Cards

**Progression System:**

- Enable role advancement to higher tiers
- Transform summons into Named Summons
- Strict requirements based on level, role, or achievements
- Available any time during Action Phase when requirements are met

**Advance Card Types:**

- **Role Change Cards**: Augment a summon unit's current role to a different role
- **Named Summon Cards**: Use existing summon as material to create a special "Named Summon" with unique properties and enhanced abilities that inherits the material summon's equipment and board position

**Strategic Design:**

- **Strategic Pivoting**: Allow players to change gameplay strategy mid-game based on battlefield conditions
- **Current State**: Primarily stat boosts and role changes
- **Future Vision**: Planned expansion to include complex interactions and unique effects

---

## Deck Construction

### Current Format: 3v3

The primary format currently supported, with additional formats planned for future expansion.

**Summon Slots (3 required):**
Each slot contains:

- 1 Summon card (unique generated)
- 1 Role card (tier 1: Warrior, Scout, or Magician)
- 4 Equipment cards (1 weapon, 1 offhand, 1 armor, 1 accessory)

**Main Deck:**

- Action cards for tactical plays
- Building cards for board control
- Quest cards for objectives
- Counter/Reaction cards for responses
- No specific size limit defined

**Advance Deck:**

- Role advancement cards
- Named Summon transformation cards
- Available when summons meet requirements
- Separate from hand management

### Deck Building Strategy

Players must balance card selection based on their summons' individual talents and available card synergies, creating cohesive strategies that leverage species traits, role capabilities, and equipment combinations.

**Multiple Deck Management:**

- Players can own and manage multiple deck configurations
- **Card Sharing**: The same cards can be used across multiple decks simultaneously (e.g., one copy of a card can appear in Deck 1, Deck 2, and Deck 3)

---

## Summon System

### Unique Generation

- **Pack-Opening Generation**: Summon cards are procedurally generated at the moment players open card packs, not pre-existing
- **Species Templates**: Base stat ranges and trait effects per species determine generation parameters
- **Rarity System**: Affects stat generation and growth rate probabilities during pack opening
- **Digital Signatures**: Each generated card receives cryptographic uniqueness with timestamp and opener identity
- **Growth Rates**: Individual progression curves for each stat assigned during generation

### Rarity System Details

**Rarity Tiers**: Common, Uncommon, Rare, Legend, Myth

**Pack Opening Structure** (7-card pack example):

- **Cards 1-5**: Guaranteed Common with small chances for higher rarities
- **Card 6**: Guaranteed Uncommon with chances for Rare/Legend
- **Card 7**: Guaranteed Rare with chances for Legend/Myth

**Species Distribution**: Each species has different appearance rates at different rarities (e.g., Gignen more common in Common slots, rarer species like Angar/Demar more likely in higher rarity slots)

**Stat Generation Impact**:

- **Rarity affects the FLOOR of base stats and growth rates, not the ceiling**
- **Common cards are NOT locked out of impressive stats**, just less likely to achieve them
- Higher rarity cards have better probability distributions for superior stats
- **Growth Rate Distribution**: Higher rarity cards are significantly more likely to roll better growth rates, with the highest rarities having no chance of the poorest growth rates

### Summon Units

When played, summon cards become "Summon Units" with:

- **Starting Level**: Always level 5
- **Maximum Level**: Level 20
- **Calculated Stats**: Based on base stats, growth rates, level, and equipment
- **Combat Properties**: HP, movement, attack range, accuracy, etc.

### Species System

Different species provide:

- Varying base stat distributions
- Unique trait effects and abilities
- Thematic flavor and visual design
- Strategic deck building considerations

**Available Species**:

- **Gignen**: Versatile and adaptive generalists suited to any role. Balanced 8-12 stat ranges across all stats.
- **Fae**: Graceful and intelligent, well-rounded for magical positions. High INT(10-16) and SPI(10-14).
- **Stoneheart**: Stalwart and industrious craftsfolk and warriors. High END(10-16) and DEF(10-14).
- **Wilderling**: Agile and primal with keen senses and physical prowess. High STR(10-16) and SPD(10-16).
- **Angar**: Celestial and wise, known for strategic prowess and light magic mastery. High STR(8-16) and ACC(10-16).
- **Demar**: Inventive and clever devils excelling in crafting and magical support. High INT(12-16) and MDF(10-16).
- **Creptilis**: Calculated and resilient, balancing endurance and defense with sharp battle focus. High SPI(8-16) and variable defensive stats.

---

## Role System

### Three Family Structure

**Warrior Family - Physical Combat Specialists**

- **Tier 1**: Warrior
- **Tier 2**: Knight, Berserker
- **Tier 3**:
  - From Knight: Sentinel, Paladin*, Dread Knight*
  - From Berserker: Warlord, Battle Dancer*, Spellblade*

**Magician Family - Magical Abilities and Support**

- **Tier 1**: Magician
- **Tier 2**: Elemental Mage, Light Mage, Dark Mage, Red Mage
- **Tier 2 Branches**:
  - From Light Mage: White Mage
  - From Dark Mage: Black Mage
- **Tier 3**:
  - From Red Mage: Sorcerer, Spellblade*, Sage*
  - From White Mage: Priest, Paladin*, Sage*
  - From Black Mage: Warlock, Dread Knight*, Shadowblade*

**Scout Family - Speed and Ranged Combat**

- **Tier 1**: Scout
- **Tier 2**: Rogue, Explorer
- **Tier 3**:
  - From Rogue: Assassin, Battle Dancer*, Shadowblade*
  - From Explorer: Ranger, Trailblazer

**Multi-Path Convergence Roles (marked with \*)**:

- **Paladin**: Knight → Paladin OR White Mage → Paladin
- **Dread Knight**: Knight → Dread Knight OR Black Mage → Dread Knight
- **Spellblade**: Berserker → Spellblade OR Red Mage → Spellblade
- **Battle Dancer**: Berserker → Battle Dancer OR Rogue → Battle Dancer
- **Sage**: Red Mage → Sage OR White Mage → Sage
- **Shadowblade**: Black Mage → Shadowblade OR Rogue → Shadowblade

### Advancement Rules

- **Tier 1**: Starting roles available at deck construction
- **Tier 2**: Require specific level and role requirements via Advance cards
- **Tier 3**: Elite roles with complex multi-path convergence system
- **Convergence Examples**:
  - Paladin accessible via Warrior→Knight→Paladin OR Magician→Light Mage→Paladin
  - Multiple strategic pathways to same advanced roles enable diverse build strategies
- **Named Summons**: Unique transformations with special requirements that may add unique action cards to the player's hand

### Role Effects

- **Stat Modifiers**: Multiplicative bonuses applied to calculated stats (not growth rates)
- **Special Abilities**: Role-specific actions and passive effects, including ongoing effects like card generation each turn
- **Requirement Gates**: Many cards require specific roles to play
- **Timing**: Roles affect current stats but don't contribute to growth calculations
- **Dynamic Changes**: Roles can change during gameplay via advancement

---

## Equipment System

### Equipment Types

**Weapon Cards**

- **Primary Function**: Defines attack type, base damage, and range
- **Damage Formula**: Determines how stats convert to damage output
- **Attack Range**: Grid spaces that can be targeted
- **Critical Properties**: Affects critical hit calculations
- **Attribute Types**: Physical/magical damage with elemental attributes

**Offhand Cards**

- **Secondary Weapons**: Additional attack options or dual-wielding
- **Shields**: Defensive bonuses and damage reduction
- **Utility Items**: Special abilities and tactical options

**Armor Cards**

- **Defense Bonuses**: Damage reduction and HP modifications
- **Resistances**: Protection against specific damage types
- **Special Effects**: Ongoing abilities while equipped

**Accessory Cards**

- **Stat Modifications**: Bonuses to accuracy, luck, speed, etc.
- **Utility Effects**: Card draw, resource generation, special abilities
- **Passive Abilities**: Continuous effects during gameplay

### Equipment Synthesis

- Each summon slot combines all equipment into a unified summon card
- Equipment bonuses apply to calculated stats
- Weapon determines primary attack capabilities
- Equipment effects may interact with role abilities

---

## Combat System

### Attack Resolution Process

### Attack Resolution Process

1. **Target Selection**: Choose valid target within weapon range
2. **Hit Calculation**: Roll against calculated to-hit percentage
   - **Formula**: `Base Accuracy + (Attacker ACC / 10)`
3. **Critical Check**: Separate roll for critical hit occurrence
   - **Formula**: `Floor((Attacker LCK × 0.3375) + 1.65)`
4. **Damage Calculation**: Apply appropriate damage formula
5. **Effect Application**: Resolve damage and any additional effects

### Damage Types

**Physical Damage**

- Based on STR stat and weapon power
- Reduced by target's DEF stat
- **Melee Formula**: `STR × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier`
- **Bow Formula**: `((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier`

**Magical Damage**

- Based on INT stat and spell power
- Reduced by target's MDF stat
- Formula: `INT × (1 + BasePower/100) × (INT/TargetMDF) × CritMultiplier`

**Healing**

- Based on SPI stat and heal power
- Formula: `SPI × (1 + BasePower/100) × CritMultiplier`
- Can achieve critical heals for increased effectiveness

### Damage Attributes

- **Elemental Types**: Fire, Water, Earth, Wind, Light, Dark, Neutral
- **Card Attribute System**: Every card has an elemental attribute that defines its magical typing
- **Elemental Interactions**: Damage types interact with defensive elements based on advantage/resistance relationships
- **Status Effects**: Additional effects beyond direct damage, including conditions like immobilize that may have save chances to resist

**Elemental Advantage System**:

- **Fire** beats Wind, resists Water
- **Wind** beats Earth, resists Fire
- **Earth** beats Water, resists Wind
- **Water** beats Fire, resists Earth
- **Light** beats Dark, resists Light
- **Dark** beats Light, resists Dark
- **Neutral** has no advantages or disadvantages

---

## Effect System

### Stack-Based Resolution

**Speed Levels (Fastest to Slowest):**

- **Counter**: Can respond to any effect, triggers automatically
- **Reaction**: Can be played during either player's turn
- **Action**: Only during controller's Action Phase

**Stack Rules:**

- Effects resolve Last-In-First-Out (LIFO)
- Higher speed effects create "Speed Lock" preventing lower speed responses until resolved
- **Speed Lock Examples**:
  - Action → Reaction added: No more Actions until Reaction resolves
  - Reaction → Counter added: No Actions or Reactions until Counter resolves
- Players alternate priority for adding responses to stack
- Stack must be empty before new actions can be initiated

### Trigger System

**Common Trigger Events:**

- **On Play**: When card enters In Play Zone
- **On Defeat**: When summon is destroyed
- **Phase Triggers**: During specific turn phases
- **Condition Triggers**: When game state meets specific criteria
- **Attack/Damage Triggers**: Combat-related events

**Trigger Context:**

- Player who caused the trigger
- Source card/effect that created trigger
- Target(s) of the triggering effect
- Relevant game state information

### Priority System

- **Turn Player**: Has priority during their phases
- **Non-Turn Player**: Gets first response priority to turn player's actions
- **Alternating Priority**: Players alternate opportunities to respond
- **Passing Priority**: When both players pass consecutively, stack begins resolving

### Requirements System

Effects may require:

- **Role Requirements**: Controller must have specific summon roles
- **Board State**: Specific game conditions must be met
- **Resource Costs**: Payment of specific costs
- **Timing Restrictions**: Can only be played during certain phases/speeds
- **Target Availability**: Valid targets must exist

---

## Stats & Formulas

### Core Stats

- **STR** (Strength): Physical attack damage
- **END** (Endurance): Health point calculation base
- **DEF** (Defense): Physical damage reduction
- **INT** (Intelligence): Magical attack damage
- **SPI** (Spirit): Healing effectiveness
- **MDF** (Magic Defense): Magical damage reduction
- **SPD** (Speed): Movement speed calculation
- **ACC** (Accuracy): Hit chance bonus
- **LCK** (Luck): Critical hit chance and random effects

### Growth Rate Types

- **Minimal**: +1 every 2 levels (0.5 per level) - Symbol: "--"
- **Steady**: +2 every 3 levels (0.67 per level) - Symbol: "-"
- **Normal**: +1 every level (1.0 per level) - Symbol: "\_"
- **Gradual**: +1 per level + 1 every 3 levels (1.33 per level) - Symbol: "+"
- **Accelerated**: +1 per level + 1 every 2 levels (1.5 per level) - Symbol: "++"
- **Exceptional**: +2 every level (2.0 per level) - Symbol: "\*"

**Distribution**: Bell curve with Normal most common, Exceptional/Minimal rarest

**Visual Representation**: These symbols appear on cards to provide quick recognition of stat growth potential.

### Calculated Properties

**Final Stat Calculation:**

```
FinalStat = (BaseStat + Floor(Level × GrowthRate)) × RoleModifier + EquipmentBonus + OtherBonuses
```

**Derived Properties:**

- **Max HP**: `50 + Floor(END^1.5)`
- **Movement Speed**: `2 + Floor((SPD - 10) / 5)`
- **Basic Attack To-Hit**: `90 + (ACC / 10)`
- **Critical Hit Chance**: `Floor((LCK × 0.3375) + 1.65)`
- **Ability To-Hit**: `AbilityAccuracy + (ACC / 10)`

### Damage Formulas

**Basic Physical Attack:**

```
Damage = STR × (1 + WeaponPower/100) × (STR/TargetDEF) × IF_CRIT
```

**Basic Magical Attack:**

```
Damage = INT × (1 + BasePower/100) × (INT/TargetMDF) × IF_CRIT
```

**Healing:**

```
HealAmount = SPI × (1 + BasePower/100) × IF_CRIT
```

**Critical Multiplier:** 1.5× for damage and healing

---

## Play Example

_[The extensive play-by-play example from the original document would be included here, demonstrating how all the mechanics work together in actual gameplay. This shows turn progression, card interactions, combat resolution, advancement mechanics, and victory conditions in practice.]_

---

## Future Expansion Concepts

### Planned Features

- **Auction House**: Player-to-player card trading system
- **Multiple Formats**: Different game modes beyond 3v3
- **Advanced Roles**: Additional tier 3 and unique role options
- **Enhanced Equipment**: More complex equipment interactions
- **Campaign Mode**: Single-player progression content
- **Fair Matchmaking**: Smart matchmaking system to prevent high-stat decks from facing new players (deck rating + ELO system)

### Design Goals

- **Strategic Depth**: Rich decision-making at every level
- **Accessibility**: Clear rules with intuitive mechanics
- **Replayability**: Dynamic gameplay through unique summon generation
- **Community**: Trading, competition, and social features
- **Longevity**: Expandable systems for continued content development

---

_This Game Design Document serves as the authoritative reference for Summoner's Grid game mechanics, independent of technical implementation details._
