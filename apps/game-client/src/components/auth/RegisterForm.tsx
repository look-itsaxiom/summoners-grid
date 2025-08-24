/**
 * Registration Form Component
 * 
 * Provides user interface for creating a new account.
 * Features comprehensive form validation, password confirmation, and error handling.
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import type { RegisterRequest } from '@summoners-grid/shared-types';
import {
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_REGEX,
  EMAIL_REGEX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_COMPLEXITY_MESSAGE,
  DISPLAY_NAME_MAX_LENGTH
} from '../../constants/validation';

/**
 * Validate password complexity requirements
 */
const validatePasswordComplexity = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  general?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className = '',
}) => {
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < USERNAME_MIN_LENGTH) {
      errors.username = `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
    } else if (formData.username.length > USERNAME_MAX_LENGTH) {
      errors.username = `Username must be no more than ${USERNAME_MAX_LENGTH} characters`;
    } else if (!USERNAME_REGEX.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    } else if (formData.password.length > PASSWORD_MAX_LENGTH) {
      errors.password = `Password must be no more than ${PASSWORD_MAX_LENGTH} characters`;
    } else if (!validatePasswordComplexity(formData.password)) {
      errors.password = `Password must contain ${PASSWORD_COMPLEXITY_MESSAGE}`;
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Display name validation (optional but if provided, validate it)
    if (formData.displayName.trim()) {
      if (formData.displayName.length > DISPLAY_NAME_MAX_LENGTH) {
        errors.displayName = `Display name must be no more than ${DISPLAY_NAME_MAX_LENGTH} characters`;
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    setFormErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      const request: RegisterRequest = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        displayName: formData.displayName.trim() || undefined,
      };
      
      const result = await register(request);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setFormErrors({ general: result.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration form error:', error);
      setFormErrors({ general: 'An unexpected error occurred' });
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const displayError = formErrors.general || error;

  return (
    <div className={`register-form ${className}`}>
      <div className="form-header">
        <h2 className="form-title">Join the Grid, Summoner</h2>
        <p className="form-subtitle">Create your account to begin your tactical journey</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Username Field */}
        <div className="form-field">
          <label htmlFor="username" className="form-label">
            Username *
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange('username')}
            className={`form-input ${formErrors.username ? 'error' : ''}`}
            placeholder="Choose a username"
            disabled={isLoading}
            autoComplete="username"
            required
          />
          {formErrors.username && (
            <span className="error-message">{formErrors.username}</span>
          )}
          <small className="field-hint">{USERNAME_MIN_LENGTH}-{USERNAME_MAX_LENGTH} characters, letters, numbers, and underscores only</small>
        </div>

        {/* Email Field */}
        <div className="form-field">
          <label htmlFor="email" className="form-label">
            Email Address *
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className={`form-input ${formErrors.email ? 'error' : ''}`}
            placeholder="Enter your email"
            disabled={isLoading}
            autoComplete="email"
            required
          />
          {formErrors.email && (
            <span className="error-message">{formErrors.email}</span>
          )}
        </div>

        {/* Display Name Field */}
        <div className="form-field">
          <label htmlFor="displayName" className="form-label">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={formData.displayName}
            onChange={handleInputChange('displayName')}
            className={`form-input ${formErrors.displayName ? 'error' : ''}`}
            placeholder="How others will see you (optional)"
            disabled={isLoading}
            autoComplete="name"
          />
          {formErrors.displayName && (
            <span className="error-message">{formErrors.displayName}</span>
          )}
          <small className="field-hint">Optional - defaults to username if not provided</small>
        </div>

        {/* Password Field */}
        <div className="form-field">
          <label htmlFor="password" className="form-label">
            Password *
          </label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              className={`form-input ${formErrors.password ? 'error' : ''}`}
              placeholder="Create a strong password"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formErrors.password && (
            <span className="error-message">{formErrors.password}</span>
          )}
          <small className="field-hint">{PASSWORD_MIN_LENGTH}+ characters with {PASSWORD_COMPLEXITY_MESSAGE}</small>
        </div>

        {/* Confirm Password Field */}
        <div className="form-field">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password *
          </label>
          <div className="password-field">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              className={`form-input ${formErrors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <span className="error-message">{formErrors.confirmPassword}</span>
          )}
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{displayError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="submit-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner">⏳</span>
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="form-footer">
        <p className="form-footer-text">
          Already have an account?{' '}
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToLogin}
            disabled={isLoading}
          >
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;