/**
 * Login Form Component
 * 
 * Provides user interface for logging into the game.
 * Features form validation, error handling, and responsive design.
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import type { LoginRequest } from '@summoners-grid/shared-types';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  className?: string;
}

interface FormData {
  username: string;
  password: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  className = '',
}) => {
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Validate form data
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      const request: LoginRequest = {
        username: formData.username.trim(),
        password: formData.password,
      };
      
      const result = await login(request);
      
      if (result.success) {
        onSuccess?.();
      } else {
        setFormErrors({ general: result.error || 'Login failed' });
      }
    } catch (error) {
      console.error('Login form error:', error);
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

  // Handle enter key in password field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  const displayError = formErrors.general || error;

  return (
    <div className={`login-form ${className}`}>
      <div className="form-header">
        <h2 className="form-title">Welcome Back, Summoner</h2>
        <p className="form-subtitle">Log in to your account to continue your journey</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Username Field */}
        <div className="form-field">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange('username')}
            className={`form-input ${formErrors.username ? 'error' : ''}`}
            placeholder="Enter your username"
            disabled={isLoading}
            autoComplete="username"
            required
          />
          {formErrors.username && (
            <span className="error-message">{formErrors.username}</span>
          )}
        </div>

        {/* Password Field */}
        <div className="form-field">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="password-field">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              onKeyPress={handleKeyPress}
              className={`form-input ${formErrors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
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
              Logging in...
            </>
          ) : (
            'Log In'
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="form-footer">
        <p className="form-footer-text">
          Don't have an account?{' '}
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToRegister}
            disabled={isLoading}
          >
            Create one here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;