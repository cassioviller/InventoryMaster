import { useState, useEffect } from 'react';
import type { User, LoginData } from '@shared/schema';

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  canCreateUsers: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isSuperAdmin: false,
    canCreateUsers: false,
  });

  // Verificar autenticação uma única vez no mount
  useEffect(() => {
    let mounted = true;
    
    async function checkAuth() {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            isSuperAdmin: false,
            canCreateUsers: false,
          });
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('token');
          if (mounted) {
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
              isSuperAdmin: false,
              canCreateUsers: false,
            });
          }
          return;
        }

        const data = await res.json();
        const user = data.user;
        
        if (mounted) {
          setAuthState({
            user,
            isLoading: false,
            isAuthenticated: true,
            isSuperAdmin: user.role === 'super_admin',
            canCreateUsers: user.role === 'super_admin',
          });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        if (mounted) {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            isSuperAdmin: false,
            canCreateUsers: false,
          });
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials: LoginData) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const data: AuthResponse = await res.json();
      localStorage.setItem('token', data.token);
      
      setAuthState({
        user: data.user,
        isLoading: false,
        isAuthenticated: true,
        isSuperAdmin: data.user.role === 'super_admin',
        canCreateUsers: data.user.role === 'super_admin',
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isSuperAdmin: false,
      canCreateUsers: false,
    });
  };

  return {
    ...authState,
    login,
    logout,
  };
}