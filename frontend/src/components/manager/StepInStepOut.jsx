import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    LogIn,
    LogOut,
    Users,
    Clock,
    Calendar,
    User,
    Search,
    RefreshCw,
    Camera,
    Check,
    X,
    RotateCcw,
    MapPin,
    AlertCircle,
    CheckCircle,
    Loader2,
    Upload,
    Timer,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';
import { api } from '../../services/api';
import { getLocationWithAutoFallback } from '../../utils/locationUtils';

const StepInStepOut = () => {
    const { user } = useAuth();
    const { primaryColor } = useCompanyTheme();

    // State for employees and attendance
    const [employees, setEmployees] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for step in/out functionality
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [stepType, setStepType] = useState('step-in');
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [facingMode, setFacingMode] = useState('user');
    const [cameraReady, setCameraReady] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [location, setLocation] = useState('');
    const [note, setNote] = useState('');
    const [shift, setShift] = useState('morning');
    const [status, setStatus] = useState('present');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Search and filter
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);

    // Video constraints for webcam
    const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: facingMode,
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch employees under this manager
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/employee/team');
            if (response.data && response.data.data) {
                setEmployees(response.data.data);
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            setError('Failed to fetch employees');
            toast.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch attendance data
    const fetchAttendance = useCallback(async () => {
        try {
            const response = await api.get('/api/attendence/');
            if (response.data && response.data.attendance) {
                setAttendanceList(response.data.attendance);
            } else {
                setAttendanceList([]);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to fetch attendance data');
        }
    }, []);

    // Get current location with fallback
    const getCurrentLocation = useCallback(async () => {
        try {
            const locationData = await getLocationWithAutoFallback();
            
            setLatitude(locationData.latitude.toString());
            setLongitude(locationData.longitude.toString());
            setLocation(locationData.address);

            if (locationData.isFallback) {
                toast.success('Using default location (Ahmedabad, Gujarat)');
                console.log('Using fallback location:', locationData.address);
            } else {
                toast.success('Location captured successfully!');
            }
        } catch (error) {
            console.error('Error getting location:', error);
            // Even if there's an error, use the fallback
            setLatitude("23.0341367");
            setLongitude("72.5723255");
            setLocation("Ahmedabad, Gujarat, India (Default)");
            toast.success('Using default location (Ahmedabad, Gujarat)');
        }
    }, []);

    // Convert coordinates to address
    const getAddressFromCoordinates = async (lat, lng) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
            );
            const data = await response.json();

            if (data.display_name) {
                const fullAddress = data.display_name;
                if (fullAddress.length > 100) {
                    const addressParts = fullAddress.split(', ');
                    return addressParts.slice(0, 6).join(', ');
                }
                return fullAddress;
            }

            if (data.address) {
                const address = data.address;
                const parts = [];

                if (address.road) parts.push(address.road);
                if (address.house_number) parts.push(address.house_number);
                if (address.suburb) parts.push(address.suburb);
                if (address.city) parts.push(address.city);
                if (address.state) parts.push(address.state);
                if (address.postcode) parts.push(address.postcode);

                if (parts.length > 0) {
                    return parts.join(', ');
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    };

    // Initialize data
    useEffect(() => {
        fetchEmployees();
        fetchAttendance();
        getCurrentLocation();
    }, [fetchEmployees, fetchAttendance, getCurrentLocation]);

    // Camera functions
    const capture = useCallback(() => {
        if (webcamRef.current && cameraReady) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
            setImageLoading(true);
        }
    }, [cameraReady]);

    const retake = () => {
        setCapturedImage(null);
        setImageLoading(false);
    };

    const switchCamera = () => {
        setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    };

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUri = e.target?.result;
            setCapturedImage(dataUri);
            setImageLoading(true);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    // Get employee status
    const getEmployeeStatus = (employeeId) => {
        const today = new Date().toDateString();

        const todayAttendance = attendanceList.find(a => {
            const isCurrentEmployee = a.employeeId?._id === employeeId || a.employeeId === employeeId;
            const isToday = new Date(a.stepIn).toDateString() === today;
            return isCurrentEmployee && isToday;
        });

        if (!todayAttendance) {
            return { status: 'not-clocked', text: 'Not Clocked', color: 'gray', image: null };
        }

        if (todayAttendance.stepIn && !todayAttendance.stepOut) {
            return {
                status: 'clocked-in',
                text: 'Clocked In',
                color: 'green',
                image: todayAttendance.stepInImage
            };
        }

        if (todayAttendance.stepIn && todayAttendance.stepOut) {
            return {
                status: 'clocked-out',
                text: 'Clocked Out',
                color: 'orange',
                image: todayAttendance.stepOutImage || todayAttendance.stepInImage
            };
        }

        return { status: 'not-clocked', text: 'Not Clocked', color: 'gray', image: null };
    };

    // Handle step in/out
    const handleStepInOut = async (employeeId, type) => {
        const employee = employees.find(emp => emp._id === employeeId);

        if (!employee) {
            toast.error('Employee not found');
            return;
        }

        const currentStatus = getEmployeeStatus(employeeId);

        if (type === 'step-in') {
            if (currentStatus.status === 'clocked-in') {
                toast.error(`${employee.name} is already clocked in. Please step out first.`);
                return;
            }
            setSelectedEmployee(employee);
            setStepType(type);
            setShowCamera(true);
            setLocation('');
            setNote('');
            setShift('morning');
        } else if (type === 'step-out') {
            if (currentStatus.status !== 'clocked-in') {
                toast.error(`${employee.name} is not currently clocked in.`);
                return;
            }
            if (window.confirm(`Are you sure you want to sign out ${employee.name}?`)) {
                await handleStepOut(employee);
            }
        }
    };

    // Handle step out without camera
    const handleStepOut = async (employee) => {
        try {
            setIsSubmitting(true);

            let finalLocation = 'Auto-generated location';
            if (latitude && longitude) {
                try {
                    const autoLocation = await getAddressFromCoordinates(latitude, longitude);
                    if (autoLocation) {
                        finalLocation = `Auto-detected: ${autoLocation}`;
                    }
                } catch (error) {
                    // Continue with default
                }
            }

            const today = new Date().toDateString();
            const todayAttendance = attendanceList.find(a => {
                const isCurrentEmployee = a.employeeId?._id === employee._id || a.employeeId === employee._id;
                const isToday = new Date(a.stepIn).toDateString() === today;
                return isCurrentEmployee && isToday && !a.stepOut;
            });

            if (!todayAttendance) {
                toast.error('No active attendance record found for this employee.');
                return;
            }

            const formData = new FormData();
            formData.append('attendanceId', todayAttendance._id);
            formData.append('longitude', parseFloat(longitude) || 0);
            formData.append('latitude', parseFloat(latitude) || 0);
            formData.append('address', finalLocation);
            formData.append('note', 'Step out via manager');
            formData.append('status', 'present');

            const response = await api.post('/api/attendence/step-out', formData);

            if (response.data.success) {
                toast.success(`${employee.name} successfully clocked out!`);
                await fetchAttendance();
                await fetchEmployees();
            } else {
                toast.error(response.data.message || 'Failed to clock out employee');
            }
        } catch (error) {
            console.error('Step out error:', error);
            toast.error('Failed to clock out employee. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit attendance with photo
    const submitAttendance = async () => {
        if (!capturedImage || !selectedEmployee) {
            toast.error('Please capture a photo first.');
            return;
        }

        if (!shift) {
            toast.error('Please select a shift.');
            return;
        }

        let finalLocation = location.trim();
        if (!finalLocation && latitude && longitude) {
            try {
                const autoLocation = await getAddressFromCoordinates(latitude, longitude);

                if (autoLocation) {
                    finalLocation = `Auto-detected: ${autoLocation}`;
                    setLocation(finalLocation);
                    toast.success(`Location auto-detected: ${autoLocation}`);
                } else {
                    finalLocation = 'Location not available';
                    toast.error('Could not detect location from GPS coordinates');
                }
            } catch (error) {
                console.error('Error in auto-location:', error);
                finalLocation = 'Location not available';
                toast.error('Error detecting location from GPS');
            }
        } else if (!finalLocation) {
            finalLocation = 'Location not provided';
        }

        try {
            setIsSubmitting(true);

            const base64Data = capturedImage.split(',')[1];
            const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());

            const file = new File([blob], `attendance_${selectedEmployee._id}_${Date.now()}.jpg`, {
                type: 'image/jpeg',
            });

            const formData = new FormData();
            formData.append('employeeId', selectedEmployee._id);
            formData.append('managerId', user._id);
            formData.append('companyId', user.companyId);
            formData.append('shift', shift);
            formData.append('status', status);
            formData.append('longitude', parseFloat(longitude) || 0);
            formData.append('latitude', parseFloat(latitude) || 0);
            formData.append('address', finalLocation);
            formData.append('note', note);

            if (stepType === 'step-in') {
                formData.append('stepInImage', file);
            }

            let response;
            if (stepType === 'step-in') {
                response = await api.post('/api/attendence/step-in', formData);
            } else {
                response = await api.post('/api/attendence/step-out', formData);
            }

            if (response.data.success) {
                toast.success(`${selectedEmployee.name} successfully ${stepType === 'step-in' ? 'clocked in' : 'clocked out'}!`);
            } else {
                toast.error(response.data.message || `Failed to ${stepType} employee`);
                return;
            }

            setShowCamera(false);
            setCapturedImage(null);
            setSelectedEmployee(null);
            setLocation('');
            setNote('');

            await fetchAttendance();
            await fetchEmployees();
        } catch (error) {
            toast.error('Failed to submit attendance. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter employees
    const filteredEmployees = useMemo(() => {
        if (!Array.isArray(employees)) return [];

        return employees.filter(employee => {
            const matchesSearch = debouncedSearchTerm === '' ||
                employee.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                employee.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

            const employeeStatus = getEmployeeStatus(employee._id);
            const matchesStatus = statusFilter === 'all' || employeeStatus.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [employees, debouncedSearchTerm, statusFilter, attendanceList]);

    // Statistics
    const stats = {
        total: Array.isArray(employees) ? employees.length : 0,
        clockedIn: Array.isArray(employees) ? employees.filter(emp => getEmployeeStatus(emp._id).status === 'clocked-in').length : 0,
        clockedOut: Array.isArray(employees) ? employees.filter(emp => getEmployeeStatus(emp._id).status === 'clocked-out').length : 0,
        notClocked: Array.isArray(employees) ? employees.filter(emp => getEmployeeStatus(emp._id).status === 'not-clocked').length : 0,
    };

    return (
        <div className="space-y-4 sm:space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                        Step In/Step Out
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                        Manage employee attendance with photo verification
                    </p>
                </div>

                {/* Manual Refresh Button */}
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <button
                        onClick={async () => {
                            try {
                                console.log('Manual refresh triggered');
                                await Promise.all([
                                    fetchEmployees(),
                                    fetchAttendance()
                                ]);
                                toast.success('Data refreshed successfully');
                            } catch (error) {
                                console.error('Manual refresh failed:', error);
                                toast.error('Failed to refresh data. Please check your connection.');
                            }
                        }}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation min-h-[44px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                Refresh Data
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            <p className="text-xs sm:text-sm opacity-90">Total Employees</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.total}</p>
                        </div>
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 opacity-80 mt-2 sm:mt-0" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            <p className="text-xs sm:text-sm opacity-90">Clocked In</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.clockedIn}</p>
                        </div>
                        <LogIn className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 opacity-80 mt-2 sm:mt-0" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            <p className="text-xs sm:text-sm opacity-90">Clocked Out</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.clockedOut}</p>
                        </div>
                        <LogOut className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 opacity-80 mt-2 sm:mt-0" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-3 sm:p-4 lg:p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            <p className="text-xs sm:text-sm opacity-90">Not Clocked</p>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{stats.notClocked}</p>
                        </div>
                        <Clock className="h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 opacity-80 mt-2 sm:mt-0" />
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search employees by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                            />
                        </div>
                    </div>
                    <div className="sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                        >
                            <option value="all">All Status</option>
                            <option value="not-clocked">Not Clocked</option>
                            <option value="clocked-in">Clocked In</option>
                            <option value="clocked-out">Clocked Out</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Employee Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredEmployees.map(employee => {
                    const status = getEmployeeStatus(employee._id);
                    const displayImage = status.image || employee.photo;

                    return (
                        <div key={employee._id} className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:shadow-xl hover:scale-105 transform transition-all duration-300 group">
                            {/* Enhanced Employee Info */}
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {displayImage ? (
                                            <img
                                                src={displayImage}
                                                alt={employee.name}
                                                className="w-16 h-16 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ${displayImage ? 'hidden' : ''}`}>
                                            {employee.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                    {/* Enhanced Attendance Image Indicator */}
                                    {status.image && (
                                        <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                                            <Camera className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg text-gray-900 truncate">{employee.name}</h3>
                                    <p className="text-sm text-gray-500 truncate">{employee.email}</p>
                                    <p className="text-xs text-gray-400 capitalize">{employee.shift} Shift</p>
                                </div>
                            </div>

                            {/* Enhanced Status Badge */}
                            <div className="mb-4">
                                <span className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-full ${status.color === 'green' ? 'bg-green-100 text-green-800' :
                                        status.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {status.text}
                                </span>
                                {status.status === 'clocked-in' && (
                                    <div className="mt-2 text-xs text-green-600 font-medium flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Currently working
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="space-y-2">
                                {status.status === 'not-clocked' && (
                                    <button
                                        onClick={() => handleStepInOut(employee._id, 'step-in')}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                        disabled={loading}
                                    >
                                        <LogIn className="h-4 w-4" />
                                        <span>Step In</span>
                                    </button>
                                )}
                                {status.status === 'clocked-out' && (
                                    <button
                                        onClick={() => handleStepInOut(employee._id, 'step-in')}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                        disabled={loading}
                                    >
                                        <LogIn className="h-4 w-4" />
                                        <span>Step In Again</span>
                                    </button>
                                )}
                                {status.status === 'clocked-in' && (
                                    <button
                                        onClick={() => handleStepInOut(employee._id, 'step-out')}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                        disabled={loading || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Signing Out...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogOut className="h-4 w-4" />
                                                <span>Step Out</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredEmployees.length === 0 && (
                <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
                    <p className="text-gray-600">No employees match your search criteria.</p>
                </div>
            )}

            {/* Enhanced Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Enhanced Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                                        <Camera className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold">
                                            {stepType === 'step-in' ? 'Step In' : 'Step Out'} - {selectedEmployee?.name}
                                        </h3>
                                        <p className="text-blue-100 text-sm sm:text-base">Capture photo and enter details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCamera(false);
                                        setCapturedImage(null);
                                        setSelectedEmployee(null);
                                    }}
                                    className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Camera/Image Content */}
                        <div className="p-6">
                            <div className="relative mb-6">
                                {!capturedImage ? (
                                    <div className="relative">
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={videoConstraints}
                                            className="w-full h-80 object-cover rounded-lg"
                                            onUserMedia={() => setCameraReady(true)}
                                        />

                                        {/* Enhanced Camera Controls */}
                                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                                            <button
                                                onClick={switchCamera}
                                                className="p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
                                                title="Switch Camera"
                                            >
                                                <RotateCcw className="h-5 w-5 text-gray-700" />
                                            </button>

                                            <button
                                                onClick={capture}
                                                disabled={!cameraReady}
                                                className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 hover:scale-110 transition-all duration-200"
                                                title="Capture Photo"
                                            >
                                                <Camera className="h-6 w-6 text-white" />
                                            </button>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
                                                title="Upload Photo"
                                            >
                                                <Upload className="h-5 w-5 text-gray-700" />
                                            </button>
                                        </div>

                                        {!cameraReady && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                                <div className="flex flex-col items-center gap-2 text-white">
                                                    <Loader2 className="h-8 w-8 animate-spin" />
                                                    <p className="text-sm">Initializing camera...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={capturedImage}
                                            alt="Captured attendance"
                                            className="w-full h-80 object-cover rounded-lg"
                                            onLoad={() => setImageLoading(false)}
                                        />

                                        {/* Image Controls */}
                                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                                            <button
                                                onClick={retake}
                                                className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white"
                                            >
                                                <RotateCcw className="h-5 w-5 text-gray-700" />
                                            </button>

                                            <button
                                                onClick={submitAttendance}
                                                disabled={isSubmitting}
                                                className="p-4 bg-green-600 rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                                ) : (
                                                    <Check className="h-6 w-6 text-white" />
                                                )}
                                            </button>
                                        </div>

                                        {imageLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Form Fields */}
                            {capturedImage && (
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                                            Attendance Details
                                        </h4>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Location <span className="text-blue-600 text-xs">(Optional - will auto-detect from GPS)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    placeholder="Enter your current location or leave empty for auto-detection..."
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                                                <select
                                                    value={shift}
                                                    onChange={(e) => setShift(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                >
                                                    <option value="morning">Morning</option>
                                                    <option value="evening">Evening</option>
                                                    <option value="night">Night</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                required
                                            >
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="weekoff">Week Off</option>
                                            </select>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Add any additional notes..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                                                rows="3"
                                            />
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 bg-white rounded-lg p-3">
                                            <span className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                Lat: {latitude || '...'}
                                            </span>
                                            <span className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                Lng: {longitude || '...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Instructions and Actions */}
                        <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-4">
                                    {!capturedImage
                                        ? 'Position your face in the camera and tap the camera button to capture, or upload a photo'
                                        : 'Review your photo and fill in the details above to confirm'
                                    }
                                </p>
                                
                                {capturedImage && (
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <button
                                            onClick={retake}
                                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            <RotateCcw className="h-4 w-4 inline mr-2" />
                                            Retake Photo
                                        </button>
                                        <button
                                            onClick={submitAttendance}
                                            disabled={isSubmitting}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 font-medium"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-4 w-4 inline mr-2" />
                                                    Submit Attendance
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
            />
        </div>
    );
};

export default StepInStepOut;
