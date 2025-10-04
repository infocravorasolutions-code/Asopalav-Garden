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
// import { useCompanyTheme } from '../../contexts/CompanyThemeContext';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';
import { api } from '../../utils/fetchInterceptor';
import { getLocationWithAutoFallback } from '../../utils/locationUtils';
import { SHIFT_ENUM } from '../../constants/shifts';
import { attendanceAPI } from '../../services/api';

const StepInStepOut = () => {
    const { user } = useAuth();
    // const { primaryColor } = useCompanyTheme();

    // State for employees and attendance
    const [employees, setEmployees] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState(null);
    
    // Lazy loading states
    const [displayedEmployees, setDisplayedEmployees] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const itemsPerPage = 12; // Show 12 employees at a time

    // State for step in/out functionality
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [stepType, setStepType] = useState('step-in');
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [facingMode, setFacingMode] = useState('user');
    const [cameraReady, setCameraReady] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Enhanced loading states
    const [operationLoading, setOperationLoading] = useState(false);
    const [operationType, setOperationType] = useState('');
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    // Form data
    const [location, setLocation] = useState('');
    const [selectedLocationName, setSelectedLocationName] = useState('');
    const [note, setNote] = useState('');
    const [shift, setShift] = useState(SHIFT_ENUM.MORNING);
    const [status, setStatus] = useState('present');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Sites are now fetched dynamically from backend

    // Search and filter
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [siteFilter, setSiteFilter] = useState('all');
    const [pointFilter, setPointFilter] = useState('all');
    
    // Site and point data
    const [sites, setSites] = useState([]);
    const [loadingSites, setLoadingSites] = useState(false);
    const [selectedSitePoints, setSelectedSitePoints] = useState([]);
    const [loadingPoints, setLoadingPoints] = useState(false);

    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);

    // Video constraints for webcam - Mobile Optimized
    const videoConstraints = {
        width: { ideal: window.innerWidth < 768 ? 640 : 1280 },
        height: { ideal: window.innerWidth < 768 ? 480 : 720 },
        facingMode: facingMode,
        aspectRatio: { ideal: 4/3 }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch employees under this manager with attendance status
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/manager/team');
            console.log('👥 Manager Team API response:', response.data);
            
            if (response.data) {
                const employeesData = response.data.data || response.data;
                console.log('👥 Processed team members:', employeesData);
                console.log('👥 Team member IDs:', employeesData.map(emp => ({ 
                    name: emp.name, 
                    id: emp._id, 
                    idType: typeof emp._id,
                    status: emp.attendanceStatus?.status
                })));
                setEmployees(employeesData);
            } else {
                setEmployees([]);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            setError('Failed to fetch team members');
            toast.error('Failed to fetch team members');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch sites
    const fetchSites = useCallback(async () => {
        setLoadingSites(true);
        try {
            const response = await api.get('/sites');
            
            // Check if response.data is an array directly (from fetchInterceptor)
            if (Array.isArray(response.data)) {
                setSites(response.data);
                toast.success('Sites loaded successfully');
            } else if (response.data && response.data.success && response.data.data) {
                setSites(response.data.data || []);
                toast.success('Sites loaded successfully');
            } else {
                setSites([]);
                toast.error('No sites found');
            }
        } catch (error) {
            toast.error('Failed to load sites. Please try again.');
            setSites([]);
        } finally {
            setLoadingSites(false);
        }
    }, []);

    // Fetch points for selected site
    const fetchSitePoints = useCallback(async (siteId) => {
        if (!siteId) {
            setSelectedSitePoints([]);
            return;
        }
        
        setLoadingPoints(true);
        try {
            const response = await api.get(`/sites/${siteId}`);
            
            // Check if response.data is a site object directly (from fetchInterceptor)
            if (response.data && response.data.points) {
                setSelectedSitePoints(response.data.points || []);
                toast.success('Site points loaded successfully');
            } else if (response.data && response.data.success && response.data.data && response.data.data.points) {
                setSelectedSitePoints(response.data.data.points || []);
                toast.success('Site points loaded successfully');
            } else {
                setSelectedSitePoints([]);
                toast.error('No points found for this site');
            }
        } catch (error) {
            toast.error('Failed to load site points. Please try again.');
            setSelectedSitePoints([]);
        } finally {
            setLoadingPoints(false);
        }
    }, []);

    // Note: Attendance data is now fetched as part of team members with status

    // Get current location with fallback
    const getCurrentLocation = useCallback(async () => {
        setLocationLoading(true);
        try {
            const locationData = await getLocationWithAutoFallback();

            setLatitude(locationData.latitude.toString());
            setLongitude(locationData.longitude.toString());
            setLocation(locationData.address);

            if (locationData.isFallback) {
                toast.success('Using default location (Ahmedabad, Gujarat)');
                // Using fallback location
            } else {
                toast.success('Location captured successfully!');
            }
        } catch {
            // Error getting location
            // Even if there's an error, use the fallback
            setLatitude("23.0341367");
            setLongitude("72.5723255");
            setLocation("Ahmedabad, Gujarat, India (Default)");
            toast.success('Using default location (Ahmedabad, Gujarat)');
        } finally {
            setLocationLoading(false);
        }
    }, []);

    // Handle predefined location selection
    const handleLocationSelect = (selectedLocation) => {
        if (selectedLocation) {
            setSelectedLocationName(selectedLocation.name);
            setLatitude(selectedLocation.lat.toString());
            setLongitude(selectedLocation.lng.toString());
            
            // Display only the actual address from the point
            setLocation(selectedLocation.address);
            
            toast.success(`Location selected: ${selectedLocation.name}`);
        } else {
            setSelectedLocationName('');
            setLocation('');
            setLatitude('');
            setLongitude('');
            toast.success('Location cleared');
        }
    };

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
        } catch {
            return null;
        }
    };

     // Initialize data
     useEffect(() => {
         const initializeData = async () => {
             try {
                // Initializing StepInStepOut data
                 await Promise.all([
                     fetchEmployees(),
                     fetchSites()
                 ]);
                 console.log('StepInStepOut data initialized successfully');
             } catch (error) {
                // Error initializing data
                 toast.error('Failed to load initial data');
             }
         };

         initializeData();
     }, [fetchEmployees, fetchSites]);

    // Fetch points when site filter changes
    useEffect(() => {
        if (siteFilter && siteFilter !== 'all') {
            fetchSitePoints(siteFilter);
        } else {
            setSelectedSitePoints([]);
        }
    }, [siteFilter, fetchSitePoints]);

    // Auto-refresh data every 30 seconds to keep status up-to-date
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                console.log('Auto-refreshing team member data...');
                await fetchEmployees();
            } catch (error) {
                // Auto-refresh failed
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [fetchEmployees]);

    // Force refresh statistics when team member data changes
    useEffect(() => {
        console.log('🔄 Team member data changed, statistics will be recalculated');
    }, [employees]);

    // Force refresh function for manual updates
    const forceRefreshAttendance = useCallback(async () => {
        try {
            console.log('🔄 Force refreshing team member data...');
            await fetchEmployees();
            console.log('✅ Team member data force refreshed');
            toast.success('Data refreshed successfully');
        } catch (error) {
            // Force refresh failed
            toast.error('Failed to refresh data');
        }
    }, [fetchEmployees]);

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

    // Get employee status - now using backend-provided status
    const getEmployeeStatus = useCallback((employeeId) => {
        console.log('🔍 Getting employee status for:', employeeId);
        
        // Find employee in the employees array (which now includes attendanceStatus from backend)
        const employee = employees.find(emp => emp._id === employeeId);
        
        if (!employee) {
            console.log('❌ Employee not found in team members');
            return { status: 'not-clocked', text: 'Not Clocked', color: 'gray', image: null };
        }

        // Use the attendanceStatus provided by the backend
        if (employee.attendanceStatus) {
            console.log('✅ Using backend-provided status:', employee.attendanceStatus);
            return {
                status: employee.attendanceStatus.status,
                text: employee.attendanceStatus.text,
                color: employee.attendanceStatus.color,
                image: employee.attendanceStatus.image
            };
        }

        console.log('❌ No attendance status found, defaulting to not-clocked');
        return { status: 'not-clocked', text: 'Not Clocked', color: 'gray', image: null };
    }, [employees]);

    // Handle step in/out with loading states
    const handleStepInOut = async (employeeId, type) => {
        const employee = employees.find(emp => emp._id === employeeId);

        if (!employee) {
            toast.error('Team member not found');
            return;
        }

        setOperationLoading(true);
        setOperationType(type);

        try {
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
        } finally {
            setOperationLoading(false);
        }
    };

    // Handle step out without camera using new backend endpoint
    const handleStepOut = async (employee) => {
        try {
            setIsSubmitting(true);

            let finalLocation = 'Auto-generated location';
            if (latitude && longitude) {
                try {
                    const autoLocation = await getAddressFromCoordinates(latitude, longitude);
                    if (autoLocation) {
                        finalLocation = `${autoLocation}`;
                    }
                } catch {
                    // Continue with default
                }
            }

            // Use the new manager step-out endpoint
            const formData = new FormData();
            formData.append('employeeId', employee._id);
            formData.append('longitude', parseFloat(longitude) || 0);
            formData.append('latitude', parseFloat(latitude) || 0);
            formData.append('address', finalLocation);
            formData.append('note', 'Step out via manager');
            formData.append('status', 'present');

            // Use the regular post method - fetchInterceptor now handles FormData properly
            const response = await api.post('/manager/step-out', formData);

            if (response.success) {
                toast.success(`${employee.name} successfully clocked out!`);
                console.log('Refreshing data after successful step-out...');
                await fetchEmployees(); // Refresh team members with updated status
                console.log('Data refreshed after step-out');
            } else {
                toast.error(response.message || 'Failed to clock out employee');
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
        
        // If location is already set (from dropdown selection), use it
        if (finalLocation) {
            // Using selected location from dropdown
        } else if (latitude && longitude) {
            // Only try to get address from coordinates if no location is set
            try {
                const autoLocation = await getAddressFromCoordinates(latitude, longitude);

                if (autoLocation) {
                    finalLocation = `${autoLocation}`;
                    setLocation(finalLocation);
                    toast.success(`Location ${autoLocation}`);
                } else {
                    finalLocation = 'Location not available';
                    toast.error('Could not detect location from GPS coordinates');
                }
            } catch {
                finalLocation = 'Location not available';
                toast.error('Error detecting location from GPS');
            }
        } else {
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
            formData.append('shift', shift);
            formData.append('status', status);
            formData.append('longitude', parseFloat(longitude) || 0);
            formData.append('latitude', parseFloat(latitude) || 0);
            formData.append('address', finalLocation);
            formData.append('note', note);

            if (stepType === 'step-in') {
                formData.append('stepInImage', file);
            }

            // Debug: Log all FormData entries
            console.log("=== FormData Contents ===");
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
            console.log("=== End FormData ===");

            let response;
            if (stepType === 'step-in') {
                // Use the regular post method - fetchInterceptor now handles FormData properly
                response = await api.post('/manager/step-in', formData);
                console.log('Manager step in response:', response);
            } else {
                response = await attendanceAPI.stepOut(formData);
            }
            
            if (response.success === true) {
                toast.success(`${selectedEmployee.name} successfully ${stepType === 'step-in' ? 'clocked in' : 'clocked out'}!`);

                // Close modal first
                setShowCamera(false);
                setCapturedImage(null);
                setSelectedEmployee(null);
                setLocation('');
                setNote('');

                // Refresh data to get the latest status

                // Refresh team members to get updated status
                try {
                    await fetchEmployees();
                    console.log('Team member data refreshed successfully');
                } catch (error) {
                    toast.error('Data refresh failed, but operation was successful');
                }
            } else {
                toast.error(response.message || `Failed to ${stepType} employee`);
                return;
            }
        } catch (error) {
            toast.error('Failed to submit attendance. Please try again.');
            
            // Close modal even on error to prevent user from being stuck
            setShowCamera(false);
            setCapturedImage(null);
            setSelectedEmployee(null);
            setLocation('');
            setNote('');
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

            // Site filter
            const matchesSite = siteFilter === 'all' || 
                (employee.assignedSiteId && employee.assignedSiteId === siteFilter);

            // Point filter
            const matchesPoint = pointFilter === 'all' || 
                (employee.assignedPoints && employee.assignedPoints.some(point => 
                    point.pointId === pointFilter || point._id === pointFilter
                ));

            return matchesSearch && matchesStatus && matchesSite && matchesPoint;
        });
    }, [employees, debouncedSearchTerm, statusFilter, siteFilter, pointFilter, getEmployeeStatus]);

    // Lazy loading logic
    useEffect(() => {
        const startIndex = 0;
        const endIndex = currentPage * itemsPerPage;
        const newDisplayedEmployees = filteredEmployees.slice(startIndex, endIndex);
        
        setDisplayedEmployees(newDisplayedEmployees);
        setHasMore(endIndex < filteredEmployees.length);
    }, [filteredEmployees, currentPage, itemsPerPage]);

    // Load more employees
    const loadMoreEmployees = useCallback(() => {
        if (hasMore && !loading) {
            setCurrentPage(prev => prev + 1);
        }
    }, [hasMore, loading]);

    // Statistics - Updated to use consistent status values with memoization
    const stats = useMemo(() => {
        console.log('📊 Recalculating statistics...');
        console.log('Team members count:', employees.length);
        
        const total = Array.isArray(employees) ? employees.length : 0;
        const clockedIn = Array.isArray(employees) ? employees.filter(emp => {
            const status = getEmployeeStatus(emp._id);
            console.log(`Team member ${emp.name} status:`, status.status);
            return status.status === 'clocked-in';
        }).length : 0;
        const clockedOut = Array.isArray(employees) ? employees.filter(emp => {
            const status = getEmployeeStatus(emp._id);
            return status.status === 'clocked-out';
        }).length : 0;
        const notClocked = Array.isArray(employees) ? employees.filter(emp => {
            const status = getEmployeeStatus(emp._id);
            return status.status === 'not-clocked';
        }).length : 0;

        console.log('📈 Calculated stats:', { total, clockedIn, clockedOut, notClocked });
        
        return {
            total,
            clockedIn,
            clockedOut,
            notClocked
        };
    }, [employees, getEmployeeStatus]);

    return (
        <div className="space-y-4 sm:space-y-6 h-full flex flex-col relative">
            {/* Global Loading Overlay */}
            {operationLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {operationType === 'step-in' ? 'Processing Step In...' : 'Processing Step Out...'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Please wait while we process your request
                            </p>
                        </div>
                    </div>
                </div>
            )}

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

                 {/* Auto Location Detection and Manual Refresh */}
                 <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                     {/* Auto Location Detection Button */}
                     {/* <button
                         onClick={getCurrentLocation}
                         disabled={locationLoading}
                         className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors touch-manipulation min-h-[44px]"
                         title="Auto-detect current location"
                     >
                         {locationLoading ? (
                             <>
                                 <Loader2 className="h-4 w-4 animate-spin" />
                                 <span className="text-sm">Detecting...</span>
                             </>
                         ) : (
                             <>
                                 <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                 </svg>
                                 <span className="text-sm">Detect Auto Location</span>
                             </>
                         )}
                     </button> */}

                     {/* Manual Refresh Button */}
                     <button
                         onClick={forceRefreshAttendance}
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
                            <p className="text-xs sm:text-sm opacity-90">Total Team Members</p>
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
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search team members by name or email..."
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

                    {/* Site and Point Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Assigned Site
                            </label>
                            <select
                                value={siteFilter}
                                onChange={(e) => {
                                    setSiteFilter(e.target.value);
                                    setPointFilter('all'); // Reset point filter when site changes
                                }}
                                disabled={loadingSites}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation disabled:bg-gray-100"
                            >
                                <option value="all">All Sites</option>
                                {sites.map((site) => (
                                    <option key={site._id} value={site._id}>
                                        {site.name} ({site.siteCode})
                                    </option>
                                ))}
                            </select>
                            {loadingSites && (
                                <p className="text-xs text-gray-500 mt-1">Loading sites...</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Assigned Point
                            </label>
                            <select
                                value={pointFilter}
                                onChange={(e) => setPointFilter(e.target.value)}
                                disabled={loadingPoints || siteFilter === 'all'}
                                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation disabled:bg-gray-100"
                            >
                                <option value="all">All Points</option>
                                {selectedSitePoints.map((point) => (
                                    <option key={point._id} value={point._id}>
                                        {point.name} ({point.pointCode})
                                    </option>
                                ))}
                            </select>
                            {loadingPoints && (
                                <p className="text-xs text-gray-500 mt-1">Loading points...</p>
                            )}
                            {siteFilter === 'all' && (
                                <p className="text-xs text-gray-500 mt-1">Select a site first to filter by points</p>
                            )}
                        </div>
                    </div>

                    {/* Filter Summary */}
                    {(siteFilter !== 'all' || pointFilter !== 'all') && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-blue-800">
                                        Active Filters:
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSiteFilter('all');
                                        setPointFilter('all');
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Clear All
                                </button>
                            </div>
                            <div className="mt-2 text-xs text-blue-700">
                                {siteFilter !== 'all' && (
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                                        Site: {sites.find(s => s._id === siteFilter)?.name || 'Unknown'}
                                    </span>
                                )}
                                {pointFilter !== 'all' && (
                                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        Point: {selectedSitePoints.find(p => p._id === pointFilter)?.name || 'Unknown'}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Team Member Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {displayedEmployees.map(employee => {
                    console.log("🔍 Processing employee:", {
                        name: employee.name,
                        id: employee._id,
                        idType: typeof employee._id
                    });
                    const status = getEmployeeStatus(employee._id);
                    console.log("📊 Employee status result:", {
                        name: employee.name,
                        status: status.status,
                        text: status.text,
                        color: status.color
                    });
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
                                        disabled={loading || operationLoading}
                                    >
                                        {operationLoading && operationType === 'step-in' ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="h-4 w-4" />
                                                <span>Step In</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                {status.status === 'clocked-out' && (
                                    <button
                                        onClick={() => handleStepInOut(employee._id, 'step-in')}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                        disabled={loading || operationLoading}
                                    >
                                        {operationLoading && operationType === 'step-in' ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="h-4 w-4" />
                                                <span>Step In Again</span>
                                            </>
                                        )}
                                    </button>
                                )}
                                {status.status === 'clocked-in' && (
                                    <button
                                        onClick={() => handleStepInOut(employee._id, 'step-out')}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                        disabled={loading || isSubmitting || operationLoading}
                                    >
                                        {(isSubmitting || (operationLoading && operationType === 'step-out')) ? (
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

            {/* Load More Button */}
            {hasMore && displayedEmployees.length > 0 && (
                <div className="flex justify-center py-6">
                    <button
                        onClick={loadMoreEmployees}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <Users className="h-4 w-4" />
                                <span>Load More Team Members</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Empty State */}
            {displayedEmployees.length === 0 && !loading && (
                <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members Found</h3>
                    <p className="text-gray-600">No team members match your search criteria.</p>
                </div>
            )}

            {/* Mobile-Responsive Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-lg sm:rounded-xl w-full h-full sm:h-auto max-w-full sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-full sm:max-h-[95vh] md:max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
                         {/* Mobile-Optimized Header */}
                         <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
                             <div className="flex-1 min-w-0">
                                 <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                                     {stepType === 'step-in' ? 'Step In' : 'Step Out'} - {selectedEmployee?.name}
                                 </h3>
                                 <p className="text-xs sm:text-sm text-gray-600">Capture photo and enter details</p>
                             </div>
                             
                             {/* Auto Location Detection Button in Modal Header */}
                             <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                 <button
                                     onClick={getCurrentLocation}
                                     disabled={locationLoading}
                                     className="flex items-center justify-center px-2 sm:px-3 py-2 bg-blue-600 text-white border border-blue-200 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px]"
                                     title="Auto-detect current location"
                                 >
                                     {locationLoading ? (
                                         <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                     ) : (
                                         <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                         </svg>
                                     )}
                                 </button>
                                 
                                 <button
                                     onClick={() => {
                                         setShowCamera(false);
                                         setCapturedImage(null);
                                         setSelectedEmployee(null);
                                     }}
                                     className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors touch-manipulation min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center"
                                 >
                                     <X className="h-4 w-4 sm:h-5 sm:w-5" />
                                 </button>
                             </div>
                         </div>

                        {/* Mobile-Optimized Camera Section */}
                        <div className="p-2 sm:p-4 md:p-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ 
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#cbd5e1 #f1f5f9'
                        }}>
                            <div className="relative mb-4 sm:mb-6">
                                {!capturedImage ? (
                                    <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={videoConstraints}
                                            className="w-full h-full object-cover rounded-lg"
                                            onUserMedia={() => setCameraReady(true)}
                                        />

                                        {/* Mobile-Optimized Camera Controls */}
                                        <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                                            <button
                                                onClick={switchCamera}
                                                className="p-2 sm:p-2 md:p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-white transition-colors touch-manipulation min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
                                                title="Switch Camera"
                                            >
                                                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-700" />
                                            </button>

                                            <button
                                                onClick={capture}
                                                disabled={!cameraReady}
                                                className="p-3 sm:p-3 md:p-4 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-colors touch-manipulation min-h-[48px] min-w-[48px] sm:min-h-[56px] sm:min-w-[56px] flex items-center justify-center"
                                                title="Capture Photo"
                                            >
                                                <Camera className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                                            </button>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 sm:p-2 md:p-3 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-white transition-colors touch-manipulation min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
                                                title="Upload Photo"
                                            >
                                                <Upload className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-700" />
                                            </button>
                                        </div>

                                        {!cameraReady && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                                                <div className="flex flex-col items-center gap-2 text-white">
                                                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                                                    <p className="text-xs sm:text-sm">Initializing camera...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                                        <img
                                            src={capturedImage}
                                            alt="Captured attendance"
                                            className="w-full h-full object-cover rounded-lg"
                                            onLoad={() => setImageLoading(false)}
                                        />

                                        {/* Mobile-Optimized Image Controls */}
                                        <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                                            <button
                                                onClick={retake}
                                                className="p-2 sm:p-2 md:p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white transition-colors touch-manipulation min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
                                            >
                                                <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-700" />
                                            </button>

                                            <button
                                                onClick={submitAttendance}
                                                disabled={isSubmitting}
                                                className="p-3 sm:p-3 md:p-4 bg-green-600 rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50 transition-colors touch-manipulation min-h-[48px] min-w-[48px] sm:min-h-[56px] sm:min-w-[56px] flex items-center justify-center"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white animate-spin" />
                                                ) : (
                                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                                                )}
                                            </button>
                                        </div>

                                        {imageLoading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                                                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Enhanced Form Fields */}
                            <div className="space-y-4 sm:space-y-6">
                                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                                            Attendance Details
                                            {!capturedImage && (
                                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    Set before photo
                                                </span>
                                            )}
                                        </h4>

                                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select Site/Point <span className="text-blue-600 text-xs">(Optional)</span>
                                                </label>
                                                <select
                                                    value={selectedLocationName}
                                                    onChange={(e) => {
                                                        const selectedValue = e.target.value;
                                                        if (!selectedValue) {
                                                            handleLocationSelect(null);
                                                            return;
                                                        }

                                                        // Check if it's a site or point selection
                                                        const [type, id] = selectedValue.split('_');
                                                        
                                                        if (type === 'site') {
                                                            const selectedSite = sites.find(site => site._id === id);
                                                            if (selectedSite) {
                                                                handleLocationSelect({
                                                                    name: selectedSite.name,
                                                                    lat: selectedSite.coordinates?.latitude || 0,
                                                                    lng: selectedSite.coordinates?.longitude || 0,
                                                                    address: selectedSite.address
                                                                });
                                                            }
                                                        } else if (type === 'point') {
                                                            // Find the point across all sites
                                                            for (const site of sites) {
                                                                if (site.points && site.points.length > 0) {
                                                                    const point = site.points.find(p => p._id === id);
                                                                    if (point) {
                                                                        handleLocationSelect({
                                                                            name: `${site.name} - ${point.name}`,
                                                                            lat: point.coordinates?.latitude || site.coordinates?.latitude || 0,
                                                                            lng: point.coordinates?.longitude || site.coordinates?.longitude || 0,
                                                                            address: point.address || site.address
                                                                        });
                                                                        break;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                                                    disabled={loadingSites}
                                                >
                                                    <option value="">Choose a site or point...</option>
                                                    {sites.map((site) => (
                                                        <React.Fragment key={site._id}>
                                                            <option value={`site_${site._id}`} className="font-semibold">
                                                                📍 {site.name} ({site.siteCode})
                                                            </option>
                                                            {site.points && site.points.length > 0 && site.points.map((point) => (
                                                                <option key={point._id} value={`point_${point._id}`} className="ml-4">
                                                                    &nbsp;&nbsp;• {point.name} ({point.pointCode})
                                                                </option>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                </select>
                                                {loadingSites && (
                                                    <p className="text-xs text-gray-500 mt-1">Loading sites and points...</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 sm:mt-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Location <span className="text-blue-600 text-xs">(Auto-detected or manual entry)</span>
                                                </label>
                                                <div className="flex space-x-2">
                                                    <div className="flex-1 relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                                        </div>
                                                        <textarea
                                                            value={location}
                                                            onChange={(e) => setLocation(e.target.value)}
                                                            placeholder="Enter your current location or use auto-detect..."
                                                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base resize-none"
                                                            rows="2"
                                                        />
                                                    </div>
                                                    {/* <button
                                                        type="button"
                                                        onClick={getCurrentLocation}
                                                        disabled={locationLoading}
                                                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 min-w-[60px]"
                                                        title="Auto-detect current location"
                                                    >
                                                        {locationLoading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                <span className="text-sm">Detecting...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <span className="text-sm">Auto Detect</span>
                                                            </>
                                                        )}
                                                    </button> */}
                                                </div>
                                                {location && (
                                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center text-xs text-green-700">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                <span className="font-medium">Location set:</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setLocation('');
                                                                    setLatitude('');
                                                                    setLongitude('');
                                                                }}
                                                                className="text-xs text-red-600 hover:text-red-800 underline touch-manipulation min-h-[32px] px-2"
                                                                title="Clear location"
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                        <div className="mt-1 text-xs text-green-600 whitespace-pre-line">
                                                            {location.length > 100 ? `${location.substring(0, 100)}...` : location}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3 sm:mt-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                                                <select
                                                    value={shift}
                                                    onChange={(e) => setShift(e.target.value)}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                                                >
                                                    <option value="morning">Morning</option>
                                                    <option value="evening">Evening</option>
                                                    <option value="night">Night</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-3 sm:mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                                                required
                                            >
                                                <option value="present">Present</option>
                                                <option value="absent">Absent</option>
                                                <option value="weekoff">Week Off</option>
                                            </select>
                                        </div>

                                        <div className="mt-3 sm:mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
                                            <textarea
                                                value={note}
                                                onChange={(e) => setNote(e.target.value)}
                                                placeholder="Add any additional notes..."
                                                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-sm sm:text-base"
                                                rows="3"
                                            />
                                        </div>

                                        <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 bg-white rounded-lg p-2 sm:p-3">
                                            <span className="flex items-center">
                                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Lat: {latitude || '...'}
                                            </span>
                                            <span className="flex items-center">
                                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                Lng: {longitude || '...'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                        </div>

                        {/* Enhanced Instructions and Actions */}
                        <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 flex-shrink-0">
                            <div className="text-center">
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                    {!capturedImage
                                        ? 'Set your location details below, then position your face in the camera and tap the camera button to capture, or upload a photo'
                                        : 'Review your photo and location details above to confirm'
                                    }
                                </p>

                                {capturedImage && (
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                                        <button
                                            onClick={retake}
                                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base touch-manipulation min-h-[44px]"
                                        >
                                            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 inline mr-2" />
                                            Retake Photo
                                        </button>
                                        <button
                                            onClick={submitAttendance}
                                            disabled={isSubmitting}
                                            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 font-medium text-sm sm:text-base touch-manipulation min-h-[44px]"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 inline mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 inline mr-2" />
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
