import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
}

export function useAuth(): AuthContextType {
  const queryClient = useQueryClient();

  // Simplified auth check - just check if user data exists in localStorage
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth_user'],
    queryFn: async () => {
      const userData = localStorage.getItem('auth_user');
      return userData ? JSON.parse(userData) : null;
    },
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      queryClient.setQueryData(['auth_user'], data.user);
    },
  });

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    queryClient.setQueryData(['auth_user'], null);
    queryClient.invalidateQueries();
  };

  return {
    user: user || null,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    canCreateUsers: user?.role === 'super_admin',
    isSuperAdmin: user?.role === 'super_admin',
  };
}
