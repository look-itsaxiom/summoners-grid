/**
 * Authentication routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AuthMiddleware } from '../middleware/auth.js';
import { authRateLimit, passwordResetRateLimit } from '../middleware/security.js';

const router = Router();
const authController = new AuthController();

/**
 * Authentication routes
 */

// Public routes (no authentication required)
router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/verify', authController.verifyToken);

// Protected routes (authentication required)
router.post('/logout', AuthMiddleware.requireAuth, authController.logout);
router.post('/logout-all', AuthMiddleware.requireAuth, authController.logoutAll);
router.get('/me', AuthMiddleware.requireAuth, authController.me);

// Future password reset routes (placeholder)
router.post('/forgot-password', passwordResetRateLimit, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Password reset functionality not yet implemented'
    }
  });
});

router.post('/reset-password', passwordResetRateLimit, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Password reset functionality not yet implemented'
    }
  });
});

export default router;