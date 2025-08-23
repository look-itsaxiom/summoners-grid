/**
 * Authentication Components Index
 * 
 * Central export point for all authentication-related components.
 */

export { default as Authentication } from './Authentication';
export { default as LoginForm } from './LoginForm';
export { default as RegisterForm } from './RegisterForm';
export { default as UserProfile } from './UserProfile';
export { default as ProtectedRoute } from './ProtectedRoute';

// Re-export types and services for convenience
export { authService } from '../../services/auth-service';
export { useAuthStore } from '../../stores/auth-store';
export type { User, AuthResult } from '../../services/auth-service';
export type { AuthState } from '../../stores/auth-store';