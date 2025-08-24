/**
 * Validation Constants - Shared validation rules and constants
 * 
 * These constants ensure consistency between frontend validation and backend requirements.
 * Values are derived from the shared-types validation schemas.
 */

// Username validation constants
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30; // From shared-types RegisterRequestSchema
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Email validation constants  
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password validation constants
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128; // From shared-types RegisterRequestSchema

// Password complexity requirements (based on backend validation)
export const PASSWORD_REGEX = /(?=.*[a-zA-Z])(?=.*\d)/; // At least one letter and one number
export const PASSWORD_COMPLEXITY_MESSAGE = 'at least one letter and one number';

// Display name validation constants
export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 50; // From shared-types RegisterRequestSchema

// Token refresh interval (30 minutes in milliseconds)
export const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000;