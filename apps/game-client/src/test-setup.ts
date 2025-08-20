/**
 * Jest Setup for Phaser.js Mocking
 * 
 * This file configures Jest to properly mock Phaser.js components
 * for testing without requiring a full browser environment.
 */

// Mock performance API
if (!global.performance) {
  Object.defineProperty(global, 'performance', {
    value: {
      now: () => Date.now(),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000
      }
    },
    writable: true
  });
}

// Mock requestAnimationFrame
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn();
}

console.log('🧪 Jest setup complete: Phaser.js mocking configured');