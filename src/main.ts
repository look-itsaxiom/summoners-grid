import { UIController } from './ui-controller.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Summoner\'s Grid - Vertical Slice Demo');
    console.log('Initializing game...');
    
    try {
        const uiController = new UIController();
        console.log('Game initialized successfully!');
        
        // Make the UI controller available globally for debugging
        (window as any).game = uiController;
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
});