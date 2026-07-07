import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
  loading: boolean;
  login: (userId: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if token already exists in localStorage
    const savedToken = localStorage.getItem('preproute_token');
    const savedUser = localStorage.getItem('preproute_user');
    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          setUser({ name: 'Admin', role: 'admin' });
        }
      } else {
        setUser({ name: 'Admin', role: 'admin' });
      }
    }
    setLoading(false);
  }, []);

  const login = async (userId: string, password: string) => {
    setError(null);
    try {
      const response = await api.login(userId, password);
      if (response.success && response.data?.token) {
        const userObj = response.data.user || { name: 'Alex Wando', role: 'Admin' };
        
        // Store in state and localStorage
        setToken(response.data.token);
        setUser(userObj);
        localStorage.setItem('preproute_token', response.data.token);
        localStorage.setItem('preproute_user', JSON.stringify(userObj));
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to authenticate';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('preproute_token');
    localStorage.removeItem('preproute_user');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        user,
        loading,
        login,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
