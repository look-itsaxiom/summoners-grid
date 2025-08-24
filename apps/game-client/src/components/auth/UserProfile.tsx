/**
 * User Profile Component
 * 
 * Displays user information and provides logout functionality.
 * Shows user stats, level, rating, and account management options.
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';

interface UserProfileProps {
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  className = '',
}) => {
  const { user, logout, logoutAll, isLoading } = useAuthStore();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLogoutLoading(true);
    try {
      await logout();
    } finally {
      setIsLogoutLoading(false);
      setShowLogoutMenu(false);
    }
  };

  const handleLogoutAll = async () => {
    setIsLogoutLoading(true);
    try {
      await logoutAll();
    } finally {
      setIsLogoutLoading(false);
      setShowLogoutMenu(false);
    }
  };

  const formatDate = (date: Date | string): string => {
    if (!date) return 'Never';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatWinRate = (won: number, total: number): string => {
    if (total === 0) return '0%';
    return `${Math.round((won / total) * 100)}%`;
  };

  return (
    <div className={`user-profile ${className}`}>
      <div className="profile-header">
        <div className="user-avatar">
          <div className="avatar-placeholder">
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="user-info">
          <h3 className="user-display-name">
            {user.displayName || user.username}
          </h3>
          {user.displayName && (
            <p className="user-username">@{user.username}</p>
          )}
          <p className="user-email">{user.email}</p>
        </div>

        <div className="profile-actions">
          <div className="logout-menu-container">
            <button
              className="menu-button"
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              disabled={isLoading || isLogoutLoading}
              aria-label="User menu"
            >
              ⚙️
            </button>
            
            {showLogoutMenu && (
              <div className="logout-menu">
                <button
                  className="menu-item logout-item"
                  onClick={handleLogout}
                  disabled={isLogoutLoading}
                >
                  {isLogoutLoading ? '⏳ Logging out...' : '🚪 Logout'}
                </button>
                <button
                  className="menu-item logout-all-item"
                  onClick={handleLogoutAll}
                  disabled={isLogoutLoading}
                >
                  {isLogoutLoading ? '⏳ Logging out...' : '🚪🌐 Logout All Devices'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Level</span>
            <span className="stat-value">{user.level}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Experience</span>
            <span className="stat-value">{user.experience.toLocaleString()}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Rating</span>
            <span className="stat-value">{user.rating}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Peak Rating</span>
            <span className="stat-value">{user.peakRating}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Games Played</span>
            <span className="stat-value">{user.totalGames}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">
              {formatWinRate(user.gamesWon, user.totalGames)}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-details">
        <div className="detail-item">
          <span className="detail-label">Member since:</span>
          <span className="detail-value">{formatDate(user.createdAt)}</span>
        </div>
        
        {user.lastLogin && (
          <div className="detail-item">
            <span className="detail-label">Last login:</span>
            <span className="detail-value">{formatDate(user.lastLogin)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;