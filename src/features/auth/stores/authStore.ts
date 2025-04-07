import { apiClient, clearAuthToken, setAuthToken } from '@/lib/api/client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/features/users/schemas/userSchema';
import { jwtDecode } from 'jwt-decode';

// Define the credentials type
interface Credentials {
  email: string;
  password: string;
}

interface AuthState {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.auth.login(credentials);

          if (response.error) {
            throw new Error(response.error);
          }

          if (!response.data) {
            throw new Error('Login failed: No data received');
          }

          // Gán token vào header
          setAuthToken(response.data.token);

          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.auth.register(userData);

          if (response.error) {
            throw new Error(response.error);
          }

          if (!response.data) {
            throw new Error('Registration failed: No data received');
          }

          // Đăng ký thành công, chờ đăng nhập
          return;
        } catch (error) {
          console.error('Registration error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        clearAuthToken();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: () => {
        const { token, isAuthenticated } = get();

        if (!token || !isAuthenticated) return false;

        try {
          const decoded: any = jwtDecode(token);
          const exp = decoded.exp * 1000;
          return Date.now() < exp;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Khi store được khôi phục, tự động set lại token vào header
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    },
  ),
);

// Helper hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
