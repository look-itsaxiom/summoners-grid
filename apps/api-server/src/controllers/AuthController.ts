/**
 * Authentication Controller - Handles HTTP requests for authentication endpoints
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { config } from '../config/environment.js';
import type { 
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  ApiResponse,
  AuthResponse,
  RefreshTokenResponse 
} from '@summoners-grid/shared-types';

export class AuthController {
  private authService = new AuthService();

  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: RegisterRequest = req.body;

      // Basic request validation
      if (!request.username || !request.email || !request.password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Username, email, and password are required'
          }
        } as ApiResponse);
        return;
      }

      const result = await this.authService.register(request);

      if (result.success) {
        // Set refresh token as HTTP-only cookie for security
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: config.isProduction,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
            expiresAt: result.expiresAt
          }
        } as ApiResponse<AuthResponse>);
      } else {
        const statusCode = result.error?.includes('already exists') ? 409 : 400;
        res.status(statusCode).json({
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: result.error || 'Registration failed'
          }
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Registration controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error during registration'
        }
      } as ApiResponse);
    }
  };

  /**
   * Login user
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const request: LoginRequest = req.body;

      // Basic request validation
      if (!request.username || !request.password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Username and password are required'
          }
        } as ApiResponse);
        return;
      }

      const result = await this.authService.login(request);

      if (result.success) {
        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: config.isProduction,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
            expiresAt: result.expiresAt
          }
        } as ApiResponse<AuthResponse>);
      } else {
        const statusCode = result.error?.includes('banned') ? 403 : 401;
        res.status(statusCode).json({
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: result.error || 'Login failed'
          }
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error during login'
        }
      } as ApiResponse);
    }
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Try to get refresh token from cookie first, then body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        } as ApiResponse);
        return;
      }

      const request: RefreshTokenRequest = { refreshToken };
      const result = await this.authService.refreshToken(request);

      if (result.success) {
        // Set new refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: config.isProduction,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
          success: true,
          data: {
            token: result.token,
            expiresAt: result.expiresAt
          }
        } as ApiResponse<RefreshTokenResponse>);
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_REFRESH_FAILED',
            message: result.error || 'Token refresh failed'
          }
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Token refresh controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error during token refresh'
        }
      } as ApiResponse);
    }
  };

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' }
      } as ApiResponse);
    } catch (error) {
      console.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error during logout'
        }
      } as ApiResponse);
    }
  };

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required'
          }
        } as ApiResponse);
        return;
      }

      await this.authService.logoutAllDevices(userId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        data: { message: 'Logged out from all devices successfully' }
      } as ApiResponse);
    } catch (error) {
      console.error('Logout all controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error during logout from all devices'
        }
      } as ApiResponse);
    }
  };

  /**
   * Get current user info
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required'
          }
        } as ApiResponse);
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      } as ApiResponse);
    } catch (error) {
      console.error('Get user info controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error getting user info'
        }
      } as ApiResponse);
    }
  };

  /**
   * Verify token endpoint (for client-side token validation)
   * POST /api/auth/verify
   */
  verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Token is required'
          }
        } as ApiResponse);
        return;
      }

      const payload = await this.authService.verifyAccessToken(token);

      if (payload) {
        res.status(200).json({
          success: true,
          data: {
            valid: true,
            user: payload
          }
        } as ApiResponse);
      } else {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Token is invalid or expired'
          }
        } as ApiResponse);
      }
    } catch (error) {
      console.error('Token verification controller error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error during token verification'
        }
      } as ApiResponse);
    }
  };
}