import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('shopkart_token'));
  const [loading, setLoading] = useState(true);

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
  }, [token]);

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

  const logout = () => {
    localStorage.removeItem('shopkart_token');
    setToken(null);
    setUser(null);
  };

  // Demo user quick login
  const loginDemo = async (roleName) => {
    if (roleName === 'ADMIN') {
      return login('admin@shopkart.com', 'admin123');
    } else if (roleName === 'SELLER') {
      return login('seller@shopkart.com', 'seller123');
    } else {
      return login('buyer@shopkart.com', 'buyer123');
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
