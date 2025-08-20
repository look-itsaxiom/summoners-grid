/**
 * Authentication middleware for JWT validation
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, JwtPayload } from '../services/AuthService.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  private static authService = new AuthService();

  /**
   * Middleware to require authentication
   */
  static requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = AuthMiddleware.extractToken(req);
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Authentication token is required'
          }
        });
        return;
      }

      const payload = await AuthMiddleware.authService.verifyAccessToken(token);
      
      if (!payload) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired authentication token'
          }
        });
        return;
      }

      // Attach user info to request
      req.user = payload;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Internal authentication error'
        }
      });
    }
  };

  /**
   * Middleware for optional authentication (user info if available)
   */
  static optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = AuthMiddleware.extractToken(req);
      
      if (token) {
        const payload = await AuthMiddleware.authService.verifyAccessToken(token);
        if (payload) {
          req.user = payload;
        }
      }

      next();
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue without authentication for optional auth
      next();
    }
  };

  /**
   * Extract JWT token from Authorization header or cookies
   */
  private static extractToken(req: Request): string | null {
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check cookies as fallback
    const cookieToken = req.cookies?.accessToken;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  /**
   * Middleware to check if user owns a resource
   */
  static requireOwnership = (userIdParam: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const resourceUserId = req.params[userIdParam];
        const currentUserId = req.user?.userId;

        if (!currentUserId) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication is required'
            }
          });
          return;
        }

        if (resourceUserId !== currentUserId) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied: You can only access your own resources'
            }
          });
          return;
        }

        next();
      } catch (error) {
        console.error('Ownership middleware error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'OWNERSHIP_CHECK_ERROR',
            message: 'Internal error checking resource ownership'
          }
        });
      }
    };
  };

  /**
   * Middleware to require admin privileges (for future use)
   */
  static requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    try {
      // For now, just pass through - will be implemented when admin system is added
      // In the future, check req.user.role === 'admin' or similar
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ADMIN_CHECK_ERROR',
          message: 'Internal error checking admin privileges'
        }
      });
    }
  };
}