/**
 * Immutable Passport authentication service.
 *
 * Handles login/logout via Immutable Passport (Google, Apple, email).
 * Creates embedded wallets — no MetaMask or seed phrases needed.
 *
 * Configuration:
 * - Set VITE_PASSPORT_CLIENT_ID in .env
 * - Set VITE_PASSPORT_REDIRECT_URI in .env
 * - Register app at https://hub.immutable.com
 */

import { config, passport } from '@imtbl/sdk';

// Environment config
const CLIENT_ID = import.meta.env.VITE_PASSPORT_CLIENT_ID ?? '';
const REDIRECT_URI = import.meta.env.VITE_PASSPORT_REDIRECT_URI ?? 'http://localhost:5174/callback';
const LOGOUT_REDIRECT_URI = import.meta.env.VITE_PASSPORT_LOGOUT_URI ?? 'http://localhost:5174';
const ENVIRONMENT = (import.meta.env.VITE_IMMUTABLE_ENV ?? 'sandbox') === 'production'
  ? config.Environment.PRODUCTION
  : config.Environment.SANDBOX;

let passportInstance: passport.Passport | null = null;

/**
 * Get or create the Passport singleton.
 */
export function getPassport(): passport.Passport {
  if (!passportInstance) {
    if (!CLIENT_ID) {
      console.warn('Immutable Passport: No client ID configured. Set VITE_PASSPORT_CLIENT_ID.');
    }

    passportInstance = new passport.Passport({
      baseConfig: {
        environment: ENVIRONMENT,
        publishableKey: import.meta.env.VITE_IMMUTABLE_PUBLISHABLE_KEY ?? '',
      },
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      logoutRedirectUri: LOGOUT_REDIRECT_URI,
      audience: 'platform_api',
      scope: 'openid offline_access email transact',
    });
  }

  return passportInstance;
}

/**
 * Login via Passport (opens popup for Google/Apple/email).
 */
export async function login(): Promise<{ address: string; email?: string } | null> {
  try {
    const pp = getPassport();
    const provider = await pp.connectEvm();
    const accounts = await provider.request({ method: 'eth_requestAccounts' });

    if (accounts && accounts.length > 0) {
      const userInfo = await pp.getUserInfo();
      return {
        address: accounts[0] as string,
        email: userInfo?.email ?? undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Passport login failed:', error);
    return null;
  }
}

/**
 * Logout from Passport.
 */
export async function logout(): Promise<void> {
  try {
    const pp = getPassport();
    await pp.logout();
  } catch (error) {
    console.error('Passport logout failed:', error);
  }
}

/**
 * Check if user is already logged in (from previous session).
 */
export async function checkExistingSession(): Promise<{ address: string; email?: string } | null> {
  try {
    const pp = getPassport();
    const userInfo = await pp.getUserInfo();

    if (userInfo) {
      const provider = await pp.connectEvm();
      const accounts = await provider.request({ method: 'eth_requestAccounts' });

      if (accounts && accounts.length > 0) {
        return {
          address: accounts[0] as string,
          email: userInfo.email ?? undefined,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Handle the OAuth callback redirect.
 */
export async function handleCallback(): Promise<void> {
  try {
    const pp = getPassport();
    await pp.loginCallback();
  } catch (error) {
    console.error('Passport callback failed:', error);
  }
}
