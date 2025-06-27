import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, LoginData } from '@shared/schema';

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  canCreateUsers: boolean;
  isSuperAdmin: boolean;
}

export function useAuth(): AuthContextType {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/verify'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      try {
        const res = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('token');
          return null;
        }

        const data = await res.json();
        return data.user;
      } catch {
        localStorage.removeItem('token');
        return null;
      }
    },
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<AuthResponse> => {
      const res = await apiRequest('/api/auth/login', 'POST', credentials);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['/api/auth/verify'], data.user);
    },
  });

  const login = async (credentials: LoginData) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['/api/auth/verify'], null);
    queryClient.clear();
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
