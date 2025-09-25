import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useNotification } from './NotificationContext';

// Create the context
export const ManagerContext = createContext();

// Custom hook for easier usage
export const useManager = () => {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error('useManager must be used within a ManagerProvider');
  }
  return context;
};

export const ManagerProvider = ({ children }) => {
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get notification functions
  const { success, error: showError } = useNotification();

  // ✅ Fetch all managers
  const fetchManagers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/manager/all');
      setManagers(response.data?.data || response.data || response || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      setError('Failed to fetch managers');
      showError('Failed to load managers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Get manager by ID
  const fetchManagerById = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/manager/${id}`);
      setSelectedManager(response.data?.data || response.data || response);
      return response.data?.data || response.data || response;
    } catch (error) {
      console.error('Error fetching manager:', error);
      setError('Failed to fetch manager');
      showError('Failed to load manager details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Create new manager
  const createManager = useCallback(async (managerData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post('/manager', managerData);
      await fetchManagers(); // Refresh the list
      success('Manager created successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create manager';
      setError(message);
      showError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchManagers]);

  // ✅ Update manager
  const updateManager = useCallback(async (id, updatedData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.put(`/manager/${id}`, updatedData);
      if (response.status === 200) {
        await fetchManagers(); // Refresh the list
        success('Manager updated successfully');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update manager';
      setError(message);
      showError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchManagers]);

  // ✅ Delete manager
  const deleteManager = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.delete(`/manager/${id}`);
      setManagers((prev) => prev.filter((manager) => manager._id !== id));
      success('Manager deleted successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete manager';
      setError(message);
      showError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    managers,
    selectedManager,
    isLoading,
    error,
    fetchManagers,
    fetchManagerById,
    createManager,
    updateManager,
    deleteManager,
    clearError,
  };

  return (
    <ManagerContext.Provider value={value}>
      {children}
    </ManagerContext.Provider>
  );
};
