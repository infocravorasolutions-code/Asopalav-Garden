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
    ChevronRight,
    Smartphone,
    Monitor
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import Pagination from '../ui/Pagination';
import StandaloneAgGrid from '../ui/StandaloneAgGrid';
import { api, exportAPI } from '../../services/api';
import { getApiUrl } from '../../config/environment';
import CopyCellRenderer from '../ui/CopyCellRenderer';
import toast from 'react-hot-toast';
import { SHIFT_ENUM, shortShiftName } from '../../constants/shifts';

const ATTENDANCE_TIME_ZONE = 'Asia/Kolkata';

function toIstDateString(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: ATTENDANCE_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
}

function formatIstDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-US', {
        timeZone: ATTENDANCE_TIME_ZONE,
    });
}

const ManagerAttendance = () => {
    // Dynamic sites from backend
    const [sites, setSites] = useState([]);
    const [loadingSites, setLoadingSites] = useState(false);

    // Function to check if address matches a site or point
    const getLocationName = (address) => {
        if (!address) return 'N/A';
        
        // Check if the address matches any site address
        const matchedSite = sites.find(site => 
            address.toLowerCase().includes(site.address.toLowerCase()) ||
            address.toLowerCase().includes(site.name.toLowerCase())
        );
        
        if (matchedSite) {
            return matchedSite.name;
        }
        
        // Check if the address matches any point address within sites
        for (const site of sites) {
            if (site.points && site.points.length > 0) {
                const matchedPoint = site.points.find(point => 
                    address.toLowerCase().includes(point.address?.toLowerCase() || '') ||
                    address.toLowerCase().includes(point.name.toLowerCase())
                );
                if (matchedPoint) {
                    return `${site.name} - ${matchedPoint.name}`;
                }
            }
        }
        
        return address;
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
    const [viewMode, setViewMode] = useState('auto'); // 'auto', 'mobile', 'desktop'

    // Filter states - Default to today's date
    const [filters, setFilters] = useState({
        shift: '',
        status: '',
        assignedSite: '',
        assignedPoint: '',
        startDate: toIstDateString(new Date()),
        endDate: toIstDateString(new Date())
    });

    // Filter options
    const [filterOptions, setFilterOptions] = useState({
        shifts: Object.values(SHIFT_ENUM),
        statuses: ['present', 'absent', 'late'],
        sites: [],
        points: []
    });

    // Fetch sites from backend
    const fetchSites = useCallback(async () => {
        try {
            setLoadingSites(true);
            const response = await api.get('/sites');
            if (response.data && response.data.success && response.data.data) {
                setSites(response.data.data);
            } else {
                setSites([]);
            }
        } catch (error) {
            console.error('Error fetching sites:', error);
            setSites([]);
        } finally {
            setLoadingSites(false);
        }
    }, []);

    // Get current manager ID from localStorage
    const getCurrentManagerId = () => {
        const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('UserInfo from localStorage:', userInfo);
        const managerId = userInfo._id || userInfo.id;
        console.log('Manager ID found:', managerId);
        
        if (!managerId) {
            console.error('Manager ID not found in userInfo:', userInfo);
            toast.error('Manager ID not found. Please login again.');
            return null;
        }
        
        return managerId;
    };

    // Fetch attendance data for manager's employees
    const fetchAttendanceData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching attendance data for manager...');
            
            const currentManagerId = getCurrentManagerId();
            console.log('Current manager ID:', currentManagerId);
            
            if (!currentManagerId) {
                console.error('Manager ID is null, cannot fetch attendance data');
                setAttendanceData([]);
                return;
            }
            
            // Build query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('manager', currentManagerId);
            
            if (filters.startDate) {
                queryParams.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                queryParams.append('endDate', filters.endDate);
            }
            
            const response = await api.get(`/attendence?${queryParams.toString()}&limit=0`);
            console.log('Attendance response:', response);
            
            if (response.data && response.data.attendance) {
                setAttendanceData(response.data.attendance);
                console.log('Manager attendance data set:', response.data.attendance);
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
            // Fetch sites for filter dropdown
            console.log('Fetching sites...');
            const sitesResponse = await api.get('/sites');
            
            console.log('Sites response:', sitesResponse);
            console.log('Sites data:', sitesResponse.data);
            
            // Check if response.data is an array directly (from fetchInterceptor)
            if (Array.isArray(sitesResponse.data)) {
                console.log('Sites fetched successfully (direct array):', sitesResponse.data);
                setFilterOptions(prev => ({
                    ...prev,
                    sites: sitesResponse.data
                }));
            } else if (sitesResponse.data && sitesResponse.data.success && sitesResponse.data.data) {
                console.log('Sites fetched successfully (wrapped):', sitesResponse.data.data);
                setFilterOptions(prev => ({
                    ...prev,
                    sites: sitesResponse.data.data || []
                }));
            } else {
                console.error('Failed to fetch sites - response structure:', sitesResponse.data);
                setFilterOptions(prev => ({
                    ...prev,
                    sites: []
                }));
            }
        } catch (error) {
            console.error('Error fetching filter data:', error);
            toast.error('Failed to fetch sites data');
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
        if (filters.shift) {
            filtered = filtered.filter(record => record.shift === filters.shift);
        }

        if (filters.status) {
            filtered = filtered.filter(record => record.status === filters.status);
        }

        // Filter by assigned site
        if (filters.assignedSite) {
            filtered = filtered.filter(record => {
                const employee = record.employeeId;
                return employee?.assignedSiteId === filters.assignedSite;
            });
        }

        // Filter by assigned point
        if (filters.assignedPoint) {
            filtered = filtered.filter(record => {
                const employee = record.employeeId;
                if (!employee?.assignedPoints || !Array.isArray(employee.assignedPoints)) {
                    return false;
                }
                return employee.assignedPoints.some(point => point.pointId === filters.assignedPoint);
            });
        }

        if (filters.startDate) {
            filtered = filtered.filter((record) => toIstDateString(record.stepIn) >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter((record) => toIstDateString(record.stepIn) <= filters.endDate);
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

    // Fetch points for selected site
    const fetchSitePoints = useCallback(async (siteId) => {
        if (!siteId) {
            setFilterOptions(prev => ({
                ...prev,
                points: []
            }));
            return;
        }

        try {
            console.log('Fetching points for site:', siteId);
            const response = await api.get(`/sites/${siteId}`);
            
            console.log('Site response:', response);
            console.log('Site data:', response.data);
            
            // Check if response.data is a site object directly (from fetchInterceptor)
            if (response.data && response.data.points) {
                console.log('Site points fetched (direct object):', response.data.points);
                setFilterOptions(prev => ({
                    ...prev,
                    points: response.data.points || []
                }));
            } else if (response.data && response.data.success && response.data.data && response.data.data.points) {
                console.log('Site points fetched (wrapped):', response.data.data.points);
                setFilterOptions(prev => ({
                    ...prev,
                    points: response.data.data.points || []
                }));
            } else {
                console.error('Failed to fetch site points - response structure:', response.data);
                setFilterOptions(prev => ({
                    ...prev,
                    points: []
                }));
            }
        } catch (error) {
            console.error('Error fetching site points:', error);
            toast.error('Failed to fetch site points');
        }
    }, []);

    // Handle site filter change
    const handleSiteChange = (value) => {
        if (value.includes('_')) {
            // It's a point selection (siteId_pointId)
            const [siteId, pointId] = value.split('_');
            setFilters(prev => ({
                ...prev,
                assignedSite: siteId,
                assignedPoint: pointId
            }));
            fetchSitePoints(siteId);
        } else {
            // It's a site selection
            setFilters(prev => ({
                ...prev,
                assignedSite: value,
                assignedPoint: '' // Clear point filter when site changes
            }));
            fetchSitePoints(value);
        }
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            shift: '',
            status: '',
            assignedSite: '',
            assignedPoint: '',
            startDate: toIstDateString(new Date()),
            endDate: toIstDateString(new Date())
        });
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Apply filters
    const applyFilters = () => {
        fetchAttendanceData();
        setShowFilters(false);
    };

    // Export to Excel using direct API call
    const exportToExcel = async () => {
        try {
            setDownloading(true);
            
            const currentManagerId = getCurrentManagerId();
            if (!currentManagerId) {
                toast.error('Manager ID not found. Please login again.');
                return;
            }

            // Build query parameters
            const params = new URLSearchParams();
            params.append('manager', currentManagerId);
            
            if (filters.startDate) {
                params.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate);
            }
            if (filters.shift) {
                params.append('shift', filters.shift);
            }
            if (filters.status) {
                params.append('status', filters.status);
            }
            if (filters.assignedSite) {
                params.append('assignedSite', filters.assignedSite);
            }
            if (filters.assignedPoint) {
                params.append('assignedPoint', filters.assignedPoint);
            }

            const response = await api.get(`/attendence/export/excel?${params.toString()}`, {
                responseType: 'blob'
            });

            if (response.status === 200) {
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `team_attendance_${toIstDateString(new Date())}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success('Team attendance data exported to Excel successfully!');
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Failed to export attendance data to Excel');
        } finally {
            setDownloading(false);
        }
    };

    // Export to PDF using enhanced professional export
    const exportToPDF = async () => {
        try {
            setDownloading(true);

            if (!filteredData || filteredData.length === 0) {
                toast.error('No attendance data to export');
                return;
            }

            // Import the enhanced PDF export utility
            let exportAttendanceToPDF;
            try {
                const pdfUtils = await import('../../utils/pdfExportUtils');
                exportAttendanceToPDF = pdfUtils.exportAttendanceToPDF || pdfUtils.default?.exportAttendanceToPDF;

                if (!exportAttendanceToPDF) {
                    throw new Error('PDF export function not found');
                }
            } catch (error) {
                console.error('Error importing PDF utils:', error);
                toast.error('Failed to load PDF export utility. Please try again.');
                return;
            }

            // Create filename with timestamp
            const timestamp = toIstDateString(new Date());
            const filename = `team_attendance_${timestamp}.pdf`;

            const managerName = JSON.parse(localStorage.getItem('user') || '{}').name || 'Unknown';
            let subtitle = `Manager: ${managerName}`;
            if (filters.assignedSite) {
                const selectedSite = sites.find((site) => site._id === filters.assignedSite);
                const siteName = selectedSite?.name;
                if (siteName) {
                    subtitle += ` | Site: ${siteName}`;
                }
            }

            const exportData = filteredData.map((record) => ({
                ...record,
                reportSiteName: record.employeeId?.assignedSiteName || getLocationName(record.address) || 'Not Assigned',
            }));

            await exportAttendanceToPDF(exportData, filename, {
                title: 'Team Attendance Report',
                subtitle,
                dateRange: filters.startDate === filters.endDate 
                    ? `Date: ${filters.startDate}` 
                    : `Date Range: ${filters.startDate} to ${filters.endDate}`,
                totalRecords: filteredData.length
            });

            toast.success('Team attendance data exported to PDF successfully!');
        } catch (error) {
            console.error('Error exporting to PDF:', error);
            toast.error('Failed to export attendance data to PDF');
        } finally {
            setDownloading(false);
        }
    };

    // Determine view mode based on screen size
    const getViewMode = () => {
        if (viewMode === 'auto') {
            return window.innerWidth < 768 ? 'mobile' : 'desktop';
        }
        return viewMode;
    };

    // AG Grid column definitions for desktop view
    const getAgGridColumns = () => [
        {
            headerName: 'Employee',
            field: 'employee',
            width: 200,
            cellRenderer: (params) => {
                const employee = params.data.employeeId;
                return (
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                                {employee?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                                {employee?.email || ''}
                            </div>
                        </div>
                    </div>
                );
            },
            sortable: false,
            filter: false
        },
        {
            headerName: 'Date',
            field: 'date',
            width: 120,
            cellRenderer: (params) => {
                const stepIn = params.data.stepIn;
                return (
                    <div className="text-sm text-gray-900">
                        {stepIn ? formatIstDate(stepIn) : '-'}
                    </div>
                );
            }
        },
        {
            headerName: 'Site',
            field: 'site',
            width: 160,
            cellRenderer: (params) => (
                <div className="text-sm text-gray-900 truncate">
                    {params.data.employeeId?.assignedSiteName || 'Not Assigned'}
                </div>
            )
        },
        {
            headerName: 'Shift',
            field: 'shift',
            width: 100,
            cellRenderer: (params) => {
                const shiftLabel = shortShiftName(params.data.shift);
                const getShiftColor = (label) => {
                    switch (label) {
                        case 'Morning': return 'bg-blue-100 text-blue-800';
                        case 'Evening': return 'bg-orange-100 text-orange-800';
                        case 'Night': return 'bg-purple-100 text-purple-800';
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(shiftLabel)}`}>
                        {shiftLabel || 'N/A'}
                    </span>
                );
            }
        },
        {
            headerName: 'Clock In',
            field: 'clockIn',
            width: 120,
            cellRenderer: (params) => {
                const stepIn = params.data.stepIn;
                return (
                    <div className="text-sm text-gray-900">
                        {stepIn ? new Date(stepIn).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                        }) : '-'}
                    </div>
                );
            }
        },
        {
            headerName: 'Clock Out',
            field: 'clockOut',
            width: 120,
            cellRenderer: (params) => {
                const stepOut = params.data.stepOut;
                return (
                    <div className="text-sm text-gray-900">
                        {stepOut ? new Date(stepOut).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'Asia/Kolkata'
                        }) : '-'}
                    </div>
                );
            }
        },
        {
            headerName: 'Status',
            field: 'status',
            width: 100,
            cellRenderer: (params) => {
                const status = params.data.status;
                const getStatusColor = (status) => {
                    switch (status) {
                        case 'present': return 'bg-green-100 text-green-800';
                        case 'absent': return 'bg-red-100 text-red-800';
                        case 'late': return 'bg-orange-100 text-orange-800';
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {status || 'N/A'}
                    </span>
                );
            }
        },
        {
            headerName: 'Location',
            field: 'location',
            width: 200,
            cellRenderer: (params) => {
                const address = params.data.address;
                const locationName = getLocationName(address);
                return (
                    <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="truncate text-sm text-gray-900" title={locationName}>
                            {locationName.length > 20 
                                ? `${locationName.substring(0, 20)}...` 
                                : locationName
                            }
                        </span>
                    </div>
                );
            }
        }
    ];

    // Mobile Card View Component
    const MobileCardView = ({ data, loading }) => {
        const [currentPage, setCurrentPage] = useState(1);
        const itemsPerPage = 5;
        const totalPages = Math.ceil(data.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = data.slice(startIndex, endIndex);

        if (loading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <Loading />
                </div>
            );
        }

        if (data.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                    <p className="text-sm text-gray-600 mb-4">No records found for the selected criteria.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Cards */}
                <div className="space-y-3">
                    {paginatedData.map((record, index) => {
                        const employee = record.employeeId;
                        const getStatusColor = (status) => {
                            switch (status) {
                                case 'present': return 'bg-green-100 text-green-800 border-green-200';
                                case 'absent': return 'bg-red-100 text-red-800 border-red-200';
                                case 'late': return 'bg-orange-100 text-orange-800 border-orange-200';
                                default: return 'bg-gray-100 text-gray-800 border-gray-200';
                            }
                        };
                        const shiftLabel = shortShiftName(record.shift);
                        const getShiftColor = (label) => {
                            switch (label) {
                                case 'Morning': return 'bg-blue-100 text-blue-800';
                                case 'Evening': return 'bg-orange-100 text-orange-800';
                                case 'Night': return 'bg-purple-100 text-purple-800';
                                default: return 'bg-gray-100 text-gray-800';
                            }
                        };

                        return (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                {/* Employee Header */}
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="flex-shrink-0 h-12 w-12">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                            {employee?.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                            {employee?.name || 'Unknown'}
                                        </h3>
                                        <p className="text-sm text-gray-500 truncate">
                                            {employee?.email || ''}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end space-y-1">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.status)}`}>
                                            {record.status || 'N/A'}
                                        </span>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShiftColor(shiftLabel)}`}>
                                            {shiftLabel || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                {/* Attendance Details */}
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Date</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {record.stepIn ? formatIstDate(record.stepIn) : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Clock In</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {record.stepIn ? new Date(record.stepIn).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'Asia/Kolkata'
                                            }) : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Clock Out</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {record.stepOut ? new Date(record.stepOut).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
                                                timeZone: 'Asia/Kolkata'
                                            }) : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Site</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {employee?.assignedSiteName || 'Not Assigned'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Location</p>
                                        <div className="flex items-center">
                                            <MapPin className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                            <p className="text-sm font-medium text-gray-900 truncate" title={getLocationName(record.address)}>
                                                {getLocationName(record.address).length > 15 
                                                    ? `${getLocationName(record.address).substring(0, 15)}...` 
                                                    : getLocationName(record.address)
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-500">
                            {data.length} records
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Load data on component mount
    useEffect(() => {
        fetchFilterData();
        fetchSites();
        fetchAttendanceData();
    }, [fetchAttendanceData, fetchFilterData, fetchSites]);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Team Attendance Report</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                        View and download your team's attendance for {filters.startDate === filters.endDate ? `today (${filters.startDate})` : `${filters.startDate} to ${filters.endDate}`}
                    </p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2 mb-4 sm:mb-0">
                    <span className="text-sm text-gray-600 hidden sm:block">View:</span>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('auto')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'auto' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Auto
                        </button>
                        <button
                            onClick={() => setViewMode('mobile')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'mobile' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Smartphone className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('desktop')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                viewMode === 'desktop' 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Monitor className="h-4 w-4" />
                        </button>
                    </div>
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
                            onClick={exportToExcel}
                            disabled={downloading || filteredData.length === 0}
                            variant="outline"
                            className="flex items-center space-x-2 w-full sm:w-auto"
                        >
                            {downloading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    <span>Export Excel</span>
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={exportToPDF}
                            disabled={downloading || filteredData.length === 0}
                            variant="outline"
                            className="flex items-center space-x-2 w-full sm:w-auto"
                        >
                            {downloading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <FileText className="h-4 w-4" />
                                    <span>Export PDF</span>
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
                            {/* Assigned Site Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Site/Point</label>
                                <select
                                    value={filters.assignedSite}
                                    onChange={(e) => handleSiteChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Sites & Points</option>
                                    {filterOptions.sites.map(site => (
                                        <React.Fragment key={site._id}>
                                            <option value={site._id} className="font-semibold">
                                                📍 {site.name} ({site.siteCode})
                                            </option>
                                            {site.points && site.points.length > 0 && site.points.map((point) => (
                                                <option key={point._id} value={`${site._id}_${point._id}`}>
                                                    &nbsp;&nbsp;• {point.name} ({point.pointCode})
                                                </option>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </select>
                            </div>

                            {/* Assigned Point Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Point</label>
                                <select
                                    value={filters.assignedPoint}
                                    onChange={(e) => handleFilterChange('assignedPoint', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={!filters.assignedSite}
                                >
                                    <option value="">All Points</option>
                                    {filterOptions.points.map(point => (
                                        <option key={point._id} value={point._id}>
                                            {point.name} ({point.code})
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

            {/* Attendance Records - Responsive Layout */}
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
                                    ? `No attendance records found for your team for ${filters.startDate === filters.endDate ? 'today' : 'the selected date range'}. Try refreshing the data.`
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
                    ) : getViewMode() === 'mobile' ? (
                        // Mobile View - Cards
                        <div className="p-4 h-full">
                            <MobileCardView
                                data={filteredData}
                                loading={loading}
                            />
                        </div>
                    ) : (
                        // Desktop View - AG Grid
                        <div className="p-4 h-full">
                            <StandaloneAgGrid
                                data={filteredData}
                                loading={loading}
                                columnDefs={getAgGridColumns()}
                                title="Team Attendance"
                                subtitle={`${filteredData.length} records found`}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ManagerAttendance;
