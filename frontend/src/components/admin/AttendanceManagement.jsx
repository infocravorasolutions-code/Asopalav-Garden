import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Search,
    Filter,
    RefreshCw,
    FileText,
    Download,
    Clock,
    Users,
    UserCheck,
    UserX,
    MapPin,
    Calendar,
    TrendingUp,
    X,
    Save,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import Pagination from '../ui/Pagination';
import { adminAPI, api } from '../../services/api';
import CopyCellRenderer from '../ui/CopyCellRenderer';
import toast from 'react-hot-toast';


const AttendanceManagement = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 50,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        manager: '',
        employee: '',
        shift: '',
        status: '',
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [managers, setManagers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState({
        totalRecords: 0,
        present: 0,
        absent: 0,
        totalHours: 0,
        morningShift: 0,
        eveningShift: 0,
        nightShift: 0
    });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState(null);
    const [editForm, setEditForm] = useState({
        stepIn: '',
        stepOut: '',
        shift: 'morning',
        status: 'present',
        address: '',
        note: ''
    });


    // Fetch managers and employees for filter dropdowns
    const fetchFilterData = async () => {
        try {
            // Fetch managers
            const managersResponse = await adminAPI.getManagers();
            setManagers(managersResponse.managers || []);

            // Fetch employees
            const employeesResponse = await adminAPI.getEmployees();
            setEmployees(employeesResponse.employees || []);
        } catch (error) {
            console.error('Error fetching filter data:', error);
        }
    };

    // Fetch attendance data
    const fetchAttendanceData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            // Add pagination parameters
            params.append('page', page.toString());
            params.append('limit', pagination.limit.toString());

            console.log('🔍 [AttendanceManagement] Fetching attendance data...');
            const response = await adminAPI.getAttendance(params);
            console.log('📥 [AttendanceManagement] API Response:', response);

            const data = response.attendance || [];
            console.log('📊 [AttendanceManagement] Attendance data:', data);
            console.log('📊 [AttendanceManagement] Data length:', data.length);

            setAttendanceData(data);

            // Update pagination state
            if (response.pagination) {
                setPagination(response.pagination);
            }

            // Calculate summary
            const summary = calculateSummary(data);
            setSummary(summary);
            console.log('📈 [AttendanceManagement] Summary calculated:', summary);
        } catch (error) {
            console.error('❌ [AttendanceManagement] Error fetching attendance data:', error);
            console.error('❌ [AttendanceManagement] Error details:', error.response?.data || error.message);
            toast.error('Failed to fetch attendance data. Please check console for details.');
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit]);

    // Calculate summary statistics
    const calculateSummary = (data) => {
        const totalRecords = data.length;
        const present = data.filter(record => record.status === 'present').length;
        const absent = data.filter(record => record.status === 'absent').length;
        const totalHours = data.reduce((sum, record) => sum + (record.totalTime || 0), 0) / 60;

        const morningShift = data.filter(record => record.shift === 'morning').length;
        const eveningShift = data.filter(record => record.shift === 'evening').length;
        const nightShift = data.filter(record => record.shift === 'night').length;

        return {
            totalRecords,
            present,
            absent,
            totalHours: totalHours.toFixed(1),
            morningShift,
            eveningShift,
            nightShift
        };
    };

    // Filter data based on search term
    const filteredData = useMemo(() => {
        console.log('🔍 [AttendanceManagement] Filtering data...');
        console.log('📊 [AttendanceManagement] Original data length:', attendanceData.length);
        console.log('🔍 [AttendanceManagement] Search term:', searchTerm);

        if (!searchTerm) {
            console.log('📊 [AttendanceManagement] No search term, returning all data:', attendanceData.length);
            return attendanceData;
        }

        const filtered = attendanceData.filter(record => {
            const employee = record.employeeId;
            const searchLower = searchTerm.toLowerCase();
            return (
                employee?.name?.toLowerCase().includes(searchLower) ||
                employee?.email?.toLowerCase().includes(searchLower) ||
                record.address?.toLowerCase().includes(searchLower)
            );
        });

        console.log('📊 [AttendanceManagement] Filtered data length:', filtered.length);
        return filtered;
    }, [attendanceData, searchTerm]);

    // Export to Excel
    const exportToExcel = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const response = await api.get(`/api/attendence/export/excel?${params.toString()}`, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('Attendance data exported to Excel successfully!');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export attendance data to Excel');
        }
    };

    // Export to PDF
    const exportToPDF = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            // Add timestamp to prevent caching issues
            params.append('_t', Date.now().toString());

            const response = await api.get(`/api/admin/attendance/export/pdf?${params.toString()}`, {
                responseType: 'blob',
                timeout: 30000 // 30 second timeout
            });

            if (response.status === 200) {
                // Create a unique filename with timestamp
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `attendance_${timestamp}.pdf`;

                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                // Clean up after a short delay
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);

                toast.success('Attendance data exported to PDF successfully!');
            }
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            if (error.code === 'ECONNABORTED') {
                toast.error('PDF generation timed out. Please try again.');
            } else {
                toast.error('Failed to export attendance data to PDF');
            }
        }
    };

    // Handle edit attendance
    const handleEditAttendance = (attendance) => {
        setSelectedAttendance(attendance);
        setEditForm({
            stepIn: attendance.stepIn ? new Date(attendance.stepIn).toISOString().slice(0, 16) : '',
            stepOut: attendance.stepOut ? new Date(attendance.stepOut).toISOString().slice(0, 16) : '',
            shift: attendance.shift || 'morning',
            status: attendance.status || 'present',
            address: attendance.address || '',
            note: attendance.note || ''
        });
        setEditModalOpen(true);
    };

    // Handle delete attendance
    const handleDeleteAttendance = async (attendance) => {
        if (window.confirm('Are you sure you want to delete this attendance record?')) {
            try {
                await adminAPI.deleteAttendance(attendance._id);
                await fetchAttendanceData();
                alert('Attendance record deleted successfully');
            } catch (error) {
                console.error('Error deleting attendance:', error);
                alert('Error deleting attendance record');
            }
        }
    };

    // Handle save attendance changes
    const handleSaveAttendance = async () => {
        try {
            const updateData = {
                stepIn: editForm.stepIn ? new Date(editForm.stepIn) : null,
                stepOut: editForm.stepOut ? new Date(editForm.stepOut) : null,
                shift: editForm.shift,
                status: editForm.status,
                address: editForm.address,
                note: editForm.note
            };

            await adminAPI.updateAttendance(selectedAttendance._id, updateData);
            await fetchAttendanceData();
            setEditModalOpen(false);
            alert('Attendance record updated successfully');
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Error updating attendance record');
        }
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            manager: '',
            employee: '',
            shift: '',
            status: '',
            startDate: '',
            endDate: ''
        });
    };

    // Apply filters
    const applyFilters = () => {
        fetchAttendanceData();
        setShowFilters(false);
    };

    // Load data on component mount
    useEffect(() => {
        fetchFilterData();
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Attendance Management</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Monitor and manage employee attendance records
                    </p>
                </div>

                {/* Mobile Layout - Stacked buttons */}
                <div className="flex flex-col space-y-2 sm:hidden">
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => fetchAttendanceData()}
                            variant="outline"
                            className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] flex-1"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Refresh</span>
                        </Button>
                        <Button
                            onClick={exportToExcel}
                            className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] flex-1"
                        >
                            <FileText className="h-4 w-4" />
                            <span>Excel</span>
                        </Button>
                    </div>
                    <Button
                        onClick={exportToPDF}
                        variant="outline"
                        className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] w-full"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export PDF</span>
                    </Button>
                </div>

                {/* Desktop Layout - Horizontal buttons */}
                <div className="hidden sm:flex items-center space-x-2">
                    <Button
                        onClick={() => fetchAttendanceData()}
                        variant="outline"
                        className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </Button>
                    <Button
                        onClick={exportToExcel}
                        className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
                    >
                        <FileText className="h-4 w-4" />
                        <span>Export Excel</span>
                    </Button>
                    <Button
                        onClick={exportToPDF}
                        variant="outline"
                        className="flex items-center space-x-2 touch-manipulation min-h-[44px]"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export PDF</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Records</p>
                                <p className="text-lg sm:text-2xl font-bold text-gray-900">{summary.totalRecords}</p>
                                <p className="text-xs sm:text-sm text-gray-500">100% attendance rate</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Present</p>
                                <p className="text-lg sm:text-2xl font-bold text-green-600">{summary.present}</p>
                                <p className="text-xs sm:text-sm text-gray-500">{summary.totalHours}h total</p>
                            </div>
                            <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Absent</p>
                                <p className="text-lg sm:text-2xl font-bold text-red-600">{summary.absent}</p>
                                <p className="text-xs sm:text-sm text-gray-500">0% of total</p>
                            </div>
                            <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>


            </div>

            {/* Shift Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Morning Shift</p>
                                <p className="text-lg sm:text-2xl font-bold text-blue-600">{summary.morningShift}</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Evening Shift</p>
                                <p className="text-lg sm:text-2xl font-bold text-orange-600">{summary.eveningShift}</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600">Night Shift</p>
                                <p className="text-lg sm:text-2xl font-bold text-purple-600">{summary.nightShift}</p>
                            </div>
                            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by name, email, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full touch-manipulation min-h-[44px]"
                        />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] w-full sm:w-auto"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </Button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <Card className="p-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>

                        {/* Filter Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                                <select
                                    value={filters.manager}
                                    onChange={(e) => handleFilterChange('manager', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                <select
                                    value={filters.employee}
                                    onChange={(e) => handleFilterChange('employee', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Employees</option>
                                    {employees.map(employee => (
                                        <option key={employee._id} value={employee._id}>
                                            {employee.name} ({employee.empCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                                <select
                                    value={filters.shift}
                                    onChange={(e) => handleFilterChange('shift', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Shifts</option>
                                    <option value="morning">Morning</option>
                                    <option value="evening">Evening</option>
                                    <option value="night">Night</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                    <option value="half-day">Half Day</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={clearFilters}
                                className="px-4 py-2"
                            >
                                Clear
                            </Button>
                            <Button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* AG Grid */}
            <Card className="flex-1 min-h-0">
                <CardContent className="p-0 h-full flex flex-col">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loading />
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {attendanceData.length === 0
                                    ? 'No attendance records found. Try refreshing the data.'
                                    : 'No records match your current search criteria.'
                                }
                            </p>
                            <Button
                                onClick={fetchAttendanceData}
                                variant="outline"
                                className="flex items-center space-x-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                <span>Refresh Data</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0" style={{
                            height: window.innerWidth < 768 ? '400px' : '600px',
                            width: '100%',
                            minHeight: window.innerWidth < 768 ? '300px' : '400px',
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden'
                        }}>
                            {/* Simple HTML Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Employee
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Shift
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Clock In
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Clock Out
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredData.map((record, index) => {
                                            const employee = record.employeeId;
                                            const getStatusColor = (status) => {
                                                switch (status) {
                                                    case 'present': return 'bg-green-100 text-green-800';
                                                    case 'absent': return 'bg-red-100 text-red-800';
                                                    case 'late': return 'bg-orange-100 text-orange-800';
                                                    case 'half-day': return 'bg-blue-100 text-blue-800';
                                                    default: return 'bg-gray-100 text-gray-800';
                                                }
                                            };
                                            const getShiftColor = (shift) => {
                                                switch (shift) {
                                                    case 'morning': return 'bg-blue-100 text-blue-800';
                                                    case 'evening': return 'bg-orange-100 text-orange-800';
                                                    case 'night': return 'bg-purple-100 text-purple-800';
                                                    default: return 'bg-gray-100 text-gray-800';
                                                }
                                            };

                                            return (
                                                <tr key={record._id || index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <span className="text-blue-600 font-semibold text-sm">
                                                                        {employee?.name?.charAt(0) || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {employee?.name || 'N/A'}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {employee?.empCode || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(record.stepIn).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(record.shift)}`}>
                                                            {record.shift || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {record.stepIn ? new Date(record.stepIn).toLocaleTimeString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {record.stepOut ? new Date(record.stepOut).toLocaleTimeString() : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                                            {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={record.address || 'N/A'}>
                                                        {record.address || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => handleEditAttendance(record)}
                                                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteAttendance(record)}
                                                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <Pagination
                                pagination={pagination}
                                onPageChange={fetchAttendanceData}
                                loading={loading}
                                className="px-6 py-4 border-t border-gray-200"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Attendance Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Edit Attendance Record</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Employee: {selectedAttendance?.employeeId?.name || 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Employee Information */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <Input
                                            value={selectedAttendance?.employeeId?.name || 'N/A'}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <Input
                                            value={selectedAttendance?.employeeId?.email || 'N/A'}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                                        <Input
                                            value={selectedAttendance?.managerId?.name || 'N/A'}
                                            disabled
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {selectedAttendance?.status || 'Present'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Details */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Step In Time *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="datetime-local"
                                                value={editForm.stepIn}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, stepIn: e.target.value }))}
                                                className="pr-10"
                                            />
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Step Out Time
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="datetime-local"
                                                value={editForm.stepOut}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, stepOut: e.target.value }))}
                                                placeholder="mm/dd/yyyy --:-- --"
                                                className="pr-10"
                                            />
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Leave empty if employee hasn't clocked out</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Shift *
                                            </label>
                                            <select
                                                value={editForm.shift}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, shift: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="morning">Morning</option>
                                                <option value="evening">Evening</option>
                                                <option value="night">Night</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Status
                                            </label>
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="late">Late</option>
                                                <option value="half-day">Half Day</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location
                                        </label>
                                        <Input
                                            value={editForm.address}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                            placeholder="Enter location"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Note
                                        </label>
                                        <textarea
                                            value={editForm.note}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Enter any additional notes"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <Button
                                variant="outline"
                                onClick={() => setEditModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveAttendance}
                                className="flex items-center space-x-2"
                            >
                                <Save className="h-4 w-4" />
                                <span>Save Changes</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceManagement;
