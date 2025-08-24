/**
 * Jest Setup for Phaser.js Mocking
 * 
 * This file configures Jest to properly mock Phaser.js components
 * for testing without requiring a full browser environment.
 */

// Mock Canvas and WebGL context
if (!global.HTMLCanvasElement) {
  Object.defineProperty(global, 'HTMLCanvasElement', {
    value: class HTMLCanvasElement {
      width = 800;
      height = 600;
      style = {};
      
      getContext() {
        return {
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          fillRect: jest.fn(),
          strokeRect: jest.fn(),
          clearRect: jest.fn(),
          fill: jest.fn(),
          stroke: jest.fn(),
          beginPath: jest.fn(),
          moveTo: jest.fn(),
          lineTo: jest.fn(),
          arc: jest.fn(),
          save: jest.fn(),
          restore: jest.fn(),
          translate: jest.fn(),
          rotate: jest.fn(),
          scale: jest.fn(),
          drawImage: jest.fn(),
          createImageData: jest.fn(() => ({ data: [] })),
          getImageData: jest.fn(() => ({ data: [] })),
          putImageData: jest.fn(),
          measureText: jest.fn(() => ({ width: 0 })),
          createLinearGradient: jest.fn(() => ({
            addColorStop: jest.fn()
          })),
          canvas: { width: 800, height: 600 }
        };
      }
      
      toDataURL() { 
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; 
      }
      
      addEventListener() {}
      removeEventListener() {}
    },
    writable: true
  });
}

// Extend existing document object instead of replacing it
if (global.document) {
  const originalCreateElement = global.document.createElement;
  global.document.createElement = jest.fn((tagName) => {
    if (tagName === 'canvas') {
      return new global.HTMLCanvasElement();
    }
    if (originalCreateElement) {
      return originalCreateElement.call(global.document, tagName);
    }
    return {
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      appendChild: jest.fn(),
      removeChild: jest.fn()
    };
  });
  
  // Add getElementById if it doesn't exist
  if (!global.document.getElementById) {
    global.document.getElementById = jest.fn(() => ({
      style: {},
      appendChild: jest.fn(),
      removeChild: jest.fn()
    }));
  }
}

// Mock Window methods safely
if (global.window) {
  Object.assign(global.window, {
    requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
    cancelAnimationFrame: jest.fn(),
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1
  });
}

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

// Mock requestAnimationFrame globally
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn();
}

// Mock Image constructor
if (!global.Image) {
  Object.defineProperty(global, 'Image', {
    value: class Image {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src = '';
      width = 0;
      height = 0;
      
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    },
    writable: true
  });
}

// Mock Audio constructor
if (!global.Audio) {
  Object.defineProperty(global, 'Audio', {
    value: class Audio {
      play = jest.fn();
      pause = jest.fn();
      volume = 1;
      currentTime = 0;
      duration = 0;
      addEventListener = jest.fn();
      removeEventListener = jest.fn();
    },
    writable: true
  });
}

// Mock WebGL context
const mockWebGLContext = {
  canvas: { width: 800, height: 600 },
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
  getParameter: jest.fn(),
  createShader: jest.fn(),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  createProgram: jest.fn(),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  useProgram: jest.fn(),
  createBuffer: jest.fn(),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  getAttribLocation: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  getUniformLocation: jest.fn(),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform4f: jest.fn(),
  uniformMatrix4fv: jest.fn(),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
  createTexture: jest.fn(),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  clearColor: jest.fn(),
  clear: jest.fn(),
  viewport: jest.fn()
};

// Mock WebGL constants
Object.assign(mockWebGLContext, {
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963,
  STATIC_DRAW: 35044,
  TEXTURE_2D: 3553,
  RGBA: 6408,
  UNSIGNED_BYTE: 5121,
  TEXTURE_MAG_FILTER: 10240,
  TEXTURE_MIN_FILTER: 10241,
  LINEAR: 9729,
  COLOR_BUFFER_BIT: 16384,
  DEPTH_BUFFER_BIT: 256,
  TRIANGLES: 4
});

console.log('🧪 Jest setup complete: Comprehensive Phaser.js mocking configured');