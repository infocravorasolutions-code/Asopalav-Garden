import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Download, 
  FileText, 
  Filter, 
  Search, 
  Calendar,
  User,
  MapPin,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { useAuth } from '../../contexts/AuthContext';
import EditAttendanceModal from './EditAttendanceModal';
import toast from 'react-hot-toast';
import { IMAGE_URL } from '../../services/api';
import LocationDisplay from '../ui/LocationDisplay';
import { exportToExcel } from '../../utils/exportUtils';
import { showDownloadSuccess } from '../../utils/webviewUtils';

const AttendanceManagement = () => {
  const { user } = useAuth();
  const isReadOnly = user?.adminType === 'readonly';
  
  const {
    attendanceList,
    managers,
    employees,
    isLoading,
    error,
    fetchAttendance,
    fetchManagers,
    fetchEmployees,
    updateAttendance,
    deleteAttendance,
    exportToCSV,
    exportToPDF,
    clearError
  } = useAttendance();

  const [filters, setFilters] = useState({
    managerId: '',
    employeeId: '',
    startDate: '',
    endDate: '',
    shift: '',
    status: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Pagination and performance optimization
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounced search to reduce processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when search changes
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAttendance(),
          fetchManagers(),
          fetchEmployees()
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    loadData();
  }, [fetchAttendance, fetchManagers, fetchEmployees]);

  // Debug: Log attendance data to check for step-in images
  useEffect(() => {
    if (attendanceList && attendanceList.length > 0) {
      // console.log('Attendance data loaded:', attendanceList.length, 'records');
      attendanceList.forEach((record, index) => {
        if (record.stepInImage) {
          // console.log(`Record ${index}: ${record.employeeId?.name} has stepInImage:`, record.stepInImage);
        }
      });
    }
  }, [attendanceList]);

  // Update editing record when attendance list changes
  useEffect(() => {
    if (editingRecord && attendanceList.length > 0) {
      const updatedRecord = attendanceList.find(r => r._id === editingRecord._id);
      if (updatedRecord && JSON.stringify(updatedRecord) !== JSON.stringify(editingRecord)) {
        setEditingRecord(updatedRecord);
      }
    }
  }, [attendanceList, editingRecord]);

  // Debug logging
  useEffect(() => {
    // console.log('Managers in component:', managers);
    // console.log('Employees in component:', employees);
  }, [managers, employees]);

  // Apply filters
  const applyFilters = () => {
    fetchAttendance(filters);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      managerId: '',
      employeeId: '',
      startDate: '',
      endDate: '',
      shift: '',
      status: ''
    });
    fetchAttendance();
  };

  // Handle edit attendance
  const handleEditAttendance = (record) => {
    if (isReadOnly) {
      toast.error('You do not have permission to edit attendance records');
      return;
    }
    // Get the latest record data from the attendance list
    const latestRecord = attendanceList.find(r => r._id === record._id) || record;
    // console.log('Opening edit modal for record:', {
    //   id: latestRecord._id,
    //   employeeName: latestRecord.employeeId?.name,
    //   stepIn: latestRecord.stepIn,
    //   stepOut: latestRecord.stepOut,
    //   stepInLocal: latestRecord.stepIn ? new Date(latestRecord.stepIn).toLocaleString() : 'N/A',
    //   stepOutLocal: latestRecord.stepOut ? new Date(latestRecord.stepOut).toLocaleString() : 'N/A'
    // });
    setEditingRecord(latestRecord);
    setIsEditModalOpen(true);
  };

  // Handle save attendance changes
  const handleSaveAttendance = async (attendanceId, data) => {
    setIsUpdating(true);
    try {
      const updatedRecord = await updateAttendance(attendanceId, data);
      toast.success('Attendance record updated successfully!');
      
      // Update the editing record with the new data immediately
      setEditingRecord(prev => 
        prev && prev._id === attendanceId ? { ...prev, ...updatedRecord } : prev
      );
      
      // Refresh the attendance list to get the latest data (this will update the table)
      await fetchAttendance();
      
    } catch (error) {
      console.error('Error updating attendance:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update attendance record';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  // Handle delete attendance record
  const handleDeleteAttendance = async (recordId) => {
    if (isReadOnly) {
      toast.error('You do not have permission to delete attendance records');
      return;
    }
    if (window.confirm('Are you sure you want to delete this attendance record? This action cannot be undone.')) {
      try {
        await deleteAttendance(recordId);
      } catch (error) {
        console.error('Error deleting attendance record:', error);
      }
    }
  };

  // Optimized filtering with memoization
  const filteredData = useMemo(() => {
    if (!attendanceList || attendanceList.length === 0) return [];
    
    return attendanceList.filter(record => {
      const matchesSearch = 
        record.employeeId?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        record.employeeId?.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        record.address?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesManager = !filters.managerId || record.managerId?._id === filters.managerId;
      const matchesEmployee = !filters.employeeId || record.employeeId?._id === filters.employeeId;
      const matchesShift = !filters.shift || record.shift === filters.shift;
      const matchesStatus = !filters.status || 
        (filters.status === 'present' && record.stepIn) ||
        (filters.status === 'absent' && !record.stepIn);

      // Improved date filtering logic
      let matchesStartDate = true;
      let matchesEndDate = true;
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0); // Set to start of day
        const recordDate = new Date(record.stepIn);
        recordDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
        matchesStartDate = recordDate >= startDate;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        const recordDate = new Date(record.stepIn);
        matchesEndDate = recordDate <= endDate;
      }

      return matchesSearch && matchesManager && matchesEmployee && 
             matchesShift && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [attendanceList, debouncedSearchTerm, filters]);

  // Paginated data for better performance
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);


  // Export functions with WebView support
  const handleExportCSV = async () => {
    try {
      await exportToCSV(filteredData, `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(showDownloadSuccess('CSV export completed'));
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(filteredData, `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`, 'Attendance Report');
      toast.success(showDownloadSuccess('PDF export completed'));
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel(filteredData, `attendance_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(showDownloadSuccess('Excel export completed'));
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  // Optimized statistics calculation with memoization
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        averageHours: 0,
        totalHours: 0,
        attendanceRate: 0,
        shiftStats: { morning: 0, evening: 0, night: 0 },
        locationStats: {},
        recentActivity: []
      };
    }

    const present = filteredData.filter(record => record.stepIn).length;
    const totalTime = filteredData.reduce((sum, record) => sum + (record.totalTime || 0), 0);
    
    return {
      total: filteredData.length,
      present,
      absent: filteredData.length - present,
      averageHours: filteredData.length > 0 
        ? Math.round(totalTime / filteredData.length / 60 * 10) / 10
        : 0,
      totalHours: Math.round(totalTime / 60 * 10) / 10,
      attendanceRate: filteredData.length > 0 
        ? Math.round((present / filteredData.length) * 100)
        : 0,
      shiftStats: {
        morning: filteredData.filter(record => record.shift === 'morning').length,
        evening: filteredData.filter(record => record.shift === 'evening').length,
        night: filteredData.filter(record => record.shift === 'night').length
      },
      locationStats: filteredData.reduce((acc, record) => {
        const location = record.address || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {}),
      recentActivity: filteredData
        .sort((a, b) => new Date(b.stepIn) - new Date(a.stepIn))
        .slice(0, 5)
    };
  }, [filteredData]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-secondary-900">
            {isReadOnly ? 'Attendance Overview' : 'Attendance Management'}
          </h1>
          <p className="text-sm md:text-base text-secondary-600">
            {isReadOnly 
              ? 'View employee attendance records and reports' 
              : 'Monitor and manage employee attendance records'
            }
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline btn-sm flex items-center space-x-1 md:space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button
            onClick={() => fetchAttendance()}
            className="btn btn-outline btn-sm flex items-center space-x-1 md:space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => window.location.href = '/admin/reports'}
            className="btn btn-primary btn-sm flex items-center space-x-1 md:space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-secondary-600">Total Records</p>
              <p className="text-lg md:text-2xl font-bold text-secondary-900">{stats.total}</p>
              <p className="text-xs text-gray-500">{stats.attendanceRate}% attendance rate</p>
            </div>
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-secondary-600">Present</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">{stats.present}</p>
              <p className="text-xs text-gray-500">{stats.totalHours}h total</p>
            </div>
            <User className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-secondary-600">Absent</p>
              <p className="text-lg md:text-2xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-xs text-gray-500">{Math.round((stats.absent / stats.total) * 100)}% of total</p>
            </div>
            <User className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
          </div>
        </div>
        {/* <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-secondary-600">Avg Hours</p>
              <p className="text-lg md:text-2xl font-bold text-secondary-900">{stats.averageHours}h</p>
              <p className="text-xs text-gray-500">per employee</p>
            </div>
            <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
          </div>
        </div> */}
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-secondary-600">Morning Shift</p>
              <p className="text-lg md:text-xl font-bold text-blue-600">{stats.shiftStats.morning}</p>
            </div>
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-secondary-600">Evening Shift</p>
              <p className="text-lg md:text-xl font-bold text-orange-600">{stats.shiftStats.evening}</p>
            </div>
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
          </div>
        </div>
        <div className="card p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-secondary-600">Night Shift</p>
              <p className="text-lg md:text-xl font-bold text-purple-600">{stats.shiftStats.night}</p>
            </div>
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="label">Manager</label>
              <select
                className="input"
                value={filters.managerId}
                onChange={(e) => setFilters(prev => ({ ...prev, managerId: e.target.value }))}
              >
                <option value="">All Managers</option>
                {managers.map(manager => (
                  <option key={manager._id} value={manager._id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Employee</label>
              <select
                className="input"
                value={filters.employeeId}
                onChange={(e) => setFilters(prev => ({ ...prev, employeeId: e.target.value }))}
              >
                <option value="">All Employees</option>
                {employees.map(employee => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Shift</label>
              <select
                className="input"
                value={filters.shift}
                onChange={(e) => setFilters(prev => ({ ...prev, shift: e.target.value }))}
              >
                <option value="">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
            <button onClick={clearFilters} className="btn btn-outline btn-sm">
              Clear
            </button>
            <button onClick={applyFilters} className="btn btn-primary btn-sm">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          {/* <button
            onClick={handleExportCSV}
            className="btn btn-outline btn-sm flex items-center space-x-2"
            disabled={filteredData.length === 0}
          >
            <FileText className="h-4 w-4" />
            <span>Export CSV</span>
          </button> */}
          <button
            onClick={handleExportExcel}
            className="btn btn-outline btn-sm flex items-center space-x-2"
            disabled={filteredData.length === 0}
          >
            <FileText className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-outline btn-sm flex items-center space-x-2"
            disabled={filteredData.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={clearError} className="btn btn-sm btn-ghost">×</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading attendance data...</span>
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && (
        <div className="block md:hidden space-y-4">
          {paginatedData.length === 0 ? (
            <div className="text-center py-8 text-secondary-500">
              No attendance records found
            </div>
          ) : (
            paginatedData.map((record) => (
              <div key={record._id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="avatar relative">
                      <div className="w-10 h-10 rounded-full bg-secondary-200 flex items-center justify-center">
                        {record.employeeId?.image ? (
                          <img 
                            src={`${IMAGE_URL}/${record.employeeId.image}`} 
                            alt={record.employeeId.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : record.stepInImage ? (
                          <img 
                            src={`${IMAGE_URL}/${record.stepInImage}`} 
                            alt={`${record.employeeId?.name || 'Employee'} - Step In`}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ${(record.stepInImage || record.employeeId?.image) ? 'hidden' : ''}`}>
                          {record.employeeId?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                      {record.stepInImage && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                          <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-base">{record.employeeId?.name || 'N/A'}</div>
                      <div className="text-sm text-secondary-500">{record.employeeId?.email || 'N/A'}</div>
                    </div>
                  </div>
                  <span className={`badge badge-sm text-xs ${
                    record.stepIn ? 'badge-success' : 'badge-success'
                  }`}>
                    {record.stepIn ? 'Present' : 'Present'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-secondary-400" />
                    <span>{new Date(record.stepIn).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-secondary-400" />
                    <span className={`badge badge-sm ${
                      record.shift === 'morning' ? 'badge-primary' :
                      record.shift === 'evening' ? 'badge-secondary' :
                      'badge-accent'
                    }`}>
                      {record.shift || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-secondary-600">In:</span>
                    <span className="font-medium">
                      {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-secondary-600">Out:</span>
                    <span className="font-medium">
                      {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {record.address && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-secondary-400 mt-0.5" />
                      <span className="text-sm text-secondary-600 flex-1">{record.address}</span>
                    </div>
                  </div>
                )}
                
                {record.note && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-secondary-400 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-xs text-secondary-500 font-medium">Remarks:</span>
                        <p className="text-sm text-secondary-700 mt-1">{record.note}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!isReadOnly && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditAttendance(record)}
                      className="btn btn-ghost btn-xs"
                      title="Edit Attendance Record"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAttendance(record._id)}
                      className="btn btn-ghost btn-xs text-red-600 hover:text-red-700"
                      title="Delete Attendance Record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && (
        <div className="hidden md:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th className="hidden md:table-cell">Shift</th>
                  <th className="hidden sm:table-cell">Clock In</th>
                  <th className="hidden sm:table-cell">Clock Out</th>
                  <th className="hidden lg:table-cell min-w-64">Location</th>
                  <th className="hidden xl:table-cell">Remarks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={isReadOnly ? "8" : "9"} className="text-center py-8 text-secondary-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div className="avatar relative">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary-200 flex items-center justify-center">
                              {record.employeeId?.image ? (
                                <img 
                                  src={`${IMAGE_URL}/${record.employeeId.image}`} 
                                  alt={record.employeeId.name}
                                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                                  title="Profile photo"
                                  onError={(e) => {
                                    // console.log('Profile image failed to load:', record.employeeId.image);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : record.stepInImage ? (
                                <img 
                                  src={`${IMAGE_URL}/${record.stepInImage}`} 
                                  alt={`${record.employeeId?.name || 'Employee'} - Step In`}
                                  className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                                  title="Step-in photo"
                                  onError={(e) => {
                                    // console.log('Step-in image failed to load:', record.stepInImage);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm ${(record.stepInImage || record.employeeId?.image) ? 'hidden' : ''}`}>
                                {record.employeeId?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            </div>
                            {/* Attendance Image Indicator */}
                            {record.stepInImage && (
                              <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5">
                                <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm md:text-base">{record.employeeId?.name || 'N/A'}</div>
                            <div className="text-xs md:text-sm text-secondary-500">{record.employeeId?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-secondary-400" />
                          <span className="text-sm">{new Date(record.stepIn).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className={`badge badge-sm ${
                          record.shift === 'morning' ? 'badge-primary' :
                          record.shift === 'evening' ? 'badge-secondary' :
                          'badge-accent'
                        }`}>
                          {record.shift || 'N/A'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-sm">
                          {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-sm">
                          {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell min-w-64">
                        <LocationDisplay
                          latitude={record.latitude}
                          longitude={record.longitude}
                          address={record.address}
                          size="small"
                          showCoordinates={false}
                          showMapLink={false}
                        />
                      </td>
                      <td className="hidden xl:table-cell">
                        <div className="max-w-xs">
                          {record.note ? (
                            <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded border">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {record.note}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No remarks</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-sm text-xs ${
                          record.stepIn ? 'badge-success' : 'badge-success'
                        }`}>
                          {record.stepIn ? 'Present' : 'Present'}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditAttendance(record)}
                              className="btn btn-ghost btn-xs"
                              title="Edit Attendance Record"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAttendance(record._id)}
                              className="btn btn-ghost btn-xs text-red-600 hover:text-red-700"
                              title="Delete Attendance Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Pagination Controls */}
      {filteredData.length > 0 && (
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            {/* Pagination Info and Controls */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">
                  Showing
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {((currentPage - 1) * itemsPerPage) + 1}
                </span>
                <span className="text-sm text-gray-500">to</span>
                <span className="text-sm font-bold text-blue-600">
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}
                </span>
                <span className="text-sm text-gray-500">of</span>
                <span className="text-sm font-bold text-blue-600">
                  {filteredData.length}
                </span>
                <span className="text-sm text-gray-500">records</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="select select-bordered select-sm bg-white border-blue-300 focus:border-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                  <option value={200}>200 per page</option>
                </select>
              </div>
            </div>
            
            {/* Pagination Navigation */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                {/* First Page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="btn btn-outline btn-sm hover:btn-primary"
                      title="First page"
                    >
                      ««
                    </button>
                    {currentPage > 4 && <span className="text-gray-400">...</span>}
                  </>
                )}
                
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-outline btn-sm hover:btn-primary disabled:opacity-50"
                  title="Previous page"
                >
                  «
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`btn btn-sm ${
                          currentPage === pageNum 
                            ? 'btn-primary text-white' 
                            : 'btn-outline hover:btn-primary'
                        }`}
                        title={`Page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-outline btn-sm hover:btn-primary disabled:opacity-50"
                  title="Next page"
                >
                  »
                </button>
                
                {/* Last Page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="btn btn-outline btn-sm hover:btn-primary"
                      title="Last page"
                    >
                      »»
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Quick Jump to Page */}
          {totalPages > 10 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-gray-600">Jump to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                    setCurrentPage(page);
                  }}
                  className="input input-bordered input-sm w-20 text-center"
                />
                <span className="text-sm text-gray-500">of {totalPages}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        record={editingRecord}
        onSave={handleSaveAttendance}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default AttendanceManagement;
