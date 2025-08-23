/**
 * Protected Route Component
 * 
 * Wrapper component that ensures authentication before rendering children.
 * Automatically redirects to authentication if user is not logged in.
 */

import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import Authentication from './Authentication';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  className = '',
}) => {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  // Initialize authentication state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className={`protected-route-loading ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner">⏳</div>
          <h3>Checking authentication...</h3>
          <p>Please wait while we verify your session</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`protected-route-auth ${className}`}>
        {fallback || (
          <Authentication 
            className="protected-route-authentication"
          />
        )}
      </div>
    );
  }

  // User is authenticated, render children
  return (
    <div className={`protected-route-content ${className}`}>
      {children}
    </div>
  );
};

export default ProtectedRoute;