/**
 * Authentication Service - Business logic for user authentication
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getPrisma } from '@summoners-grid/database';
import type { 
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse 
} from '@summoners-grid/shared-types';
import { config } from '../config/environment.js';

export interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private readonly prisma = getPrisma();

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    try {
      // Validate input
      const validation = this.validateRegistrationInput(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: request.username },
            { email: request.email }
          ]
        }
      });

      if (existingUser) {
        return {
          success: false,
          error: existingUser.username === request.username 
            ? 'Username already exists' 
            : 'Email already exists'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(request.password, config.bcryptRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          username: request.username,
          email: request.email,
          passwordHash,
          displayName: request.displayName || request.username,
          level: 1,
          experience: 0,
          rating: 1000,
          peakRating: 1000,
          totalGames: 0,
          gamesWon: 0,
          isEmailVerified: false,
        }
      });

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = await this.generateTokens(user);

      // Save refresh token
      await this.saveRefreshToken(user.id, refreshToken);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          level: user.level,
          experience: user.experience,
          rating: user.rating,
          peakRating: user.peakRating,
          totalGames: user.totalGames,
          gamesWon: user.gamesWon,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token: accessToken,
        refreshToken,
        expiresAt
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Internal server error during registration'
      };
    }
  }

  /**
   * Login user with username/password
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by username
      const user = await this.prisma.user.findUnique({
        where: { username: request.username }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Check if user is banned
      if (user.isBanned) {
        return {
          success: false,
          error: 'Account is banned'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(request.password, user.passwordHash);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = await this.generateTokens(user);

      // Save refresh token
      await this.saveRefreshToken(user.id, refreshToken);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          level: user.level,
          experience: user.experience,
          rating: user.rating,
          peakRating: user.peakRating,
          totalGames: user.totalGames,
          gamesWon: user.gamesWon,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token: accessToken,
        refreshToken,
        expiresAt
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Internal server error during login'
      };
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      // Verify refresh token
      const payload = jwt.verify(request.refreshToken, config.jwtRefreshSecret) as RefreshTokenPayload;

      // Find user and validate refresh token
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        include: { refreshTokens: true }
      });

      if (!user || user.isBanned) {
        return {
          success: false,
          error: 'Invalid or expired refresh token'
        };
      }

      // Check if refresh token exists in database
      const storedToken = user.refreshTokens.find((token: any) => 
        token.tokenHash === this.hashToken(request.refreshToken) && !token.isRevoked
      );

      if (!storedToken) {
        return {
          success: false,
          error: 'Invalid or expired refresh token'
        };
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken, expiresAt } = await this.generateTokens(user);

      // Revoke old refresh token and save new one
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true, revokedAt: new Date() }
      });

      await this.saveRefreshToken(user.id, newRefreshToken);

      return {
        success: true,
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          success: false,
          error: 'Invalid or expired refresh token'
        };
      }

      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Internal server error during token refresh'
      };
    }
  }

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
      
      // Verify user still exists and is not banned
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, isBanned: true }
      });

      if (!user || user.isBanned) {
        return null;
      }

      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshToken: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(refreshToken);
      
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() }
      });

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async logoutAllDevices(userId: string): Promise<boolean> {
    try {
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() }
      });

      return true;
    } catch (error) {
      console.error('Logout all devices error:', error);
      return false;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: any) {
    const jwtPayload: JwtPayload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    const refreshTokenPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenVersion: Date.now() // Simple versioning
    };

    const accessToken = jwt.sign(jwtPayload, config.jwtSecret, {
      expiresIn: config.jwtExpiration,
      algorithm: 'HS256'
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiration,
      algorithm: 'HS256'
    } as jwt.SignOptions);

    // Calculate expiration time
    const decoded = jwt.decode(accessToken) as any;
    const expiresAt = new Date(decoded.exp * 1000);

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * Save refresh token to database
   */
  private async saveRefreshToken(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const decoded = jwt.decode(refreshToken) as any;
    const expiresAt = new Date(decoded.exp * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        isRevoked: false
      }
    });
  }

  /**
   * Hash token for secure storage
   */
  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validate registration input
   */
  private validateRegistrationInput(request: RegisterRequest): { isValid: boolean; error?: string } {
    // Username validation
    if (!request.username || request.username.length < 3 || request.username.length > 50) {
      return { isValid: false, error: 'Username must be between 3 and 50 characters' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(request.username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    // Email validation
    if (!request.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
      return { isValid: false, error: 'Valid email address is required' };
    }

    if (request.email.length > 255) {
      return { isValid: false, error: 'Email address is too long' };
    }

    // Password validation
    if (!request.password || request.password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }

    if (request.password.length > 100) {
      return { isValid: false, error: 'Password is too long' };
    }

    // Check password strength (at least one letter and one number)
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(request.password)) {
      return { isValid: false, error: 'Password must contain at least one letter and one number' };
    }

    // Display name validation (optional)
    if (request.displayName && (request.displayName.length < 2 || request.displayName.length > 100)) {
      return { isValid: false, error: 'Display name must be between 2 and 100 characters' };
    }

    return { isValid: true };
  }
}