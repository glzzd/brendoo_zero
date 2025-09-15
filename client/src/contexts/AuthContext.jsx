import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_ENDPOINTS } from '../const/endpoints';
import apiClient from '../utils/apiClient';
import { isTokenExpired, clearAuthData, setAuthData, getUserData } from '../utils/tokenUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const storedUser = getUserData();

      if (storedToken && storedRefreshToken && storedUser) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          // Try to refresh token automatically
          try {
            const newToken = await apiClient.refreshToken();
            setToken(newToken);
            const newRefreshToken = localStorage.getItem('refreshToken');
            setRefreshToken(newRefreshToken);
            setUser(storedUser);
          } catch (error) {
            clearAuthData();
          }
        } else {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setUser(storedUser);
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post(AUTH_ENDPOINTS.LOGIN, { username, password });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens and user data
      const userData = { username };
      setAuthData(data.token, data.refreshToken, userData);

      setToken(data.token);
      setRefreshToken(data.refreshToken);
      setUser(userData);

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    clearAuthData();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const refreshAccessToken = async () => {
    try {
      const newToken = await apiClient.refreshToken();
      setToken(newToken);
      const newRefreshToken = localStorage.getItem('refreshToken');
      setRefreshToken(newRefreshToken);
      return newToken;
    } catch (error) {
      logout(); // If refresh fails, logout user
      throw error;
    }
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    refreshToken,
    loading,
    login,
    logout,
    refreshAccessToken,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};