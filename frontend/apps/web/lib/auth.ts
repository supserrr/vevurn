// Simple auth client without external dependencies for now
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const authClient = {
  baseURL: API_BASE,
  async getSession() {
    try {
      const response = await fetch(`${API_BASE}/api/auth/session`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        return { data: null };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      return { data: null };
    }
  }
};

// Create custom hooks for React usage
export function useSession() {
  // This would need to be implemented based on better-auth client API
  // For now, returning a basic structure
  return {
    data: null,
    loading: true,
    error: null
  }
}

export function useSignIn() {
  return {
    signIn: {
      email: async ({ email, password }: { email: string; password: string }) => {
        const response = await fetch(`${API_BASE}/api/auth/sign-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        
        if (!response.ok) {
          throw new Error('Login failed')
        }
        
        return await response.json()
      }
    }
  }
}

export function useSignOut() {
  return {
    signOut: async () => {
      const response = await fetch(`${API_BASE}/api/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Logout failed')
      }
    }
  }
}

export function useSignUp() {
  return {
    signUp: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      const response = await fetch(`${API_BASE}/api/auth/sign-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      })
      
      if (!response.ok) {
        throw new Error('Registration failed')
      }
      
      return await response.json()
    }
  }
}
