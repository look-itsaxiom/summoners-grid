/**
 * Main App Component for Summoner's Grid Game Client
 * 
 * This is the root React component that integrates the Phaser.js game
 * with React UI overlays using the hybrid architecture approach.
 */

import React from 'react';
import GameComponent from '../components/GameComponent';
import '../components/GameComponent.css';

export function App() {
  return (
    <div className="app-container">
      <GameComponent className="main-game" />
    </div>
  );
}

export default App;
