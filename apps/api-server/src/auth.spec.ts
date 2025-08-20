/**
 * Authentication system tests
 */

import { AuthService } from '../src/services/AuthService.js';
import { AuthController } from '../src/controllers/AuthController.js';
import { AuthMiddleware } from '../src/middleware/auth.js';
import type { RegisterRequest, LoginRequest } from '@summoners-grid/shared-types';

// Mock the database service with a factory function
jest.mock('@summoners-grid/database', () => ({
  getPrisma: jest.fn()
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
  compare: jest.fn()
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn()
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockBcrypt: any;
  let mockJwt: any;

  beforeEach(() => {
    // Create fresh mock prisma instance
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };

    // Set up the mock to return our prisma instance
    const { getPrisma } = require('@summoners-grid/database');
    (getPrisma as jest.Mock).mockReturnValue(mockPrisma);
    
    // Clear all mocks first
    jest.clearAllMocks();
    
    authService = new AuthService();
    mockBcrypt = require('bcrypt');
    mockJwt = require('jsonwebtoken');

    // Setup default jwt mocks
    mockJwt.sign.mockReturnValue('mock-jwt-token');
    mockJwt.decode.mockReturnValue({ 
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com'
    });
    mockJwt.verify.mockReturnValue({
      userId: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    });
  });

  describe('User Registration', () => {
    const validRegisterRequest: RegisterRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    };

    it('should register a new user successfully', async () => {
      // Mock: no existing user
      mockPrisma.user.findFirst.mockResolvedValue(null);
      
      // Mock: user creation
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        level: 1,
        experience: 0,
        rating: 1000,
        peakRating: 1000,
        totalGames: 0,
        gamesWon: 0,
        createdAt: new Date(),
        lastLogin: null
      };
      
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.register(validRegisterRequest);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: 'testuser',
          email: 'test@example.com',
          displayName: 'Test User'
        })
      });
    });

    it('should reject registration with existing username', async () => {
      // Mock: existing user with same username
      mockPrisma.user.findFirst.mockResolvedValue({
        username: 'testuser',
        email: 'other@example.com'
      });

      const result = await authService.register(validRegisterRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username already exists');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should reject registration with existing email', async () => {
      // Mock: existing user with same email
      mockPrisma.user.findFirst.mockResolvedValue({
        username: 'otheruser',
        email: 'test@example.com'
      });

      const result = await authService.register(validRegisterRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should validate registration input', async () => {
      const invalidRequests = [
        { ...validRegisterRequest, username: 'ab' }, // Too short
        { ...validRegisterRequest, username: 'invalid@username' }, // Invalid characters
        { ...validRegisterRequest, email: 'invalid-email' }, // Invalid email
        { ...validRegisterRequest, password: 'short' }, // Too short
        { ...validRegisterRequest, password: '12345678' }, // No letters
        { ...validRegisterRequest, password: 'abcdefgh' }, // No numbers
      ];

      for (const request of invalidRequests) {
        const result = await authService.register(request);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('User Login', () => {
    const validLoginRequest: LoginRequest = {
      username: 'testuser',
      password: 'password123'
    };

    it('should login user successfully', async () => {
      // Mock: user exists and password is correct
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashedpassword',
        displayName: 'Test User',
        level: 1,
        experience: 0,
        rating: 1000,
        peakRating: 1000,
        totalGames: 0,
        gamesWon: 0,
        isBanned: false,
        createdAt: new Date(),
        lastLogin: null
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockBcrypt.compare.mockResolvedValue(true);

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastLogin: expect.any(Date) }
      });
    });

    it('should reject login with invalid username', async () => {
      // Mock: user not found
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password');
    });

    it('should reject login with incorrect password', async () => {
      // Mock: user exists but password is wrong
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: '$2b$12$hashedpassword',
        isBanned: false
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false);

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password');
    });

    it('should reject login for banned user', async () => {
      // Mock: banned user
      const mockUser = {
        id: 'user-123',
        username: 'testuser',
        passwordHash: '$2b$12$hashedpassword',
        isBanned: true
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.login(validLoginRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Account is banned');
    });
  });

  describe('Token Management', () => {
    it('should verify valid access token', async () => {
      // Mock: user exists and is not banned
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        isBanned: false
      });

      // The JWT verification should return the expected payload
      mockJwt.verify.mockReturnValue({
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com'
      });

      const result = await authService.verifyAccessToken('valid-token');
      expect(result).toEqual({
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    it('should return null for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyAccessToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should logout user by revoking refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await authService.logout('refresh-token');
      expect(result).toBe(true);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          tokenHash: expect.any(String),
          isRevoked: false
        },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date)
        }
      });
    });

    it('should logout from all devices', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await authService.logoutAllDevices('user-123');
      expect(result).toBe(true);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRevoked: false },
        data: {
          isRevoked: true,
          revokedAt: expect.any(Date)
        }
      });
    });
  });
});

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {
      body: {},
      cookies: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('Register endpoint', () => {
    it('should handle successful registration', async () => {
      mockRequest.body = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      // Mock successful registration
      const mockAuthService = authController['authService'];
      jest.spyOn(mockAuthService, 'register').mockResolvedValue({
        success: true,
        user: { id: 'user-123', username: 'testuser' } as any,
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date()
      });

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.any(Object)
      );
    });

    it('should handle registration validation errors', async () => {
      mockRequest.body = {
        username: '', // Missing username
        email: 'test@example.com',
        password: 'password123'
      };

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_REQUIRED_FIELDS'
          })
        })
      );
    });
  });

  describe('Login endpoint', () => {
    it('should handle successful login', async () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123'
      };

      // Mock successful login
      const mockAuthService = authController['authService'];
      jest.spyOn(mockAuthService, 'login').mockResolvedValue({
        success: true,
        user: { id: 'user-123', username: 'testuser' } as any,
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date()
      });

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should handle login validation errors', async () => {
      mockRequest.body = {
        username: 'testuser',
        // Missing password
      };

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_CREDENTIALS'
          })
        })
      );
    });
  });
});

describe('AuthMiddleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
      user: undefined,
      params: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireAuth middleware', () => {
    it('should pass authentication with valid token', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';

      // Mock token verification
      const mockAuthService = AuthMiddleware['authService'];
      jest.spyOn(mockAuthService, 'verifyAccessToken').mockResolvedValue({
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com'
      });

      await AuthMiddleware.requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await AuthMiddleware.requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'MISSING_TOKEN'
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      mockRequest.headers.authorization = 'Bearer invalid-token';

      // Mock token verification failure
      const mockAuthService = AuthMiddleware['authService'];
      jest.spyOn(mockAuthService, 'verifyAccessToken').mockResolvedValue(null);

      await AuthMiddleware.requireAuth(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_TOKEN'
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should continue without authentication when no token provided', async () => {
      await AuthMiddleware.optionalAuth(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should set user when valid token provided', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';

      // Mock token verification
      const mockAuthService = AuthMiddleware['authService'];
      jest.spyOn(mockAuthService, 'verifyAccessToken').mockResolvedValue({
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com'
      });

      await AuthMiddleware.optionalAuth(mockRequest, mockResponse, mockNext);

      expect(mockRequest.user).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('requireOwnership middleware', () => {
    it('should allow access to own resources', () => {
      mockRequest.user = { userId: 'user-123', username: 'testuser', email: 'test@example.com' };
      mockRequest.params = { userId: 'user-123' };

      const middleware = AuthMiddleware.requireOwnership('userId');
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access to other users resources', () => {
      mockRequest.user = { userId: 'user-123', username: 'testuser', email: 'test@example.com' };
      mockRequest.params = { userId: 'user-456' };

      const middleware = AuthMiddleware.requireOwnership('userId');
      middleware(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'FORBIDDEN'
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});