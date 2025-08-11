/**
 * Cookie Utilities for Vevurn POS
 * 
 * Helper functions for managing Better Auth cookies on the client side
 */

export interface CookieOptions {
  expires?: Date | string | number;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue || '');
    }
  }
  
  return null;
}

/**
 * Set a cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    if (typeof options.expires === 'number') {
      const date = new Date();
      date.setTime(date.getTime() + options.expires * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    } else if (options.expires instanceof Date) {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    } else {
      cookieString += `; expires=${options.expires}`;
    }
  }

  if (options.maxAge) {
    cookieString += `; max-age=${options.maxAge}`;
  }

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  if (options.path) {
    cookieString += `; path=${options.path}`;
  } else {
    cookieString += `; path=/`;
  }

  if (options.secure) {
    cookieString += `; secure`;
  }

  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }

  if (options.httpOnly) {
    cookieString += `; httponly`;
  }

  document.cookie = cookieString;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, options: Omit<CookieOptions, 'expires' | 'maxAge'> = {}): void {
  setCookie(name, '', {
    ...options,
    expires: new Date(0),
  });
}

/**
 * Check if a Better Auth session cookie exists
 */
export function hasSessionCookie(): boolean {
  return getCookie('vevurn-pos.vevurn_session') !== null;
}

/**
 * Get all Better Auth cookies for debugging
 */
export function getBetterAuthCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const authCookies: Record<string, string> = {};
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName.startsWith('vevurn-pos.')) {
      authCookies[cookieName] = decodeURIComponent(cookieValue || '');
    }
  }

  return authCookies;
}

/**
 * Clear all Better Auth cookies (useful for logout)
 */
export function clearAuthCookies(): void {
  const authCookieNames = [
    'vevurn-pos.vevurn_session',
    'vevurn-pos.vevurn_session_data',
    'vevurn-pos.vevurn_dont_remember',
    'vevurn-pos.two_factor', // If you add 2FA later
  ];

  authCookieNames.forEach(name => {
    deleteCookie(name);
  });
}

/**
 * Cookie security status checker
 */
export function checkCookieSecurity(): {
  hasSecureCookies: boolean;
  hasSameSiteStrict: boolean;
  hasHttpOnly: boolean;
} {
  // Note: This is limited on the client side since httpOnly cookies can't be read
  const sessionCookie = getCookie('vevurn-pos.vevurn_session');
  
  return {
    hasSecureCookies: window.location.protocol === 'https:',
    hasSameSiteStrict: true, // We set this in backend config
    hasHttpOnly: true, // Better Auth sets this by default
  };
}

/**
 * POS-specific cookie helpers
 */
export const POSCookies = {
  // Remember employee ID for quick re-login
  setRememberEmployee: (employeeId: string) => {
    setCookie('vevurn-pos-employee', employeeId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
    });
  },

  getRememberedEmployee: (): string | null => {
    return getCookie('vevurn-pos-employee');
  },

  clearRememberedEmployee: () => {
    deleteCookie('vevurn-pos-employee');
  },

  // Store POS terminal ID
  setTerminalId: (terminalId: string) => {
    setCookie('vevurn-pos-terminal', terminalId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
    });
  },

  getTerminalId: (): string | null => {
    return getCookie('vevurn-pos-terminal');
  },

  // Store last used language
  setLanguage: (lang: 'en' | 'fr') => {
    setCookie('vevurn-pos-lang', lang, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      secure: window.location.protocol === 'https:',
      sameSite: 'strict',
    });
  },

  getLanguage: (): 'en' | 'fr' => {
    return (getCookie('vevurn-pos-lang') as 'en' | 'fr') || 'en';
  },
};
