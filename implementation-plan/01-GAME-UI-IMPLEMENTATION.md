# Summoner's Grid - Game UI Implementation Plan

## Overview

The Game UI layer is responsible for creating a visually pleasing, animation-rich user interface that supports all game design requirements. This layer serves as the player's primary interaction point with the game, handling everything from card collection to tactical combat visualization.

**Architecture Decision**: Given the complexity of real-time tactical combat, animations, and visual effects required for Summoner's Grid, we recommend a **hybrid approach** using Phaser.js for the core game client with React for UI overlays and menus.

## UI Architecture Principles

### Core Requirements
- **Visual Clarity**: Clear representation of complex game state
- **Responsive Design**: Works across different screen sizes and devices
- **Animation Rich**: Smooth transitions and engaging visual feedback with 60fps performance
- **Accessibility**: Keyboard navigation and screen reader support
- **Real-time Performance**: Handle complex tactical combat with multiple animations
- **Game-Quality Graphics**: Support for particle effects, sprite animations, and visual polish

### Design System Foundation
- **Hybrid Architecture**: Phaser.js for game canvas + React for UI overlays
- **Component-Based UI**: Reusable React components for menus and HUD
- **Performance-First**: Optimized rendering for complex game scenes
- **Mobile-Responsive**: Touch-friendly controls with fallback to mouse/keyboard

## Technology Stack

### Core Game Rendering
- **Phaser.js 3.70+**: High-performance 2D game framework with TypeScript support
- **WebGL/Canvas**: Hardware-accelerated rendering with Canvas fallback
- **TypeScript**: Type safety and excellent developer experience

### UI Framework (Overlays & Menus)
- **React 18+**: Component framework for UI overlays and menu systems
- **Framer Motion**: Animations for React components (menus, modals, transitions)
- **Tailwind CSS**: Utility-first styling for UI components
- **React Hook Form**: Form handling with validation

### State Management
- **Zustand**: Client-side state management for UI state
- **Phaser Data Manager**: Game state management within Phaser scenes
- **React Query**: Server state management and caching

### Game-Specific Libraries
- **Socket.IO Client**: Real-time game state synchronization
- **Howler.js**: Audio management and sound effects
- **particles.js or Phaser Particles**: Particle effects for spell animations
- **Tween.js**: Advanced animation sequences

## Hybrid Architecture: Phaser + React

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │               REACT APP CONTAINER                       │ │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐ │ │
│  │  │   React UI      │  │        Phaser Game             │ │ │
│  │  │   Overlays      │  │        Canvas                  │ │ │
│  │  │  ┌───────────┐  │  │  ┌─────────────┐  ┌─────────┐ │ │ │
│  │  │  │  HUD      │  │  │  │ Game Board  │  │ Summons │ │ │ │
│  │  │  │  Menus    │  │  │  │ Cards       │  │ Effects │ │ │ │
│  │  │  │  Modals   │  │  │  │ Animations  │  │ UI      │ │ │ │
│  │  │  └───────────┘  │  │  └─────────────┘  └─────────┘ │ │ │
│  │  └─────────────────┘  └─────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Why Phaser.js for Game Client?

**Performance Benefits:**
- **Hardware Acceleration**: WebGL rendering for smooth 60fps gameplay
- **Sprite Management**: Efficient sprite batching and texture atlas support
- **Animation System**: Built-in tweening and sprite animation systems
- **Physics Integration**: Optional physics engines for smooth movement

**Game-Specific Features:**
- **Input Handling**: Sophisticated mouse, touch, and keyboard input management
- **Audio Management**: Advanced audio system with spatial audio support  
- **Scene Management**: Organized game state and scene transitions
- **Plugin System**: Extensible with community plugins

**TypeScript Support:**
- **Full Type Definitions**: Complete TypeScript definitions available
- **Type-Safe Development**: Catch errors at compile time
- **IntelliSense Support**: Excellent IDE support for game development

### React Integration Strategy

React handles all non-game UI elements:
- **Authentication flows** (login, registration)
- **Main menu navigation** and settings
- **Card collection management** and deck building
- **Game lobby** and matchmaking interfaces
- **HUD overlays** (health, mana, turn indicators)
- **Modal dialogs** and notifications

## Implementation Architecture

### Project Structure

```
packages/game-client/
├── src/
│   ├── components/                 # React Components
│   │   ├── auth/                  # Authentication UI
│   │   ├── collection/            # Card collection management
│   │   ├── lobby/                 # Game lobby and matchmaking
│   │   ├── hud/                   # In-game HUD overlays
│   │   └── shared/                # Shared UI components
│   ├── game/                      # Phaser Game Code
│   │   ├── scenes/                # Phaser game scenes
│   │   │   ├── MainGameScene.ts   # Core tactical combat
│   │   │   ├── MainMenuScene.ts   # Game main menu
│   │   │   └── LoadingScene.ts    # Asset loading
│   │   ├── entities/              # Game object classes
│   │   │   ├── Card.ts           # Card game objects
│   │   │   ├── Summon.ts         # Summon game objects
│   │   │   └── GameBoard.ts      # Board management
│   │   ├── systems/               # Game systems
│   │   │   ├── InputManager.ts   # Input handling
│   │   │   ├── AnimationManager.ts # Animation control
│   │   │   └── EffectManager.ts  # Visual effects
│   │   └── utils/                 # Game utilities
│   ├── stores/                    # Zustand state stores
│   ├── services/                  # API and WebSocket services
│   ├── hooks/                     # Custom React hooks
│   └── assets/                    # Game assets
│       ├── images/                # Sprite sheets, textures
│       ├── audio/                 # Sound effects, music
│       └── data/                  # Game data JSON files
```

## Core Implementation Components

### 1. Phaser Game Client

**Main Game Scene (MainGameScene.ts)**

**Purpose**: Handle the core tactical combat gameplay with full animation support.

**Key Features**:
- Interactive 12x14 grid with smooth hover and selection states
- Real-time summon positioning with smooth movement animations
- Territory highlighting with visual effects
- Particle effects for spells and abilities
- Damage numbers and status effect visualization

**Implementation Approach**:
```typescript
// Example scene structure (no full implementation)
export class MainGameScene extends Phaser.Scene {
  private gameBoard: GameBoard;
  private summons: Map<string, SummonSprite>;
  private effectManager: EffectManager;
  
  constructor() {
    super({ key: 'MainGameScene' });
  }
  
  create(): void {
    // Initialize game board visualization
    this.gameBoard = new GameBoard(this, 12, 14);
    
    // Set up input handlers for tactical combat
    this.setupInputHandlers();
    
    // Initialize particle systems for effects
    this.effectManager = new EffectManager(this);
  }
  
  // Key responsibilities:
  // - Render 12x14 grid with proper coordinate system
  // - Animate summon movements and combat
  // - Handle tactical input (movement, targeting, abilities)
  // - Display visual effects and animations
  // - Sync with game engine via WebSocket events
}
```

**Game Board Management (GameBoard.ts)**
```typescript
export class GameBoard {
  private scene: Phaser.Scene;
  private tiles: Phaser.GameObjects.Image[][];
  private highlightGraphics: Phaser.GameObjects.Graphics;
  
  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    this.createGrid(width, height);
  }
  
  // Responsibilities:
  // - Create interactive grid tiles
  // - Handle tile highlighting and selection
  // - Manage territory control visualization
  // - Provide world <-> grid coordinate conversion
}
```

### 2. React UI Overlays

**Game HUD Component (GameHUD.tsx)**

**Purpose**: Display game information and controls that overlay the Phaser canvas.

**Key Features**:
- Player health, mana, and turn indicators
- Hand display with card previews
- Effect stack visualization
- Game menu and settings access

**Implementation Approach**:
```typescript
// Example component structure (no implementation)
interface GameHUDProps {
  gameState: GameState;
  onCardSelect: (cardId: string) => void;
  onMenuToggle: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({ 
  gameState, 
  onCardSelect, 
  onMenuToggle 
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* HUD elements with pointer-events-auto on interactive parts */}
      <div className="top-4 left-4 pointer-events-auto">
        <PlayerStats player={gameState.currentPlayer} />
      </div>
      
      <div className="bottom-4 inset-x-4 pointer-events-auto">
        <HandDisplay 
          cards={gameState.currentPlayer.hand}
          onCardSelect={onCardSelect}
        />
      </div>
    </div>
  );
};

// Key responsibilities:
// - Overlay game information without blocking Phaser input
// - Provide touch-friendly controls for mobile
// - Maintain responsive design across screen sizes
// - Handle React state updates from WebSocket events
```

### 3. State Management Bridge

**Phaser-React Bridge (GameBridge.ts)**

**Purpose**: Coordinate state between Phaser game client and React UI components.

**Key Features**:
- Bidirectional event communication
- State synchronization
- WebSocket event distribution

**Implementation Approach**:
```typescript
export class GameBridge extends EventTarget {
  private phaserScene: MainGameScene;
  private reactStore: GameStore;
  
  constructor(phaserScene: MainGameScene, reactStore: GameStore) {
    super();
    this.phaserScene = phaserScene;
    this.reactStore = reactStore;
    this.setupEventHandlers();
  }
  
  // Forward events from Phaser to React
  onPhaserEvent(eventType: string, data: any): void {
    this.reactStore.dispatch({ type: eventType, payload: data });
  }
  
  // Forward events from React to Phaser
  onReactEvent(eventType: string, data: any): void {
    this.phaserScene.handleReactEvent(eventType, data);
  }
  
  // Key responsibilities:
  // - Maintain synchronized state between Phaser and React
  // - Route WebSocket events to appropriate handlers
  // - Provide clean interface for cross-system communication
}
```

**Design Considerations**:
- Use CSS Grid or Canvas for efficient rendering
- Implement smooth interpolation for position changes
- Support zoom and pan for different screen sizes
- Show range indicators and area of effect visualizations

### 2. Card Display Component

**Purpose**: Render individual cards with all relevant information and interactions.

**Key Features**:
- Consistent card layout across different card types
- Interactive states (hover, selected, disabled)
- Tooltip display for detailed card information
- Animation support for card state changes

**Implementation Approach**:
```typescript
// Example component structure
interface CardDisplayProps {
  card: Card;
  isSelected?: boolean;
  isPlayable?: boolean;
  onCardClick?: (card: Card) => void;
  onCardHover?: (card: Card) => void;
  displayMode: 'hand' | 'board' | 'collection';
}

// Key responsibilities:
// - Render card with appropriate styling based on type
// - Show card costs, requirements, and effects clearly
// - Handle different display contexts (hand, board, collection)
// - Provide accessibility features
```

**Design Considerations**:
- Standardized card dimensions and aspect ratios
- Clear typography hierarchy for card text
- Icon system for card types, attributes, and effects
- Color coding for different card families and rarities

### 3. Hand Manager Component

**Purpose**: Display and manage the player's hand of cards during gameplay.

**Key Features**:
- Card arrangement with fan-out or linear layouts
- Drag-and-drop support for playing cards
- Hand size management with overflow handling
- Quick access to advance deck

**Implementation Approach**:
```typescript
// Example component structure
interface HandManagerProps {
  hand: Card[];
  selectedCard?: Card;
  onCardPlay: (card: Card, target?: Target) => void;
  onCardSelect: (card: Card) => void;
  maxHandSize: number;
}

// Key responsibilities:
// - Arrange cards in visually pleasing layout
// - Handle card selection and targeting
// - Show playability status for each card
// - Manage hand overflow scenarios
```

**Design Considerations**:
- Smooth animations for card addition/removal
- Clear visual feedback for playable cards
- Efficient layout that maximizes card visibility
- Touch-friendly interactions for mobile devices

### 4. Effect Stack Display

**Purpose**: Visualize the stack-based effect resolution system.

**Key Features**:
- Clear representation of effects waiting to resolve
- Priority ordering with visual indicators
- Interactive elements for response windows
- Animation for stack changes

**Implementation Approach**:
```typescript
// Example component structure
interface StackDisplayProps {
  effectStack: Effect[];
  currentPlayer: PlayerId;
  canRespond: boolean;
  onResponseSubmit: (response: Response) => void;
}

// Key responsibilities:
// - Show effects in Last-In-First-Out order
// - Indicate which player can respond
// - Display effect details on hover/click
// - Handle response submission
```

**Design Considerations**:
- Compact but readable representation
- Clear visual hierarchy for stack ordering
- Responsive design for different stack sizes
- Integration with card tooltips for effect details

## State Management Strategy

### Global State with Zustand

```typescript
// Example store structure
interface GameUIStore {
  // UI State
  selectedCard: Card | null;
  hoveredCell: Position | null;
  activeModal: ModalType | null;
  
  // Game State (synchronized with server)
  gameState: GameState | null;
  playerHand: Card[];
  opponentHandSize: number;
  
  // Actions
  selectCard: (card: Card | null) => void;
  setHoveredCell: (position: Position | null) => void;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}
```

### Local Component State
- Use React state for purely UI-driven interactions
- Form inputs and temporary UI states
- Animation states and transitions
- Local loading and error states

## Animation and Visual Effects

### Core Animation Principles
- **Meaningful Motion**: Animations should convey game state changes
- **Performance First**: Use CSS transforms and GPU acceleration
- **Consistent Timing**: Standardized duration and easing curves
- **Accessibility**: Respect user preferences for reduced motion

### Key Animation Scenarios

**Card Movements**:
- Hand to board: Arc trajectory with scaling
- Board positioning: Smooth interpolation between grid cells
- Card drawing: Slide in from deck area
- Card discarding: Fade out with slight scale

**Combat Animations**:
- Attack indicators: Projectile or sweep animations
- Damage numbers: Pop-up with physics-based movement
- Summon destruction: Dramatic fade with particle effects
- Healing effects: Gentle glow and upward particles

**UI Transitions**:
- Modal appearances: Scale and fade with backdrop blur
- Panel transitions: Slide animations with proper stacking
- Loading states: Skeleton screens and progress indicators
- Error states: Shake animations and color changes

### Implementation with Framer Motion

```typescript
// Example animation configuration
const cardAnimations = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { duration: 0.3, ease: "easeOut" }
};

const gameboardAnimations = {
  summonMove: {
    transition: { duration: 0.5, ease: "easeInOut" }
  },
  combatEffect: {
    initial: { scale: 0 },
    animate: { scale: 1.2 },
    exit: { scale: 0 },
    transition: { duration: 0.2 }
  }
};
```

## Responsive Design Strategy

### Breakpoint System
- **Mobile**: 320px - 768px (Single column, simplified interactions)
- **Tablet**: 768px - 1024px (Adapted layouts, touch-optimized)
- **Desktop**: 1024px+ (Full feature set, keyboard shortcuts)

### Layout Adaptations

**Mobile Layout**:
- Vertical game board orientation
- Tabbed interface for different game areas
- Bottom sheet for card details
- Simplified hand display

**Tablet Layout**:
- Landscape-optimized game board
- Side panels for hand and game info
- Touch-friendly card interactions
- Gesture support for common actions

**Desktop Layout**:
- Full-width game board with side panels
- Keyboard shortcuts for all actions
- Hover states and tooltips
- Multi-monitor support considerations

## Accessibility Implementation

### Keyboard Navigation
- Tab order that follows logical game flow
- Arrow key navigation for grid-based interfaces
- Hotkeys for common actions (play card, end turn, etc.)
- Escape key to cancel actions

### Screen Reader Support
- Semantic HTML with proper ARIA labels
- Live regions for game state announcements
- Descriptive text for visual-only elements
- Alternative text for card images

### Visual Accessibility
- High contrast mode support
- Scalable text sizes
- Color-blind friendly palette
- Focus indicators that meet WCAG guidelines

## Implementation Steps

### Phase 1: Foundation (Week 1)
1. **Project Setup**
   - Initialize React + TypeScript + Vite project
   - Configure Tailwind CSS and design tokens
   - Set up component library structure
   - Implement basic routing with React Router

2. **Design System**
   - Create typography and spacing scale
   - Define color palette and theme variables
   - Build basic UI components (Button, Input, Modal)
   - Set up icon library and asset management

3. **Layout Framework**
   - Implement responsive layout components
   - Create navigation and menu systems
   - Build modal and overlay systems
   - Set up error boundaries and loading states

### Phase 2: Game Components (Week 2)
1. **Core Game UI**
   - Build GameBoard component with grid rendering
   - Create CardDisplay component with basic styling
   - Implement HandManager for card arrangement
   - Add basic interaction handling

2. **State Management**
   - Set up Zustand stores for UI state
   - Implement WebSocket client integration
   - Create game state synchronization
   - Add error handling and reconnection logic

3. **Basic Animations**
   - Add Framer Motion to project
   - Implement card hover and selection animations
   - Create smooth transitions between UI states
   - Add loading and empty state animations

### Phase 3: Advanced Features (Week 3)
1. **Interactive Game Board**
   - Add drag-and-drop for card playing
   - Implement target selection system
   - Create range and movement indicators
   - Add combat animation system

2. **Effect Stack Visualization**
   - Build StackDisplay component
   - Implement response window UI
   - Add priority and timing indicators
   - Create effect resolution animations

3. **Collection Interface**
   - Build card collection browser
   - Create deck builder interface
   - Implement search and filtering
   - Add pack opening animations

### Phase 4: Polish and Optimization (Week 4)
1. **Performance Optimization**
   - Implement virtualization for large lists
   - Optimize re-renders with React.memo
   - Add code splitting and lazy loading
   - Minimize bundle size

2. **Accessibility and Testing**
   - Complete keyboard navigation implementation
   - Add comprehensive ARIA labels
   - Test with screen readers
   - Implement automated accessibility testing

3. **Mobile Experience**
   - Optimize touch interactions
   - Add gesture support where appropriate
   - Test on various mobile devices
   - Implement PWA features if needed

## Performance Considerations

### Rendering Optimization
- Use React.memo for expensive components
- Implement proper key props for lists
- Minimize state updates and re-renders
- Use CSS transforms for animations

### Asset Management
- Optimize image assets (WebP format, proper sizing)
- Implement sprite sheets for card icons
- Use lazy loading for non-critical assets
- Compress and minify all static assets

### Code Splitting
- Split routes into separate bundles
- Lazy load game components
- Separate vendor libraries
- Implement dynamic imports for features

## Testing Strategy

### Unit Testing
- Test individual components in isolation
- Mock external dependencies (WebSocket, API)
- Test component behavior and state changes
- Use React Testing Library for user interaction testing

### Integration Testing
- Test component interactions and data flow
- Test WebSocket connection and message handling
- Test game state synchronization
- Test responsive layout changes

### Visual Testing
- Screenshot testing for consistent UI
- Animation testing for smooth transitions
- Cross-browser compatibility testing
- Performance testing on various devices

## Common Pitfalls and Solutions

### State Synchronization Issues
- **Problem**: UI state getting out of sync with server
- **Solution**: Implement optimistic updates with rollback mechanism
- **Prevention**: Use strongly typed message validation

### Performance Degradation
- **Problem**: Game board rendering becomes slow with many elements
- **Solution**: Use virtual rendering or canvas-based rendering
- **Prevention**: Profile performance early and set budgets

### Mobile Touch Interactions
- **Problem**: Drag and drop doesn't work well on touch devices
- **Solution**: Implement alternative touch-based interactions
- **Prevention**: Design mobile-first interaction patterns

### Animation Complexity
- **Problem**: Animations interfere with each other or game state
- **Solution**: Use animation queue system and proper cleanup
- **Prevention**: Plan animation architecture before implementation

This Game UI implementation plan provides a solid foundation for creating an engaging, accessible, and performant user interface for Summoner's Grid. The modular architecture allows for iterative development while maintaining code quality and user experience standards.