import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

// Create the context
export const ManagerAttendanceContext = createContext();

// Custom hook for easier usage
export const useManagerAttendance = () => {
  const context = useContext(ManagerAttendanceContext);
  if (!context) {
    throw new Error('useManagerAttendance must be used within a ManagerAttendanceProvider');
  }
  return context;
};

export const ManagerAttendanceProvider = ({ children }) => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const isLoadingRef = useRef(false);

  // ✅ Fetch all attendance records (for manager's team)
  const fetchAttendance = useCallback(async (filters = {}, retryCount = 0) => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current && retryCount === 0) {
      console.log('Attendance request already in progress, skipping...');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No authentication token found for attendance');
        setError('Authentication required. Please log in again.');
        toast.error('Please log in to access attendance data');
        return;
      }
      
      console.log('Fetching attendance with token:', token.substring(0, 20) + '...');
      const response = await api.get('/attendence', { params: filters });
      console.log('Attendance response:', response);
      
      // Extract attendance data properly
      let attendanceData = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        attendanceData = response.data.data;
      } else if (response.data?.attendance && Array.isArray(response.data.attendance)) {
        attendanceData = response.data.attendance;
      } else if (Array.isArray(response.data)) {
        attendanceData = response.data;
      }
      
      setAttendanceList(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      console.error('Error response:', error.response);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        toast.error('Session expired. Please log in again.');
        return;
      }
      
      // Retry up to 3 times for timeout errors with exponential backoff
      if (error.code === 'ECONNABORTED' && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
        console.log(`Retrying fetchAttendance (attempt ${retryCount + 1}/3) in ${delay}ms`);
        setTimeout(() => {
          fetchAttendance(filters, retryCount + 1);
        }, delay);
        return;
      }
      
      setError('Failed to fetch attendance records');
      // Only show error toast on final failure
      if (retryCount > 0) {
        toast.error('Failed to load attendance records');
      }
      setAttendanceList([]); // Set empty array on error
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // ✅ Fetch attendance for specific employee
  const fetchAttendanceByEmployee = useCallback(async (employeeId, filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/attendence/${employeeId}`, { params: filters });
      return response.data?.data || response.data || response || [];
    } catch (error) {
      console.error('Error fetching employee attendance:', error);
      setError('Failed to fetch employee attendance');
      toast.error('Failed to load employee attendance');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Fetch employees for attendance management
  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/employee/all');
      setEmployees(response.data?.data || response.data || response || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to fetch employees');
      toast.error('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Check employee status before clocking in
  const checkEmployeeStatus = useCallback(async (employeeId) => {
    try {
      const response = await api.get(`/attendence/status/${employeeId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error checking employee status:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to check employee status' };
    }
  }, []);

  // ✅ Clock in employee (manager can clock in employees)
  const clockInEmployee = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First check if employee is already stepped in
      const employeeId = formData.get('employeeId');
      const statusCheck = await checkEmployeeStatus(employeeId);
      
      if (statusCheck.success && statusCheck.data.isSteppedIn) {
        const message = `Employee is already stepped in since ${new Date(statusCheck.data.attendance.stepIn).toLocaleString()}. Please step out first.`;
        setError(message);
        toast.error(message);
        return { success: false, error: message, needsStepOut: true, attendanceId: statusCheck.data.attendance._id };
      }
      
      // Debug: Log the FormData being sent
              // console.log('ManagerAttendanceContext - Sending FormData:');
        for (let [key, value] of formData.entries()) {
          // console.log(`${key}:`, value);
        }
      
      const response = await api.post('/attendence/step-in', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
              // console.log('ManagerAttendanceContext - Success response:', response.data);
      toast.success('Employee clocked in successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('ManagerAttendanceContext - Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to clock in employee';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [checkEmployeeStatus]);

  // ✅ Clock out employee (manager can clock out employees)
  const clockOutEmployee = useCallback(async (formData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Debug: Log the FormData being sent
              // console.log('ManagerAttendanceContext - Sending FormData for step-out:');
        for (let [key, value] of formData.entries()) {
          // console.log(`${key}:`, value);
        }
      
      const response = await api.post('/attendence/step-out', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
              // console.log('ManagerAttendanceContext - Step-out success response:', response.data);
      toast.success('Employee clocked out successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('ManagerAttendanceContext - Step-out error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to clock out employee';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Update attendance record
  const updateAttendance = useCallback(async (id, data) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.put(`/attendence/${id}`, data);
      toast.success('Attendance updated successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update attendance';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Bulk update attendance
  const bulkUpdateAttendance = useCallback(async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post('/attendence/bulk-update', data);
      toast.success('Attendance records updated successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update attendance records';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Delete attendance record
  const deleteAttendance = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.delete(`/attendence/${id}`);
      setAttendanceList(prev => prev.filter(record => record._id !== id));
      toast.success('Attendance record deleted successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete attendance record';
      setError(message);
      toast.error(message);
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
    attendanceList,
    employees,
    isLoading,
    error,
    fetchAttendance,
    fetchAttendanceByEmployee,
    fetchEmployees,
    clockInEmployee,
    clockOutEmployee,
    updateAttendance,
    bulkUpdateAttendance,
    deleteAttendance,
    checkEmployeeStatus,
    clearError,
  };

  return (
    <ManagerAttendanceContext.Provider value={value}>
      {children}
    </ManagerAttendanceContext.Provider>
  );
};
