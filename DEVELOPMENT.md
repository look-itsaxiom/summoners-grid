# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Run development server (hot reload enabled)
npm run dev

# Build for production
npm run build
```

## Architecture Overview

### Type System (`src/types.ts`)
Complete TypeScript definitions matching the GDD:
- `CardType`: All 9 card types (SUMMON, ACTION, ROLE, etc.)
- `Attribute`: 7 attributes (FIRE, WATER, EARTH, WIND, LIGHT, DARK, NEUTRAL)
- `Species`: 5 species (GIGNEN, FAE, STONEHEART, WILDERLING, ANGAR)
- `Role`: 12 roles from base to advanced
- `Zone`: Game zones for card movement
- `TurnPhase`: 4 turn phases
- `GrowthRate`: Stat growth rates
- `GameState`: Complete game state interface
- `SummonUnit`: Active summon on battlefield

### Game Configuration (`src/constants.ts`)
- Board: 12x14 grid, 48px cells
- Game rules: 3 summons max, levels 5-20, 3 VP to win
- Colors: Territory and UI colors
- Growth rates: SLOW (0.75), NORMAL (1.0), FAST (1.25)

### Game Mechanics (`src/gameUtils.ts`)
Implements core formulas from the GDD:
- `calculateStats()`: Apply growth rates per level
- `calculateMaxHP()`: HP = END × 10
- `calculateMovement()`: MV = floor(SPD / 10) + 4
- `calculateCritChance()`: floor((LCK × 0.3375) + 1.65)
- `calculateHitChance()`: 50 + ACC
- `levelUpSummon()`: Level up with HP damage retention

### Card Data (`src/cardData.ts`)
Sample cards from Alpha Cards documentation:
- 6 summon cards (3 per player)
- 3 action cards
- Helper functions to get player decks

### Main Game Scene (`src/GameScene.ts`)
Phaser scene implementing:
- Game state initialization
- 12x14 grid rendering with territories
- Summon placement and visualization
- Turn phase progression
- UI with VP counters, turn info, summon details
- Click interaction for summon selection
- Level-up animations

## Current Limitations

### Not Yet Implemented
1. **Card System**
   - Drawing from deck
   - Playing cards from hand
   - Card UI and hand visualization

2. **Movement System**
   - Click to move summons
   - Movement range visualization
   - Pathfinding
   - Movement cost tracking

3. **Combat System**
   - Attack targeting
   - Damage calculation
   - Hit/crit rolls
   - HP reduction

4. **Effect System**
   - Stack-based resolution
   - Counter/Reaction timing
   - Effect triggers

5. **Advanced Systems**
   - Role advancement
   - Equipment
   - Buildings
   - Quests

## Adding New Features

### Adding a New Card Type
1. Add card data to `src/cardData.ts`
2. Add interface to `src/types.ts` if needed
3. Handle in `GameScene.ts` play logic

### Adding Movement
1. Create `src/MovementSystem.ts`
2. Implement pathfinding (A* or BFS)
3. Add click handlers for destination
4. Update board state
5. Add visual feedback (highlights)

### Adding Combat
1. Create `src/CombatSystem.ts`
2. Implement damage formulas from GDD
3. Add attack targeting
4. Handle HP reduction
5. Check for defeat/VP awards

### Adding Effects
1. Create `src/EffectStack.ts`
2. Implement LIFO resolution
3. Add speed-based priority
4. Handle response windows

## File Organization Recommendations

```
src/
├── index.ts                    # Entry point
├── index.html                  # HTML template
├── types.ts                    # Type definitions
├── constants.ts                # Configuration
├── cardData.ts                 # Card definitions
├── gameUtils.ts                # Core mechanics
├── scenes/
│   ├── GameScene.ts           # Main game scene
│   ├── MenuScene.ts           # Menu (future)
│   └── DeckBuilderScene.ts    # Deck builder (future)
├── systems/
│   ├── MovementSystem.ts      # Movement logic (future)
│   ├── CombatSystem.ts        # Combat logic (future)
│   ├── EffectStack.ts         # Effect resolution (future)
│   └── CardSystem.ts          # Card playing (future)
└── ui/
    ├── CardUI.ts              # Card rendering (future)
    ├── HandUI.ts              # Hand display (future)
    └── InfoPanel.ts           # Info panel (future)
```

## Testing Checklist

When adding features, test:
- [ ] Turn phase progression works correctly
- [ ] State updates properly
- [ ] UI reflects state changes
- [ ] No console errors
- [ ] Performance is acceptable
- [ ] Matches GDD specifications

## Debugging Tips

1. **Check console**: Phaser logs useful info
2. **Inspect gameState**: Use browser devtools
3. **Visual debugging**: Add debug graphics
4. **Hot reload**: Changes reload automatically in dev mode

## Performance Notes

- Phaser uses Canvas/WebGL rendering
- Current bundle size: ~1.15 MB (mostly Phaser)
- Consider code splitting for larger projects
- Use object pooling for many sprites

## Resources

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)
- Summoner's Grid GDD.md (complete rules)
- Alpha Cards.md (card reference)
- Summoner's Grid Play Example.md (gameplay walkthrough)
