import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  phone_or_email: string;

  // OLD ❌
  role: string;

  // NEW ✅
  roles: string[];
  activeRole: string;

  created_at: string;
  is_primary_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: any) => {
  try {
    // Convert old role → new structure
    const formattedUser = {
      ...newUser,
      roles: newUser.roles || [newUser.role], // fallback
      activeRole: newUser.activeRole || newUser.role
    };

    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('auth_user', JSON.stringify(formattedUser));

    setToken(newToken);
    setUser(formattedUser);

    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  } catch (error) {
    console.error('Error saving auth:', error);
    throw error;
  }
};

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error clearing auth:', error);
    }
  };

  const updateUser = async (newUser: User) => {
    try {
      await AsyncStorage.setItem('auth_user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const isAdmin = user?.activeRole === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
