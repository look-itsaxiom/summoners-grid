/**
 * Authentication Service - Handles API calls for authentication
 * 
 * This service provides methods to interact with the authentication API
 * endpoints implemented in the backend API server.
 */

import type { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse,
  RefreshTokenResponse,
  ApiResponse 
} from '@summoners-grid/shared-types';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  level: number;
  experience: number;
  rating: number;
  peakRating: number;
  totalGames: number;
  gamesWon: number;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  expiresAt?: Date;
  error?: string;
}

export class AuthService {
  private readonly baseUrl: string;

  constructor() {
    // Handle environment variables safely for Jest testing environment
    const getEnvVar = (key: string, defaultValue: string): string => {
      // In test environment, just return the default
      if (typeof jest !== 'undefined') {
        return defaultValue;
      }
      
      // Try to get from environment variables
      if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
        return (window as any).import.meta.env[key] || defaultValue;
      }
      
      // Fallback to default
      return defaultValue;
    };
    
    // Use environment variable or default to localhost
    this.baseUrl = getEnvVar('VITE_API_URL', 'http://localhost:3001');
  }

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for refresh token
        body: JSON.stringify(request),
      });

      const data: ApiResponse<AuthResponse> = await response.json();

      if (data.success && data.data) {
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          expiresAt: data.data.expiresAt,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error during registration',
      };
    }
  }

  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for refresh token
        body: JSON.stringify(request),
      });

      const data: ApiResponse<AuthResponse> = await response.json();

      if (data.success && data.data) {
        return {
          success: true,
          user: data.data.user,
          token: data.data.token,
          expiresAt: data.data.expiresAt,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Login failed',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error during login',
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.getStoredToken();
      
      const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
        credentials: 'include',
      });

      // Clear local storage regardless of response
      this.clearStoredAuth();

      const data: ApiResponse = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : data.error?.message || 'Logout failed',
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even on network error
      this.clearStoredAuth();
      return {
        success: true, // Consider local logout successful even if server call fails
      };
    }
  }

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.getStoredToken();
      
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseUrl}/api/auth/logout-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      // Clear local storage regardless of response
      this.clearStoredAuth();

      const data: ApiResponse = await response.json();
      return {
        success: data.success,
        error: data.success ? undefined : data.error?.message || 'Logout from all devices failed',
      };
    } catch (error) {
      console.error('Logout all error:', error);
      // Still clear local storage even on network error
      this.clearStoredAuth();
      return {
        success: true, // Consider local logout successful even if server call fails
      };
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ success: boolean; token?: string; expiresAt?: Date; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Refresh token is in HTTP-only cookie
      });

      const data: ApiResponse<RefreshTokenResponse> = await response.json();

      if (data.success && data.data) {
        // Store new access token
        if (data.data.token) {
          this.storeToken(data.data.token, data.data.expiresAt);
        }

        return {
          success: true,
          token: data.data.token,
          expiresAt: data.data.expiresAt,
        };
      } else {
        this.clearStoredAuth();
        return {
          success: false,
          error: data.error?.message || 'Token refresh failed',
        };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearStoredAuth();
      return {
        success: false,
        error: 'Network error during token refresh',
      };
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const token = this.getStoredToken();
      
      if (!token) {
        return { success: false, error: 'No authentication token found' };
      }

      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data: ApiResponse<{ user: User }> = await response.json();

      if (data.success && data.data) {
        return {
          success: true,
          user: data.data.user,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to get user info',
        };
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: 'Network error getting user info',
      };
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(token?: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const tokenToVerify = token || this.getStoredToken();
      
      if (!tokenToVerify) {
        return { success: false, error: 'No token to verify' };
      }

      const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data: ApiResponse<{ valid: boolean; user?: User }> = await response.json();

      if (data.success && data.data?.valid) {
        return {
          success: true,
          user: data.data.user,
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Token verification failed',
        };
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Network error during token verification',
      };
    }
  }

  /**
   * Store authentication token in localStorage
   */
  private storeToken(token: string, expiresAt?: Date): void {
    localStorage.setItem('auth_token', token);
    if (expiresAt) {
      localStorage.setItem('auth_expires_at', expiresAt.toString());
    }
  }

  /**
   * Get stored authentication token from localStorage
   */
  private getStoredToken(): string | null {
    const token = localStorage.getItem('auth_token');
    const expiresAt = localStorage.getItem('auth_expires_at');
    
    if (token && expiresAt) {
      const expiration = new Date(expiresAt);
      if (expiration <= new Date()) {
        // Token expired, clear it
        this.clearStoredAuth();
        return null;
      }
    }
    
    return token;
  }

  /**
   * Clear all stored authentication data
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires_at');
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    return this.getStoredToken() !== null;
  }

  /**
   * Get current stored token (for external use)
   */
  getToken(): string | null {
    return this.getStoredToken();
  }
}

// Export singleton instance
export const authService = new AuthService();