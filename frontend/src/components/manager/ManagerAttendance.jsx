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
import { api, exportAPI } from '../../services/api';
import { getApiUrl } from '../../config/environment';
import CopyCellRenderer from '../ui/CopyCellRenderer';
import toast from 'react-hot-toast';
import { SHIFT_ENUM } from '../../constants/shifts';

const ManagerAttendance = () => {
    // Predefined locations with full addresses that managers can select from dropdown
    const predefinedLocations = [
        { 
            name: 'Riverfront west side સી plan', 
            address: 'unnamed road, Ranna Park, - 380007, Gujarat, India'
        },
        { 
            name: 'Flower park Point 2 Gate 2', 
            address: 'Sabarmati Riverfront road, Kochrab, - 380043, Gujarat, India'
        },
        { 
            name: 'Flower park point 1 Gate 1', 
            address: 'Sabarmati Riverfront Road, Paldi, Navrangpura - 380006, Gujarat, India'
        },
        { 
            name: 'Flower park point 3 Gate 3', 
            address: 'Sabarmati Riverfront road, Kochrab, - 380043, Gujarat, India'
        },
        { 
            name: 'Shbhas Garden Park point 1 gate 2', 
            address: 'Sabarmati Riverfront Promenade, Dudheshwar, - 380014, Gujarat, India'
        },
        { 
            name: 'Shbhas Garden Point 2 Gate 1', 
            address: 'Riverfront Road, Dudheshwar, - 380027, Gujarat, India'
        }
    ];

    // Function to check if address matches a predefined location
    const getLocationName = (address) => {
        if (!address) return 'N/A';
        
        const location = predefinedLocations.find(loc => 
            address.toLowerCase().includes(loc.address.toLowerCase()) ||
            address.toLowerCase().includes(loc.name.toLowerCase())
        );
        
        return location ? location.name : address;
    };

    // State management
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Filter states - Default to today's date
    const [filters, setFilters] = useState({
        employee: '',
        shift: '',
        status: '',
        startDate: new Date().toISOString().split('T')[0], // Today's date
        endDate: new Date().toISOString().split('T')[0]    // Today's date
    });

    // Filter options
    const [filterOptions, setFilterOptions] = useState({
        employees: [],
        shifts: Object.values(SHIFT_ENUM),
        statuses: ['present', 'absent', 'late']
    });

    // Fetch attendance data for all employees
    const fetchAttendanceData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching all attendance data...');
            
            const response = await api.get('/attendence');
            console.log('Attendance response:', response);
            
            if (response.data && response.data.attendance) {
                // Filter by date range if specified
                let filteredData = response.data.attendance;
                
                if (filters.startDate || filters.endDate) {
                    filteredData = response.data.attendance.filter(record => {
                        const recordDate = new Date(record.stepIn);
                        const startDate = filters.startDate ? new Date(filters.startDate) : null;
                        const endDate = filters.endDate ? new Date(filters.endDate) : null;
                        
                        if (startDate && recordDate < startDate) return false;
                        if (endDate) {
                            endDate.setHours(23, 59, 59, 999); // End of day
                            if (recordDate > endDate) return false;
                        }
                        return true;
                    });
                }
                
                setAttendanceData(filteredData);
                console.log('Attendance data set:', filteredData);
            } else {
                setAttendanceData([]);
                console.log('No attendance data found');
            }
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            toast.error('Failed to fetch attendance data');
            setAttendanceData([]);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    // Fetch filter data
    const fetchFilterData = useCallback(async () => {
        try {
            // Fetch employees for filter dropdown
            const employeesResponse = await api.get('/employee');
            if (employeesResponse.data && employeesResponse.data.employees) {
                setFilterOptions(prev => ({
                    ...prev,
                    employees: employeesResponse.data.employees
                }));
            }
        } catch (error) {
            console.error('Error fetching filter data:', error);
        }
    }, []);

    // Filter and search data
    const filteredData = useMemo(() => {
        let filtered = attendanceData;

        // Apply search term
        if (searchTerm) {
            filtered = filtered.filter(record => {
                const employee = record.employeeId;
                const employeeName = employee?.name || '';
                const employeeEmail = employee?.email || '';
                const location = record.address || '';
                
                return employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       location.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // Apply filters
        if (filters.employee) {
            filtered = filtered.filter(record => 
                record.employeeId?._id === filters.employee
            );
        }

        if (filters.shift) {
            filtered = filtered.filter(record => record.shift === filters.shift);
        }

        if (filters.status) {
            filtered = filtered.filter(record => record.status === filters.status);
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.stepIn);
                return recordDate >= startDate;
            });
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(record => {
                const recordDate = new Date(record.stepIn);
                return recordDate <= endDate;
            });
        }

        return filtered;
    }, [attendanceData, searchTerm, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Handle refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAttendanceData();
        setRefreshing(false);
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            employee: '',
            shift: '',
            status: '',
            startDate: '',
            endDate: ''
        });
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Apply filters
    const applyFilters = () => {
        fetchAttendanceData();
        setShowFilters(false);
    };

    // Download attendance data
    const handleDownload = async (format = 'excel') => {
        try {
            setDownloading(true);
            
            const downloadData = {
                attendance: filteredData,
                filters: filters,
                dateRange: {
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }
            };

            if (format === 'excel') {
                await exportAPI.exportAttendanceToExcel(downloadData);
                toast.success('Excel file downloaded successfully');
            } else if (format === 'pdf') {
                await exportAPI.exportAttendanceToPDF(downloadData);
                toast.success('PDF file downloaded successfully');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Failed to download file');
        } finally {
            setDownloading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchFilterData();
        fetchAttendanceData();
    }, [fetchAttendanceData, fetchFilterData]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Daily Attendance Report</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        View and download all employees' attendance for {filters.startDate === filters.endDate ? `today (${filters.startDate})` : `${filters.startDate} to ${filters.endDate}`}
                    </p>
                </div>

                {/* Mobile Layout - Stacked buttons */}
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Button
                        onClick={() => setShowFilters(!showFilters)}
                        variant="outline"
                        className="flex items-center space-x-2 w-full sm:w-auto"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                    </Button>

                    {/* Download Buttons */}
                    <div className="flex space-x-2">
                        <Button
                            onClick={() => handleDownload('excel')}
                            disabled={downloading || filteredData.length === 0}
                            variant="outline"
                            className="flex items-center space-x-2 w-full sm:w-auto"
                        >
                            {downloading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    <span>Downloading...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    <span>Excel</span>
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={() => handleDownload('pdf')}
                            disabled={downloading || filteredData.length === 0}
                            variant="outline"
                            className="flex items-center space-x-2 w-full sm:w-auto"
                        >
                            {downloading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    <span>Downloading...</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    <span>PDF</span>
                                </>
                            )}
                        </Button>
                    </div>
                    
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center space-x-2 w-full sm:w-auto"
                    >
                        {refreshing ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                <span>Refreshing...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                <span>Refresh</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Filter Attendance Records</span>
                            <Button
                                onClick={() => setShowFilters(false)}
                                variant="ghost"
                                size="sm"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Employee Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                                <select
                                    value={filters.employee}
                                    onChange={(e) => handleFilterChange('employee', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Employees</option>
                                    {filterOptions.employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.name} ({emp.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Shift Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                                <select
                                    value={filters.shift}
                                    onChange={(e) => handleFilterChange('shift', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Shifts</option>
                                    {filterOptions.shifts.map(shift => (
                                        <option key={shift} value={shift}>
                                            {shift.charAt(0).toUpperCase() + shift.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Status</option>
                                    {filterOptions.statuses.map(status => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Range Filters */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-end space-x-2">
                                <Button
                                    onClick={applyFilters}
                                    className="flex-1"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Apply Filters
                                </Button>
                                <Button
                                    onClick={clearFilters}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by employee name, email, or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {!loading && attendanceData.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600">Total Records</p>
                                    <p className="text-2xl font-bold text-gray-900">{attendanceData.length}</p>
                                </div>
                                <Calendar className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600">Present</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {attendanceData.filter(record => record.status === 'present').length}
                                    </p>
                                </div>
                                <UserCheck className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600">Absent</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {attendanceData.filter(record => record.status === 'absent').length}
                                    </p>
                                </div>
                                <UserX className="h-8 w-8 text-red-500" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600">Late</p>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {attendanceData.filter(record => record.status === 'late').length}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Attendance Records */}
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
                                    ? `No attendance records found for ${filters.startDate === filters.endDate ? 'today' : 'the selected date range'}. Try refreshing the data.`
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
                        <div className="flex flex-col h-full">
                            {/* Table Header */}
                            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-3">Employee</div>
                                    <div className="col-span-2">Date</div>
                                    <div className="col-span-1">Shift</div>
                                    <div className="col-span-2">Clock In</div>
                                    <div className="col-span-2">Clock Out</div>
                                    <div className="col-span-1">Status</div>
                                    <div className="col-span-1">Location</div>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="flex-1 overflow-y-auto">
                                {paginatedData.map((record, index) => {
                                    const employee = record.employeeId;
                                    const getStatusColor = (status) => {
                                        switch (status) {
                                            case 'present': return 'bg-green-100 text-green-800';
                                            case 'absent': return 'bg-red-100 text-red-800';
                                            case 'late': return 'bg-orange-100 text-orange-800';
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
                                        <div key={index} className="px-6 py-4 border-b border-gray-200 hover:bg-gray-50">
                                            <div className="grid grid-cols-12 gap-4 items-center">
                                                {/* Employee */}
                                                <div className="col-span-3">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                                {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </div>
                                                        </div>
                                                        <div className="ml-3 min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 truncate">
                                                                {employee?.name || 'Unknown'}
                                                            </div>
                                                            <div className="text-sm text-gray-500 truncate">
                                                                {employee?.email || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Date */}
                                                <div className="col-span-2">
                                                    <div className="text-sm text-gray-900">
                                                        {record.stepIn ? new Date(record.stepIn).toLocaleDateString() : '-'}
                                                    </div>
                                                </div>

                                                {/* Shift */}
                                                <div className="col-span-1">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(record.shift)}`}>
                                                        {record.shift || 'N/A'}
                                                    </span>
                                                </div>

                                                {/* Clock In */}
                                                <div className="col-span-2">
                                                    <div className="text-sm text-gray-900">
                                                        {record.stepIn ? new Date(record.stepIn).toLocaleTimeString() : '-'}
                                                    </div>
                                                </div>

                                                {/* Clock Out */}
                                                <div className="col-span-2">
                                                    <div className="text-sm text-gray-900">
                                                        {record.stepOut ? new Date(record.stepOut).toLocaleTimeString() : '-'}
                                                    </div>
                                                </div>

                                                {/* Status */}
                                                <div className="col-span-1">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                                        {record.status || 'N/A'}
                                                    </span>
                                                </div>

                                                {/* Location */}
                                                <div className="col-span-1">
                                                    <div className="flex items-center">
                                                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                        <span className="truncate max-w-32 text-sm text-gray-900" title={getLocationName(record.address)}>
                                                            {getLocationName(record.address).length > 15 
                                                                ? `${getLocationName(record.address).substring(0, 15)}...` 
                                                                : getLocationName(record.address)
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-3 border-t border-gray-200">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerAttendance;
