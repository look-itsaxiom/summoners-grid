/**
 * React hook for Immutable Passport authentication state.
 */

import { useState, useEffect, useCallback } from 'react';
import { login as passportLogin, logout as passportLogout, checkExistingSession } from '../services/passport';

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  address: string | null;
  email: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    address: null,
    email: null,
  });

  // Check existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const session = await checkExistingSession();
        if (session) {
          setState({
            isLoggedIn: true,
            isLoading: false,
            address: session.address,
            email: session.email ?? null,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }

    checkSession();
  }, []);

  const login = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await passportLogin();
      if (result) {
        setState({
          isLoggedIn: true,
          isLoading: false,
          address: result.address,
          email: result.email ?? null,
        });
        return true;
      }
    } catch {
      // Login failed
    }
    setState(prev => ({ ...prev, isLoading: false }));
    return false;
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    await passportLogout();
    setState({
      isLoggedIn: false,
      isLoading: false,
      address: null,
      email: null,
    });
  }, []);

  return { ...state, login, logout };
}
