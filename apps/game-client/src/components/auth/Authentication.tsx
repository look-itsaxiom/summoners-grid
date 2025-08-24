/**
 * Authentication Component
 * 
 * Main authentication interface that handles switching between login and registration.
 * Provides a unified authentication experience with proper state management.
 */

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthenticationProps {
  onAuthSuccess?: () => void;
  className?: string;
}

type AuthMode = 'login' | 'register';

export const Authentication: React.FC<AuthenticationProps> = ({
  onAuthSuccess,
  className = '',
}) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleAuthSuccess = () => {
    console.log('Authentication successful');
    onAuthSuccess?.();
  };

  const switchToLogin = () => {
    setAuthMode('login');
  };

  const switchToRegister = () => {
    setAuthMode('register');
  };

  return (
    <div className={`authentication-container ${className}`}>
      <div className="auth-background">
        <div className="auth-card">
          {authMode === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={switchToRegister}
              className="auth-form-container"
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={switchToLogin}
              className="auth-form-container"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Authentication;