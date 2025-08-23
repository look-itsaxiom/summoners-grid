/**
 * Main App Component for Summoner's Grid Game Client
 * 
 * This is the root React component that integrates the Phaser.js game
 * with React UI overlays using the hybrid architecture approach.
 * Now includes authentication flow and user management.
 */

import React from 'react';
import GameComponent from '../components/GameComponent';
import { ProtectedRoute, UserProfile } from '../components/auth';
import '../components/GameComponent.css';
import '../components/auth/auth.css';

export function App() {
  return (
    <div className="app-container">
      <ProtectedRoute>
        <div className="authenticated-app">
          {/* User Profile in top-right corner */}
          <div className="app-header">
            <div className="app-title">
              <h1>Summoner's Grid</h1>
            </div>
            <div className="user-section">
              <UserProfile className="app-user-profile" />
            </div>
          </div>
          
          {/* Main Game Component */}
          <div className="app-content">
            <GameComponent className="main-game" />
          </div>
        </div>
      </ProtectedRoute>
    </div>
  );
}

export default App;
