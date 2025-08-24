import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should render the game component', () => {
    const { container } = render(<App />);
    const gameContainer = container.querySelector('#phaser-game-container');
    expect(gameContainer).toBeTruthy();
  });

  it('should have the correct app structure', () => {
    const { container } = render(<App />);
    const appContainer = container.querySelector('.app-container');
    const gameComponent = container.querySelector('.game-component-container');
    
    expect(appContainer).toBeTruthy();
    expect(gameComponent).toBeTruthy();
  });
});
