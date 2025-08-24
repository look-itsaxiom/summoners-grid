/**
 * Comprehensive Phaser.js Mock for Testing
 * 
 * This mock provides all the Phaser.js functionality needed for testing
 * without requiring a real Canvas/WebGL context.
 */

// Mock basic Phaser types
export const AUTO = 'AUTO';
export const WEBGL = 1;
export const CANVAS = 2;

// Mock Scale constants
export const Scale = {
  RESIZE: 'RESIZE',
  CENTER_BOTH: 'CENTER_BOTH',
  AUTO_CENTER: 'AUTO_CENTER'
};

// Mock Types namespace for GameConfig
export const Types = {
  Core: {
    GameConfig: {} as any
  }
};

// Mock GameObjects
export const GameObjects = {
  Container: class MockContainer {
    x = 0;
    y = 0;
    children: any[] = [];
    
    add(child: any) {
      this.children.push(child);
      return this;
    }
    
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
    
    setInteractive() { return this; }
    on() { return this; }
    emit() { return this; }
    setDisplaySize() { return this; }
    setTint() { return this; }
    clearTint() { return this; }
    setTexture() { return this; }
    setOrigin() { return this; }
    destroy() {}
  },
  
  Image: class MockImage {
    x = 0;
    y = 0;
    texture = '';
    
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
    
    setDisplaySize() { return this; }
    setInteractive() { return this; }
    on() { return this; }
    setTint() { return this; }
    clearTint() { return this; }
    setTexture(key: string) { 
      this.texture = key;
      return this; 
    }
    setOrigin() { return this; }
  },
  
  Text: class MockText {
    x = 0;
    y = 0;
    text = '';
    
    constructor(scene: any, x: number, y: number, text: string, style?: any) {
      this.x = x;
      this.y = y;
      this.text = text;
    }
    
    setOrigin() { return this; }
    setText(text: string) { 
      this.text = text;
      return this; 
    }
    setInteractive() { return this; }
    on() { return this; }
    setStyle() { return this; }
  },
  
  Rectangle: class MockRectangle {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    
    constructor(scene: any, x: number, y: number, width: number, height: number, color?: number) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
    
    setOrigin() { return this; }
    setInteractive() { return this; }
    on() { return this; }
  },
  
  Graphics: class MockGraphics {
    fillStyle() { return this; }
    fillRect() { return this; }
    strokeStyle() { return this; }
    strokeRect() { return this; }
    clear() { return this; }
    setPosition() { return this; }
  }
};

// Mock Loader namespace
export const Loader = {
  File: class MockFile {
    key = '';
    constructor(key: string) {
      this.key = key;
    }
  }
};

// Mock Scene class
export class Scene {
  scene = {
    key: '',
    isActive: () => true,
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn()
  };
  
  events = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn()
  };
  
  add = {
    image: jest.fn((x, y, texture) => new GameObjects.Image()),
    text: jest.fn((x, y, text, style) => new GameObjects.Text(this, x, y, text, style)),
    rectangle: jest.fn((x, y, w, h, color) => new GameObjects.Rectangle(this, x, y, w, h, color)),
    graphics: jest.fn(() => new GameObjects.Graphics())
  };
  
  cameras = {
    main: {
      width: 1280,
      height: 720,
      centerX: 640,
      centerY: 360
    }
  };
  
  input = {
    on: jest.fn(),
    keyboard: {
      on: jest.fn()
    }
  };
  
  load = {
    on: jest.fn(),
    image: jest.fn(),
    start: jest.fn()
  };
  
  time = {
    delayedCall: jest.fn()
  };
  
  game = {
    config: {
      physics: {
        arcade: {
          debug: false
        }
      }
    }
  };
  
  constructor(config?: any) {
    if (config?.key) {
      this.scene.key = config.key;
    }
  }
  
  create() {}
  preload() {}
  update() {}
}

// Mock Game class
export class Game {
  events = {
    on: jest.fn(),
    emit: jest.fn()
  };
  
  scene = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getScene: jest.fn(() => null),
    add: jest.fn()
  };
  
  scale = {
    on: jest.fn(),
    resize: jest.fn()
  };
  
  loop = {
    actualFps: 60
  };
  
  renderer = {
    type: WEBGL
  };
  
  config: any;
  
  constructor(config: any) {
    this.config = config;
    setTimeout(() => {
      this.events.emit('ready');
    }, 0);
  }
  
  destroy() {
    // Clean up mock
  }
}

// Mock Input classes
export const Input = {
  Pointer: class MockPointer {
    rightButtonDown() { return false; }
    leftButtonDown() { return true; }
    x = 0;
    y = 0;
  }
};

// Default export as Phaser object
const Phaser = {
  AUTO,
  WEBGL,
  CANVAS,
  Scale,
  Scene,
  Game,
  GameObjects,
  Input,
  Types,
  Loader
};

export default Phaser;