import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { employeeAPI, attendanceAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const EmployeeContext = createContext();

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};

export const EmployeeProvider = ({ children }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  
  // Admin employee management states
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Don't fetch if data already exists and not forcing refresh
    if (dataFetched && !forceRefresh) {
      console.log('📊 Dashboard data already cached, skipping API call');
      return dashboardData;
    }

    console.log('📊 Fetching dashboard data from API...', { forceRefresh, dataFetched });
    try {
      setLoading(true);
      const response = await employeeAPI.getEmployeeDashboard();
      setDashboardData(response.data.data);
      setDataFetched(true);
      console.log('📊 Dashboard data fetched successfully');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dataFetched, dashboardData]);

  const handleClockIn = useCallback(async (stepInData = null) => {
    try {
      setAttendanceLoading(true);
      
      let locationData = {};
      let imageData = null;
      let shift = dashboardData?.employee?.shift || 'morning';
      let status = 'present';
      let note = '';

      if (stepInData) {
        // Use data from modal
        if (stepInData.coordinates) {
          locationData = {
            longitude: stepInData.coordinates.longitude,
            latitude: stepInData.coordinates.latitude,
            address: stepInData.location || 'Current Location'
          };
        }
        imageData = stepInData.image;
        shift = stepInData.shift || shift;
        status = stepInData.status || status;
        note = stepInData.note || note;
      } else {
        // Fallback to automatic location detection
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true
              });
            });
            locationData = {
              longitude: position.coords.longitude,
              latitude: position.coords.latitude,
              address: 'Current Location'
            };
          } catch (geoError) {
            console.warn('Could not get location:', geoError);
          }
        }
      }

      const clockInData = {
        managerId: dashboardData?.employee?.managerId,
        shift: shift,
        status: status,
        note: note,
        ...locationData
      };
      
      

      // If image is provided, we need to send it as FormData
      let response;
      if (imageData) {
        const formData = new FormData();
        
        // Add all the clock-in data
        Object.keys(clockInData).forEach(key => {
          formData.append(key, clockInData[key]);
        });
        
        // Convert base64 image to blob and add to FormData
        const response_img = await fetch(imageData);
        const blob = await response_img.blob();
        formData.append('stepInImage', blob, 'step-in-image.jpg');
        
        response = await attendanceAPI.clockIn(formData);
      } else {
        response = await attendanceAPI.clockIn(clockInData);
      }

      toast.success('Clock in successful!');
      await fetchDashboardData(true); // Force refresh data
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error clocking in:', error);
      
      // Check if it's a geo-fencing error with enhanced message
      const geoFenceValidation = error.response?.data?.geoFenceValidation;
      const message = geoFenceValidation?.userMessage || error.response?.data?.message || 'Failed to clock in';
      
      // Show enhanced error message for geo-fencing issues
      if (geoFenceValidation && !geoFenceValidation.isValid) {
        toast.error(message, {
          duration: 6000, // Show longer for geo-fencing messages
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            fontSize: '14px',
            maxWidth: '400px'
          }
        });
      } else {
        toast.error(message);
      }
      
      return { success: false, error: message, geoFenceValidation };
    } finally {
      setAttendanceLoading(false);
    }
  }, [fetchDashboardData, user, dashboardData]);

  const handleClockOut = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      
      // Step-out only records time, no address needed
      const clockOutData = {};
      

      const response = await attendanceAPI.clockOut(clockOutData);
      toast.success('Clock out successful!');
      
      // Force refresh data and wait for it to complete
      await fetchDashboardData(true);
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error clocking out:', error);
      
      // Check if it's a geo-fencing error with enhanced message
      const geoFenceValidation = error.response?.data?.geoFenceValidation;
      const message = geoFenceValidation?.userMessage || error.response?.data?.message || 'Failed to clock out';
      
      // Show enhanced error message for geo-fencing issues
      if (geoFenceValidation && !geoFenceValidation.isValid) {
        toast.error(message, {
          duration: 6000, // Show longer for geo-fencing messages
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fecaca',
            fontSize: '14px',
            maxWidth: '400px'
          }
        });
      } else {
        toast.error(message);
      }
      
      return { success: false, error: message, geoFenceValidation };
    } finally {
      setAttendanceLoading(false);
    }
  }, [fetchDashboardData, user]);

  const updateProfile = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await employeeAPI.updateEmployeeProfile(data);
      toast.success('Profile updated successfully');
      await fetchDashboardData(true); // Force refresh data
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [fetchDashboardData]);

  const changePassword = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await employeeAPI.changeEmployeePassword(data);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearDashboardData = useCallback(() => {
    setDashboardData(null);
    setDataFetched(false);
  }, []);

  // Admin employee management functions
  const fetchEmployees = useCallback(async () => {
    try {
      console.log('🔄 Fetching employees...');
      setEmployeeLoading(true);
      const response = await employeeAPI.getAllEmployees();
      console.log('📊 Employee API response:', response.data);
      
      // Backend returns { message: "Success", data: employees }
      if (response.data.message === "Success" && response.data.data) {
        setEmployees(response.data.data || []);
        console.log('✅ Employees loaded:', response.data.data?.length || 0, 'employees');
      } else {
        console.error('❌ Failed to fetch employees:', response.data.message);
        toast.error('Failed to fetch employees');
        setEmployees([]);
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      toast.error('Failed to fetch employees');
      setEmployees([]);
    } finally {
      setEmployeeLoading(false);
    }
  }, []);

  const createEmployee = useCallback(async (employeeData) => {
    try {
      setEmployeeLoading(true);
      const response = await employeeAPI.createEmployee(employeeData);
      if (response.data.message === "Employee created successfully") {
        toast.success('Employee created successfully');
        await fetchEmployees(); // Refresh the list
        return { success: true, data: response.data.employee };
      } else {
        toast.error(response.data.message || 'Failed to create employee');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      const message = error.response?.data?.message || 'Failed to create employee';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setEmployeeLoading(false);
    }
  }, [fetchEmployees]);

  const updateEmployee = useCallback(async (employeeId, employeeData) => {
    try {
      setEmployeeLoading(true);
      const response = await employeeAPI.updateEmployee(employeeId, employeeData);
      if (response.data.message === "Employee updated successfully") {
        toast.success('Employee updated successfully');
        await fetchEmployees(); // Refresh the list
        return { success: true, data: response.data.employee };
      } else {
        toast.error(response.data.message || 'Failed to update employee');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      const message = error.response?.data?.message || 'Failed to update employee';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setEmployeeLoading(false);
    }
  }, [fetchEmployees]);

  const deleteEmployee = useCallback(async (employeeId) => {
    try {
      setEmployeeLoading(true);
      const response = await employeeAPI.deleteEmployee(employeeId);
      if (response.data.message === "Employee deleted successfully") {
        toast.success('Employee deleted successfully');
        await fetchEmployees(); // Refresh the list
        return { success: true };
      } else {
        toast.error(response.data.message || 'Failed to delete employee');
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      const message = error.response?.data?.message || 'Failed to delete employee';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setEmployeeLoading(false);
    }
  }, [fetchEmployees]);

  const value = {
    dashboardData,
    loading,
    attendanceLoading,
    fetchDashboardData,
    handleClockIn,
    handleClockOut,
    updateProfile,
    changePassword,
    clearDashboardData,
    // Admin employee management
    employees,
    employeeLoading,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
};