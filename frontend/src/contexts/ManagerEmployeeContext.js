import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useNotification } from './NotificationContext';

// Create the context
export const ManagerEmployeeContext = createContext();

// Custom hook for easier usage
export const useManagerEmployee = () => {
  const context = useContext(ManagerEmployeeContext);
  if (!context) {
    throw new Error('useManagerEmployee must be used within a ManagerEmployeeProvider');
  }
  return context;
};

export const ManagerEmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { success, error: showError } = useNotification();
  const isLoadingRef = useRef(false);

  // ✅ Fetch employees assigned to the current manager
  const fetchMyEmployees = useCallback(async (retryCount = 0) => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current && retryCount === 0) {
      console.log('Request already in progress, skipping...');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication required. Please log in again.');
        showError('Please log in to access employee data');
        return;
      }
      
      console.log('Fetching employees with token:', token.substring(0, 20) + '...');
      const response = await api.get('/employee/all');
      console.log('Employees response:', response);
      
      // Filter employees assigned to current manager (this will be handled by backend)
      setEmployees(response.data?.data || response.data || response || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      console.error('Error response:', error.response);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        showError('Session expired. Please log in again.');
        return;
      }
      
      // Retry up to 3 times for timeout errors with exponential backoff
      if (error.code === 'ECONNABORTED' && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`Retrying fetchMyEmployees (attempt ${retryCount + 1}/3) in ${delay}ms`);
        setTimeout(() => {
          fetchMyEmployees(retryCount + 1);
        }, delay);
        return;
      }
      
      setError('Failed to fetch employees');
      // Only show error toast on final failure
      if (retryCount > 0) {
        showError('Failed to load employees');
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [showError]);

  // ✅ Get employee by ID
  const fetchEmployeeById = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/employee/${id}`);
      setSelectedEmployee(response.data?.data || response.data || response);
      return response.data?.data || response.data || response;
    } catch (error) {
      console.error('Error fetching employee:', error);
      setError('Failed to fetch employee');
      showError('Failed to load employee details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Create new employee (manager creates employee for their team)
  const createMyEmployee = useCallback(async (employeeData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post('/employee/manager', employeeData);
      await fetchMyEmployees(); // Refresh the list
      success('Employee created successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create employee';
      setError(message);
      showError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchMyEmployees]);

  // ✅ Update employee
  const updateMyEmployee = useCallback(async (id, updatedData) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.put(`/employee/${id}`, updatedData);
      if (response.status === 200) {
        await fetchMyEmployees(); // Refresh the list
        success('Employee updated successfully');
        return { success: true, data: response.data };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update employee';
      setError(message);
      showError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [fetchMyEmployees]);

  // ✅ Delete employee
  const deleteMyEmployee = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.delete(`/employee/${id}`);
      setEmployees((prev) => prev.filter((employee) => employee._id !== id));
      success('Employee deleted successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete employee';
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
    employees,
    selectedEmployee,
    isLoading,
    error,
    fetchMyEmployees,
    fetchEmployeeById,
    createMyEmployee,
    updateMyEmployee,
    deleteMyEmployee,
    clearError,
  };

  return (
    <ManagerEmployeeContext.Provider value={value}>
      {children}
    </ManagerEmployeeContext.Provider>
  );
};
