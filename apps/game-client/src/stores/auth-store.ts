/**
 * Authentication Store - Global state management for authentication
 * 
 * Uses Zustand for lightweight state management without the complexity of Redux.
 * Handles user authentication state, token management, and automatic refresh.
 */

import { create } from 'zustand';
import { authService, type User, type AuthResult } from '../services/auth-service';
import type { RegisterRequest, LoginRequest } from '@summoners-grid/shared-types';

export interface AuthState {
  // Current state
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Authentication actions
  login: (credentials: LoginRequest) => Promise<AuthResult>;
  register: (userData: RegisterRequest) => Promise<AuthResult>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  
  // Token management
  refreshToken: () => Promise<boolean>;
  verifyToken: () => Promise<boolean>;
  
  // State management
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  
  // Initialize authentication state
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login action
  login: async (credentials: LoginRequest): Promise<AuthResult> => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.user && result.token) {
        set({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: result.error || 'Login failed',
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during login';
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Register action
  register: async (userData: RegisterRequest): Promise<AuthResult> => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await authService.register(userData);
      
      if (result.success && result.user && result.token) {
        set({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: result.error || 'Registration failed',
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = 'An unexpected error occurred during registration';
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // Logout action
  logout: async (): Promise<void> => {
    set({ isLoading: true });
    
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Logout from all devices
  logoutAll: async (): Promise<void> => {
    set({ isLoading: true });
    
    try {
      await authService.logoutAll();
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      // Always clear local state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Refresh token
  refreshToken: async (): Promise<boolean> => {
    try {
      const result = await authService.refreshToken();
      
      if (result.success && result.token) {
        set({
          token: result.token,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        // Refresh failed, clear authentication state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: 'Session expired. Please log in again.',
        });
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: 'Session expired. Please log in again.',
      });
      return false;
    }
  },

  // Verify token
  verifyToken: async (): Promise<boolean> => {
    try {
      const result = await authService.verifyToken();
      
      if (result.success && result.user) {
        set({
          user: result.user,
          isAuthenticated: true,
          error: null,
        });
        return true;
      } else {
        // Token invalid, clear authentication state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null, // Don't show error for silent verification
        });
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null, // Don't show error for silent verification
      });
      return false;
    }
  },

  // Clear error state
  clearError: (): void => {
    set({ error: null });
  },

  // Set loading state
  setLoading: (loading: boolean): void => {
    set({ isLoading: loading });
  },

  // Initialize authentication state
  initialize: async (): Promise<void> => {
    set({ isLoading: true });
    
    try {
      // Check if we have a stored token
      if (authService.isAuthenticated()) {
        const token = authService.getToken();
        
        if (token) {
          // Verify the token and get user info
          const verification = await authService.verifyToken(token);
          
          if (verification.success && verification.user) {
            set({
              user: verification.user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Token invalid, try to refresh
            const refreshed = await get().refreshToken();
            
            if (!refreshed) {
              // Refresh failed, user needs to log in again
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            }
          }
        } else {
          // No token, not authenticated
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        // No stored authentication
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Authentication initialization error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null, // Don't show error for silent initialization
      });
    }
  },
}));

// Auto-refresh token before expiration
let refreshInterval: NodeJS.Timeout | null = null;

const startTokenRefreshInterval = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // Refresh token every 30 minutes
  refreshInterval = setInterval(async () => {
    const { isAuthenticated, refreshToken } = useAuthStore.getState();
    
    if (isAuthenticated) {
      const success = await refreshToken();
      if (!success) {
        console.warn('Automatic token refresh failed');
      }
    }
  }, 30 * 60 * 1000); // 30 minutes
};

const stopTokenRefreshInterval = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

// Subscribe to authentication changes to manage token refresh
useAuthStore.subscribe((state) => {
  if (state.isAuthenticated) {
    startTokenRefreshInterval();
  } else {
    stopTokenRefreshInterval();
  }
});

// Initialize auth state when the store is created
useAuthStore.getState().initialize();