import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

const DashboardContext = createContext();

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    totalManagers: 0,
    workingEmployees: 0,
    shiftWise: { 
      morning: 0, 
      evening: 0, 
      night: 0 
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await dashboardAPI.getDashboard();
      const data = response.data;
      
      // Normalize response for UI
      const normalizedData = {
        totalEmployees: data.totalEmployees ?? 0,
        totalManagers: data.totalManagers ?? 0,
        workingEmployees: data.workingEmployees ?? 0,
        shiftWise: {
          morning: data.shiftWise?.morning ?? 0,
          evening: data.shiftWise?.evening ?? 0,
          night: data.shiftWise?.night ?? 0,
          ...data.shiftWise,
        },
      };
      
              // console.log('✅ Dashboard data fetched successfully:', normalizedData);
      setDashboardData(normalizedData);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = () => {
    setError(null);
  };

  const value = {
    ...dashboardData,
    isLoading,
    error,
    fetchDashboard,
    clearError,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
