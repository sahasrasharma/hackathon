import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const userType = sessionStorage.getItem('userType');
    const username = sessionStorage.getItem('username');
    const userId = sessionStorage.getItem('userId');
    const userEmail = sessionStorage.getItem('userEmail');

    if (userType && username) {
      setUser({
        userType,
        username,
        userId: userId || username,
        userEmail: userEmail || ''
      });
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData) => {
    sessionStorage.setItem('userType', userData.userType);
    sessionStorage.setItem('username', userData.username);
    if (userData.userId) sessionStorage.setItem('userId', userData.userId);
    if (userData.userEmail) sessionStorage.setItem('userEmail', userData.userEmail);
    
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
