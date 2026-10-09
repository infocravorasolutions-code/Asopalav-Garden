import React, { createContext, useContext, useState, useCallback } from 'react';
import { api, handleApiError, handleApiSuccess } from '../utils/fetchInterceptor';
import toast from 'react-hot-toast';

const AttendanceContext = createContext();

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

export const AttendanceProvider = ({ children }) => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 50,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch all attendance records with pagination
  const fetchAttendance = useCallback(async (filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 [fetchAttendance] Fetching with filters:', filters);

      const response = await api.get('/attendence/all?limit=0');
      const attendanceData = response.attendance || [];
      const paginationData = response.pagination || {};

      console.log('📊 [fetchAttendance] Response:', {
        attendanceCount: attendanceData.length,
        pagination: paginationData
      });

      // Always set the data from the response
      setAttendanceList(attendanceData);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));

      console.log('📊 [fetchAttendance] State updated:', {
        attendanceListLength: attendanceData.length,
        pagination: paginationData
      });

      return {
        attendance: attendanceData,
        pagination: paginationData
      };
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch attendance data');
      setError(errorMessage);
      console.error('Error fetching attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch attendance by employee
  const fetchAttendanceByEmployee = useCallback(async (employeeId, filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/attendence/employee/${employeeId}`);
      return response.attendance || [];
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch employee attendance');
      setError(errorMessage);
      console.error('Error fetching employee attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all managers for filtering
  const fetchManagers = useCallback(async () => {
    try {
      const response = await api.get('/manager/all');
      setManagers(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error('Error fetching managers:', err);
      return [];
    }
  }, []);

  // Fetch all employees for filtering
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/employee/all');
      setEmployees(response.data || []);
      return response.data || [];
    } catch (err) {
      console.error('Error fetching employees:', err);
      return [];
    }
  }, []);

  // Update single attendance record
  const updateAttendance = useCallback(async (id, data) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put(`/attendence/${id}`, data);

      // Update the record in the list - backend returns { message, attendance }
      const updatedRecord = response.attendance || response;
      setAttendanceList(prev =>
        prev.map(record =>
          record._id === id ? { ...record, ...updatedRecord } : record
        )
      );
      return updatedRecord;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update attendance';
      setError(errorMessage);
      console.error('Error updating attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Bulk update attendance records
  const bulkUpdateAttendance = useCallback(async (attendanceIds, updates) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put('/attendence/bulk-update', {
        attendanceIds,
        updates
      });
      // Refresh the attendance list
      await fetchAttendance();
      return response;
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to bulk update attendance');
      setError(errorMessage);
      console.error('Error bulk updating attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAttendance]);

  // Export attendance data to CSV
  const exportToCSV = useCallback((data, filename = 'attendance_report.csv') => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Add header information
      const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const presentCount = data.filter(record => record.stepIn).length;
      const absentCount = data.filter(record => !record.stepIn).length;
      const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0);

      const headerInfo = [
        ['MAHAKALI FARM & NURSERY - ATTENDANCE REPORT'],
        [''],
        [`Report Generated: ${reportDate}`],
        [`Total Records: ${data.length}`],
        [`Present: ${presentCount} | Absent: ${absentCount} | Total Hours: ${Math.floor(totalHours / 60)}h ${totalHours % 60}m`],
        ['']
      ];

      // Define CSV headers
      const headers = [
        'Date',
        'Employee Name',
        'Employee Email',
        'Shift',
        'Clock In',
        'Clock Out',
        'Location',
        'Remarks'
      ];

      // Sort data by date (ascending - oldest first) for better report readability
      const sortedData = [...data].sort((a, b) => new Date(a.stepIn) - new Date(b.stepIn));

      // Convert data to CSV format
      const csvData = sortedData.map(record => [
        new Date(record.stepIn).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', ''),
        record.employeeId?.name || 'N/A',
        record.employeeId?.email || 'N/A',
        record.shift?.toUpperCase() || 'N/A',
        record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : 'N/A',
        record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : 'N/A',
        record.address || 'N/A',
        record.note || 'N/A'
      ]);

      // Create CSV content with header info
      const csvContent = [
        ...headerInfo.map(row => row.join(',')),
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Create blob
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Check if in WebView and use appropriate download method
      if (window.ReactNativeWebView) {
        console.log('📱 WebView detected, using native CSV download...');

        // Convert blob to base64 for WebView
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result;

          // Send to React Native using the exact format your app expects
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'download',
            fileType: 'csv',
            fileName: filename,
            data: base64Data
          }));

          console.log('📊 CSV sent to React Native:', filename);
        };
        reader.readAsDataURL(blob);
      } else {
        // Fallback for regular browser
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export CSV');
    }
  }, []);

  // Export attendance data to PDF using enhanced utility
  const exportToPDF = useCallback(async (data, filename = 'attendance_report.pdf') => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Import the enhanced PDF export utility
      let exportAttendanceToPDF;
      try {
        const pdfUtils = await import('../utils/pdfExportUtils');
        exportAttendanceToPDF = pdfUtils.exportAttendanceToPDF || pdfUtils.default?.exportAttendanceToPDF;

        if (!exportAttendanceToPDF) {
          throw new Error('PDF export function not found');
        }
      } catch (error) {
        console.error('Error importing PDF utils:', error);
        throw new Error('Failed to load PDF export utility');
      }

      // Use the enhanced PDF export function
      await exportAttendanceToPDF(data, filename);

      // Show success message
      const isWebView = window.ReactNativeWebView !== undefined;
      if (isWebView) {
        toast.success('PDF export initiated in mobile app');
      } else {
        toast.success('PDF exported successfully');
      }

    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF: ' + err.message);
      toast.error('Failed to export PDF: ' + err.message);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Delete attendance record
  const deleteAttendance = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/attendence/${id}`);
      setAttendanceList(prev => prev.filter(record => record._id !== id));
      handleApiSuccess('Attendance record deleted successfully');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error, 'Failed to delete attendance record');
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch paginated attendance (for AttendanceManagement component)
  const fetchPaginatedAttendance = useCallback(async (filters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 [fetchPaginatedAttendance] Fetching with filters:', filters);

      const response = await api.get('/attendence/all?limit=0');
      const attendanceData = response.attendance || [];
      const paginationData = response.pagination || {};

      console.log('📊 [fetchPaginatedAttendance] Response:', {
        attendanceCount: attendanceData.length,
        pagination: paginationData,
        limit: filters.limit
      });

      setAttendanceList(attendanceData);
      setPagination(prev => ({
        ...prev,
        ...paginationData
      }));

      console.log('📊 [fetchPaginatedAttendance] State updated:', {
        attendanceListLength: attendanceData.length,
        pagination: paginationData
      });

      return {
        attendance: attendanceData,
        pagination: paginationData
      };
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch attendance data');
      setError(errorMessage);
      console.error('Error fetching attendance:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pagination functions
  const goToPage = useCallback(async (page, filters = {}) => {
    const newFilters = { ...filters, page, limit: pagination.limit };
    await fetchPaginatedAttendance(newFilters);
  }, [fetchPaginatedAttendance, pagination.limit]);

  const changePageSize = useCallback(async (newLimit, filters = {}) => {
    const newFilters = { ...filters, page: 1, limit: newLimit };
    await fetchPaginatedAttendance(newFilters);
  }, [fetchPaginatedAttendance]);

  const value = {
    attendanceList,
    managers,
    employees,
    isLoading,
    error,
    pagination,
    fetchAttendance,
    fetchPaginatedAttendance,
    fetchAttendanceByEmployee,
    fetchManagers,
    fetchEmployees,
    updateAttendance,
    bulkUpdateAttendance,
    deleteAttendance,
    goToPage,
    changePageSize,
    exportToCSV,
    exportToPDF,
    clearError
  };

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
};
