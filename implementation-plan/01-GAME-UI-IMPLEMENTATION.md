# Summoner's Grid - Game UI Implementation Plan

## Overview

The Game UI layer is responsible for creating a visually pleasing, animation-rich user interface that supports all game design requirements. This layer serves as the player's primary interaction point with the game, handling everything from card collection to tactical combat visualization.

## UI Architecture Principles

### Core Requirements
- **Visual Clarity**: Clear representation of complex game state
- **Responsive Design**: Works across different screen sizes and devices
- **Animation Rich**: Smooth transitions and engaging visual feedback
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance**: 60fps gameplay on modern browsers

### Design System Foundation
- **Component-Based**: Reusable UI components with consistent styling
- **State-Driven**: UI reflects game state changes automatically
- **Theme Support**: Consistent visual language across all interfaces
- **Mobile-First**: Responsive design starting from mobile constraints

## Technology Stack

### Core Technologies
- **React 18+**: Component framework with concurrent features
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast development server and optimized builds
- **Tailwind CSS**: Utility-first styling framework

### UI Enhancement Libraries
- **Framer Motion**: Advanced animations and transitions
- **React Hook Form**: Form handling with validation
- **React Query**: Server state management and caching
- **Zustand**: Client-side state management

### Game-Specific Libraries
- **React DnD**: Drag and drop for card interactions
- **React Spring**: Physics-based animations for card movements
- **Konva.js or Three.js**: 2D/3D game board rendering
- **Socket.IO Client**: Real-time game state synchronization

## UI Component Architecture

```
src/
├── components/
│   ├── game/
│   │   ├── GameBoard/          # Main game board component
│   │   ├── CardDisplay/        # Individual card rendering
│   │   ├── HandManager/        # Player hand interface
│   │   ├── StackDisplay/       # Effect stack visualization
│   │   └── TurnIndicator/      # Turn phase display
│   ├── collection/
│   │   ├── CardCollection/     # Card browsing interface
│   │   ├── DeckBuilder/        # Deck construction tools
│   │   └── PackOpener/         # Card pack opening animation
│   ├── lobby/
│   │   ├── GameLobby/          # Pre-game lobby
│   │   ├── MatchmakingQueue/   # Queue status display
│   │   └── PlayerList/         # Connected players
│   └── shared/
│       ├── Layout/             # App layout components
│       ├── Navigation/         # Menu and navigation
│       └── Modals/             # Dialog and overlay components
├── hooks/                      # Custom React hooks
├── stores/                     # Zustand state stores
├── services/                   # API and WebSocket services
├── utils/                      # Helper functions
└── assets/                     # Images, sounds, fonts
```

## Core UI Components

### 1. Game Board Component

**Purpose**: Visualize the 12x14 grid battlefield with summons, buildings, and territories.

**Key Features**:
- Interactive grid with hover states and click handlers
- Real-time position updates for summons
- Territory highlighting (player controlled vs neutral)
- Animation support for movement, combat, and effects

**Implementation Approach**:
```typescript
// Example component structure (no implementation)
interface GameBoardProps {
  gameState: GameState;
  onCellClick: (position: Position) => void;
  onSummonSelect: (summonId: string) => void;
  highlightedCells?: Position[];
}

// Key responsibilities:
// - Render 12x14 grid with proper coordinate system
// - Display summons at correct positions with animations
// - Show valid movement/action targets
// - Handle drag-and-drop for summon positioning
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