import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authAPI } from '../services/api';
import toast from 'react-hot-toast';


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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role = 'supervisor') => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password }, role);
      console.log("response ==> ", response);
      
      // Handle the response structure from your backend
      const { token, message, admin, employee, ...otherData } = response.data;
      
      // Extract user data from the appropriate property based on role
      let userData;
      if (role === 'admin' && admin) {
        userData = admin;
      } else if (role === 'employee' && employee) {
        userData = employee;
      } else {
        userData = otherData;
      }
      
      // Normalize roles from backend to frontend format
      let mappedUserData;
      if (role === 'admin') {
        // Admin logins provide role as 'superadmin' or 'readonly'
        const adminType = userData.role === 'superadmin' ? 'super' : userData.role === 'readonly' ? 'readonly' : null;
        mappedUserData = {
          ...userData,
          role: 'admin',
          adminType,
        };
      } else if (role === 'employee') {
        // Employee logins
        mappedUserData = {
          ...userData,
          role: 'employee',
          adminType: null,
        };
      } else {
        // Supervisor/manager logins may provide userType
        const normalizedRole = userData.userType === 'manager' ? 'manager' : 'supervisor';
        mappedUserData = {
          ...userData,
          role: normalizedRole,
          adminType: null,
        };
      }
      
      // console.log('🔍 DEBUG - Original userData:', userData);
      // console.log('🔍 DEBUG - Mapped userData:', mappedUserData);
      // console.log('🔍 DEBUG - Login role:', role);
      // console.log('🔍 DEBUG - Final user role:', mappedUserData.role);
      
      // Store token and user data
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(mappedUserData));
      
      // Set API default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(mappedUserData);
      setIsAuthenticated(true);
      
      toast.success(`Welcome back, ${mappedUserData.name}!`);
      
      // Redirect based on the actual user role
      let redirectPath;
      if (mappedUserData.role === 'admin') {
        redirectPath = '/admin/dashboard';
      } else if (mappedUserData.role === 'employee') {
        redirectPath = '/employee/dashboard';
      } else {
        redirectPath = '/manager/dashboard';
      }
      window.location.href = redirectPath;
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Clear API headers
    delete api.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
