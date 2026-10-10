import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shopkart_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('shopkart_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token, logout]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('shopkart_token', res.token);
    setToken(res.token);
    setUser({
      id: res.id,
      name: res.name,
      email: res.email,
      role: res.role,
      storeName: res.storeName,
    });
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('shopkart_token', res.token);
    setToken(res.token);
    setUser({
      id: res.id,
      name: res.name,
      email: res.email,
      role: res.role,
      storeName: res.storeName,
    });
    return res;
  };

  // Demo user quick login
  const loginDemo = async (roleName) => {
    try {
      if (roleName === 'ADMIN') {
        return await login('admin@shopkart.com', 'admin123');
      } else if (roleName === 'SELLER') {
        return await login('seller@shopkart.com', 'seller123');
      } else {
        return await login('buyer@shopkart.com', 'buyer123');
      }
    } catch {
      const demoUser =
        roleName === 'ADMIN'
          ? { id: 1, name: 'Admin User', email: 'admin@shopkart.com', role: 'ADMIN' }
          : roleName === 'SELLER'
          ? { id: 2, name: 'TechWorld Official', email: 'seller@shopkart.com', role: 'SELLER', storeName: 'TechWorld Official' }
          : { id: 3, name: 'Rahul Sharma', email: 'buyer@shopkart.com', role: 'BUYER' };
      setUser(demoUser);
      return demoUser;
    }
  };

  const value = {
    user,
    token,
    role: user?.role,
    isAuthenticated: !!user,
    isBuyer: user?.role === 'BUYER',
    isSeller: user?.role === 'SELLER',
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    logout,
    loginDemo,
    loading,
    refreshUser: async () => {
      if (token) {
        const profile = await api.getMe();
        setUser(profile);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
