# Summoner's Grid - Vertical Slice Demo Implementation Plan

## Overview

This document outlines the implementation plan for a **vertical slice demo** of Summoner's Grid - a fully playable version focusing purely on core gameplay mechanics without broader scope features like multiplayer infrastructure or economy systems.

## Demo Scope & Goals

### Core Objective
Create a complete, playable implementation of Summoner's Grid that demonstrates all essential game mechanics described in the GDD, suitable for:
- Playtesting core mechanics
- Validating game balance
- Demonstrating the full game concept
- Serving as foundation for full implementation

### Technology Stack
- **TypeScript** (required constraint)
- **HTML5/CSS3** for UI and grid rendering
- **ES6 Modules** for clean architecture
- **Local storage** for game state persistence
- **No external frameworks** to maintain simplicity and developer accessibility

## Implementation Architecture

### Core System Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Controller │◄──►│   Game Engine   │◄──►│  Card System    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Event Handling  │    │   Game Board    │    │ Effect System   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Visual Updates  │    │ Player/Summons  │    │ Combat System   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Class Structure

#### Core Classes
1. **Game** - Main game controller and state management
2. **GameBoard** - 12x14 grid with position validation and unit tracking
3. **Player** - Hand management, decks, victory points, summons
4. **SummonUnit** - Individual units with stats, level, equipment, positioning
5. **Card** (Abstract) - Base class for all card types
6. **UIController** - Interface between game logic and DOM

#### Card Type Hierarchy
```
Card (Abstract)
├── SummonCard - Creatures that become units on board
├── ActionCard - Instant effects with role requirements
├── RoleCard - Class definitions with stat modifiers
├── EquipmentCard - Weapons, armor, accessories
└── Future Extensions:
    ├── BuildingCard - Persistent board effects
    ├── QuestCard - Objective-based rewards
    ├── CounterCard - Reactive defense
    └── ReactionCard - Flexible responses
```

## Implementation Phases

### Phase 1: Core Foundation (Days 1-2)
**Goal**: Basic game structure and data flow

#### Tasks:
- [x] Set up TypeScript project with build pipeline
- [x] Implement core type definitions and enums
- [x] Create basic Game class with turn management
- [x] Implement GameBoard with 12x14 grid
- [x] Create Player class with hand/deck management
- [x] Build simple HTML/CSS UI framework

#### Deliverables:
- Working turn-based structure
- Visual game board with territory marking
- Basic hand display and card representation

### Phase 2: Card System (Days 3-4)
**Goal**: Playable cards with meaningful effects

#### Tasks:
- [x] Implement Card base class and type hierarchy
- [x] Create SummonCard with equipment synthesis
- [x] Build ActionCard system with role requirements
- [x] Implement card effect system with validation
- [x] Create demo deck with Alpha Set cards

#### Deliverables:
- Summon cards create units on board
- Action cards modify game state
- Card playing restrictions enforced
- 3-card summon draws working

### Phase 3: Combat & Units (Days 5-6)
**Goal**: Fully functional combat system

#### Tasks:
- [x] Implement SummonUnit with stat calculation
- [x] Create movement system with range validation
- [x] Build attack resolution with hit/crit/damage
- [x] Implement role system with stat modifiers
- [x] Add equipment effects and bonuses

#### Deliverables:
- Units can move within movement speed
- Combat uses accurate GDD formulas
- Critical hits and damage types working
- Equipment properly modifies stats

### Phase 4: Game Flow (Days 7-8)
**Goal**: Complete game loop with victory conditions

#### Tasks:
- [x] Implement all turn phases (Draw/Level/Action/End)
- [x] Create victory point system
- [x] Add level-up mechanics with stat growth
- [x] Build game ending and restart functionality
- [x] Implement hand limit and card cycling

#### Deliverables:
- Full turn progression working
- Games end at 3 Victory Points
- Units level up and grow stronger
- Hand management enforced

### Phase 5: UI Polish (Days 9-10)
**Goal**: Intuitive and responsive interface

#### Tasks:
- [x] Create interactive board with click handling
- [x] Implement card selection and targeting
- [x] Add visual feedback for valid actions
- [x] Build game log for action tracking
- [x] Create responsive design for different screens

#### Deliverables:
- Smooth card playing experience
- Clear visual indicators for game state
- Real-time updates without page refresh
- Accessible on mobile and desktop

## Simplified Features for Demo

### Streamlined Elements
1. **Fixed Identical Decks**: Both players use same pre-built deck to focus on mechanics
2. **Local Play Only**: No networking, single device hot-seat play
3. **Basic Card Types**: Focus on Summon/Action/Role/Equipment, defer advanced types
4. **Simplified Effect Stack**: Direct resolution without complex timing
5. **No Deck Building**: Pre-constructed decks to demonstrate gameplay

### Excluded Features (For Full Version)
- Online multiplayer and matchmaking
- Card collection and pack opening
- Deck construction interface  
- Trading and economy systems
- Advanced card types (Building, Quest, Counter, Reaction)
- Complex effect stacking and priority system
- Animations and visual effects
- Account system and progression

## Key Mechanics Implemented

### Turn Structure
```
Turn Phases:
1. Draw Phase - Draw 1 card (skip turn 1)
2. Level Phase - All controlled summons gain 1 level
3. Action Phase - Play cards, move units, attack
4. End Phase - Discard to hand limit, check victory
```

### Combat System
- **Hit Calculation**: Base accuracy + (ACC/10) vs random roll
- **Critical Hits**: LCK-based formula with 1.5x multiplier
- **Damage Types**: Physical (STR-based), Magical (INT-based)
- **Equipment Impact**: Weapons define attack type and power
- **Range System**: Movement and attack ranges validated

### Card Effects
- **Role Requirements**: Cards check for required summon families
- **Target Validation**: Effects verify valid targets exist
- **Resource Management**: Hand limits and deck cycling
- **Stat Modification**: Equipment and roles modify calculated stats

## Testing Strategy

### Core Mechanics Validation
1. **Turn Progression**: Verify all phases execute correctly
2. **Combat Accuracy**: Test damage formulas match GDD specifications
3. **Victory Conditions**: Confirm games end at 3 VP correctly
4. **Card Interactions**: Validate role requirements and targeting
5. **Edge Cases**: Test empty decks, full hands, defeated units

### User Experience Testing
1. **Interface Responsiveness**: All clicks produce expected results
2. **Visual Clarity**: Game state always clearly communicated
3. **Error Handling**: Invalid actions provide clear feedback
4. **Performance**: Smooth gameplay without lag or freezing

## Success Criteria

### Functional Requirements
- ✅ Complete 3v3 games from start to victory
- ✅ All Alpha Set cards implemented with correct effects
- ✅ Combat system matches GDD formulas exactly
- ✅ Turn structure follows GDD specifications
- ✅ Victory conditions working correctly

### Technical Requirements  
- ✅ TypeScript with clean, maintainable code
- ✅ No runtime errors or crashes
- ✅ Responsive design works on multiple screen sizes
- ✅ Code structure supports easy extension
- ✅ Average developer can understand and modify

### User Experience Requirements
- ✅ Intuitive interface requiring minimal explanation
- ✅ Visual feedback for all player actions
- ✅ Clear game state communication
- ✅ Smooth gameplay flow without technical friction

## Demo Delivery

### Final Deliverables
1. **Playable Game**: Complete vertical slice ready for playtesting
2. **Source Code**: Clean, commented TypeScript implementation
3. **Documentation**: Setup instructions and architecture guide
4. **Demo Scenarios**: Prepared game states showing different mechanics

### Handoff Documentation
- Setup and build instructions
- Code architecture overview
- Extension points for full implementation
- Known limitations and future considerations

This vertical slice serves as both a complete game experience and the foundation for the full Summoner's Grid implementation, demonstrating that all core mechanics work together harmoniously while providing a clear roadmap for expansion.