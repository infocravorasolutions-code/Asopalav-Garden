import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    Calendar,
    Clock,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    Filter,
    Search,
    RefreshCw,
    User
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Pagination from '../ui/Pagination';
import { attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MyAttendance = () => {
    const { user } = useAuth();
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    console.log("attendanceRecords ==> ", attendanceRecords);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    const recordsPerPage = 10;

    // Fetch attendance records with pagination
    const fetchAttendanceRecords = async (page = 1) => {
        setLoading(true);
        try {
            console.log(`🔍 [MyAttendance] Fetching attendance for page: ${page}`);
            const response = await attendanceAPI.getEmployeeAttendance(user._id, { page, limit: recordsPerPage });
            console.log("📥 [MyAttendance] API Response:", response);

            setAttendanceRecords(response.data.attendance || []);

            // Update pagination state
            if (response.data.pagination) {
                setPagination(response.data.pagination);
                setTotalPages(response.data.pagination.totalPages);
                setTotalRecords(response.data.pagination.totalRecords);
            }

            console.log(`📊 [MyAttendance] Loaded ${response.data.attendance?.length || 0} records`);
        } catch (error) {
            console.error('❌ [MyAttendance] Error fetching attendance records:', error);
            toast.error('Failed to fetch attendance records');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) {
            fetchAttendanceRecords();
        }
    }, [user?._id]);

    // Filter and search records
    const filteredRecords = attendanceRecords.filter(record => {
        const employeeName = record.employeeId?.name || '';
        const managerName = record.managerId?.name || '';
        const address = record.address || '';

        const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.shift?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            address.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

        let matchesDate = true;
        if (dateFilter !== 'all') {
            const recordDate = new Date(record.stepIn || record.createdAt);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const thisWeek = new Date(today);
            thisWeek.setDate(thisWeek.getDate() - 7);
            const thisMonth = new Date(today);
            thisMonth.setMonth(thisMonth.getMonth() - 1);

            switch (dateFilter) {
                case 'today':
                    matchesDate = recordDate.toDateString() === today.toDateString();
                    break;
                case 'yesterday':
                    matchesDate = recordDate.toDateString() === yesterday.toDateString();
                    break;
                case 'thisWeek':
                    matchesDate = recordDate >= thisWeek;
                    break;
                case 'thisMonth':
                    matchesDate = recordDate >= thisMonth;
                    break;
                default:
                    matchesDate = true;
            }
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchAttendanceRecords(newPage);
    };

    // Use filtered records for display (server-side pagination already applied)
    const paginatedRecords = filteredRecords;
    console.log("📊 [MyAttendance] Displaying records:", paginatedRecords.length);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format time
    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Get status color and icon
    const getStatusInfo = (status) => {
        switch (status) {
            case 'present':
                return {
                    color: 'text-green-600 bg-green-100',
                    icon: CheckCircle,
                    text: 'Present'
                };
            case 'absent':
                return {
                    color: 'text-red-600 bg-red-100',
                    icon: XCircle,
                    text: 'Absent'
                };
            case 'late':
                return {
                    color: 'text-yellow-600 bg-yellow-100',
                    icon: AlertCircle,
                    text: 'Late'
                };
            default:
                return {
                    color: 'text-gray-600 bg-gray-100',
                    icon: AlertCircle,
                    text: status || 'Unknown'
                };
        }
    };

    // Calculate total hours
    const calculateTotalHours = (stepIn, stepOut) => {
        if (!stepIn || !stepOut) return 'N/A';
        const start = new Date(stepIn);
        const end = new Date(stepOut);
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${diffHours}h ${diffMinutes}m`;
    };

    // Export attendance data
    const exportAttendance = () => {
        const csvContent = [
            ['Date', 'Employee', 'Manager', 'Shift', 'Step In', 'Step Out', 'Total Hours', 'Status', 'Location', 'Coordinates'],
            ...filteredRecords.map(record => [
                formatDate(record.stepIn || record.createdAt),
                record.employeeId?.name || 'N/A',
                record.managerId?.name || 'N/A',
                record.shift || 'N/A',
                formatTime(record.stepIn),
                formatTime(record.stepOut),
                calculateTotalHours(record.stepIn, record.stepOut),
                record.status || 'N/A',
                record.address || 'N/A',
                record.latitude && record.longitude ? `${record.latitude}, ${record.longitude}` : 'N/A'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `my_attendance_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Attendance data exported successfully!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading attendance records...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="w-full flex flex-col space-y-2 p-2 sm:space-y-3 sm:p-3 lg:p-4">
                <div className="w-full">
                    <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 truncate">
                        My Attendance
                    </h1>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                        View and manage your attendance records
                    </p>
                </div>
                {/* <div className="w-full flex flex-col gap-2">
                    <Button
                        onClick={fetchAttendanceRecords}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 touch-manipulation min-h-[44px]"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={exportAttendance}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 touch-manipulation min-h-[44px]"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div> */}
            </div>

            {/* Filters */}
            {/* <div className="w-full p-2 sm:p-3 lg:p-4">
                <Card className="shadow-sm w-full">
                    <CardContent className="p-2 sm:p-3 lg:p-4">
                        <div className="w-full flex flex-col gap-3">
                           
                            <div className="w-full">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search records..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                                    />
                                </div>
                            </div>

                            <div className="w-full flex flex-col sm:flex-row gap-3">
                             
                                <div className="w-full sm:w-48">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="late">Late</option>
                                    </select>
                                </div>

                          
                                <div className="w-full sm:w-48">
                                    <select
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                                    >
                                        <option value="all">All Time</option>
                                        <option value="today">Today</option>
                                        <option value="yesterday">Yesterday</option>
                                        <option value="thisWeek">This Week</option>
                                        <option value="thisMonth">This Month</option>
                                    </select>
                                </div>

                   
                                <div className="w-full sm:w-auto">
                                    <Button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setStatusFilter('all');
                                            setDateFilter('all');
                                            setCurrentPage(1);
                                        }}
                                        variant="outline"
                                        className="w-full flex items-center justify-center gap-2 touch-manipulation min-h-[44px]"
                                    >
                                        <Filter className="h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div> */}

            {/* Attendance Records */}
            <div className="w-full flex-1 flex flex-col overflow-hidden p-2 sm:p-3 lg:p-4">
                <Card className="shadow-sm w-full h-full flex flex-col">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle className="flex items-center text-sm sm:text-base">
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Attendance Records ({filteredRecords.length} records)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4">
                        {paginatedRecords.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                                <p className="text-gray-600">
                                    {filteredRecords.length === 0 && attendanceRecords.length > 0
                                        ? 'No records match your current filters.'
                                        : 'No attendance records found for your account.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {paginatedRecords.map((record, index) => {
                                    const statusInfo = getStatusInfo(record.status);
                                    const StatusIcon = statusInfo.icon;

                                    return (
                                        <div
                                            key={record._id || index}
                                            className="w-full border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
                                        >
                                            {/* Header with Date and Status */}
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                                                <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="h-4 w-4 text-gray-500" />
                                                        <span className="font-semibold text-lg">
                                                            {formatDate(record.stepIn || record.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                            {record.shift || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                                    <StatusIcon className="h-4 w-4 mr-1" />
                                                    {statusInfo.text}
                                                </div>
                                            </div>

                                            {/* Employee and Manager Info */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-xs text-gray-500">Employee:</span>
                                                        <span className="ml-2 font-medium text-sm truncate">
                                                            {record.employeeId?.name || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-xs text-gray-500">Manager:</span>
                                                        <span className="ml-2 font-medium text-sm truncate">
                                                            {record.managerId?.name || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Time Information */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Clock className="h-4 w-4 text-blue-600" />
                                                        <span className="text-sm font-medium text-blue-900">Step In</span>
                                                    </div>
                                                    <span className="text-lg font-semibold text-blue-700">
                                                        {formatTime(record.stepIn)}
                                                    </span>
                                                </div>

                                                <div className="bg-red-50 p-3 rounded-lg">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Clock className="h-4 w-4 text-red-600" />
                                                        <span className="text-sm font-medium text-red-900">Step Out</span>
                                                    </div>
                                                    <span className="text-lg font-semibold text-red-700">
                                                        {formatTime(record.stepOut)}
                                                    </span>
                                                </div>

                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <Clock className="h-4 w-4 text-green-600" />
                                                        <span className="text-sm font-medium text-green-900">Total Hours</span>
                                                    </div>
                                                    <span className="text-lg font-semibold text-green-700">
                                                        {calculateTotalHours(record.stepIn, record.stepOut)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Location Information */}
                                            <div className="border-t pt-4">
                                                <div className="flex items-start space-x-2">
                                                    <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm text-gray-500">Location:</span>
                                                        <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                                                            {record.address || 'Location not available'}
                                                        </p>
                                                        {record.latitude && record.longitude && (
                                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                                Coordinates: {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        <Pagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            loading={loading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default MyAttendance;
