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

    // State for step in/out functionality
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [stepType, setStepType] = useState('step-in');
    const [showCamera, setShowCamera] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [facingMode, setFacingMode] = useState('user');
    const [cameraReady, setCameraReady] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    // Form data
    const [location, setLocation] = useState('');
    const [selectedLocationName, setSelectedLocationName] = useState('');
    const [note, setNote] = useState('');
    const [shift, setShift] = useState(SHIFT_ENUM.MORNING);
    const [status, setStatus] = useState('present');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Predefined locations with full addresses
    const predefinedLocations = [
        { 
            name: 'Riverfront west side સી plan', 
            lat: 23.0008397, 
            lng: 72.5658486,
            address: 'unnamed road, Ranna Park, - 380007, Gujarat, India'
        },
        { 
            name: 'Flower park Point 2 Gate 2', 
            lat: 23.020939, 
            lng: 72.573550,
            address: 'Sabarmati Riverfront road, Kochrab, - 380043, Gujarat, India'
        },
        { 
            name: 'Flower park point 1 Gate 1', 
            lat: 23.021981, 
            lng: 72.573805,
            address: 'Sabarmati Riverfront Road, Paldi, Navrangpura - 380006, Gujarat, India'
        },
        { 
            name: 'Flower park point 3 Gate 3', 
            lat: 23.016429, 
            lng: 72.573197,
            address: 'Sabarmati Riverfront road, Kochrab, - 380043, Gujarat, India'
        },
        { 
            name: 'Shbhas Garden Park point 1 gate 2', 
            lat: 23.056495, 
            lng: 72.581995,
            address: 'Sabarmati Riverfront Promenade, Dudheshwar, - 380014, Gujarat, India'
        },
        { 
            name: 'Shbhas Garden Point 2 Gate 1', 
            lat: 23.058519, 
            lng: 72.584500,
            address: 'Riverfront Road, Dudheshwar, - 380027, Gujarat, India'
        }
    ];

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

    // Fetch employees under this manager
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/employee/team');
            if (response.data) {
                setEmployees(response.data);
            } else {
                setEmployees([]);
            }
        } catch {
            console.error('Error fetching employees');
            setError('Failed to fetch employees');
            toast.error('Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch sites
    const fetchSites = useCallback(async () => {
        setLoadingSites(true);
        try {
            console.log('Fetching sites...');
            const response = await api.get('/sites');
            
            console.log('Sites response:', response);
            console.log('Sites data:', response.data);
            
            // Check if response.data is an array directly (from fetchInterceptor)
            if (Array.isArray(response.data)) {
                console.log('Sites fetched successfully (direct array):', response.data);
                setSites(response.data);
            } else if (response.data && response.data.success && response.data.data) {
                console.log('Sites fetched successfully (wrapped):', response.data.data);
                setSites(response.data.data || []);
            } else {
                console.error('Failed to fetch sites - response structure:', response.data);
                setSites([]);
            }
        } catch (error) {
            console.error('Error fetching sites:', error);
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
            console.log('Fetching points for site:', siteId);
            const response = await api.get(`/sites/${siteId}`);
            
            console.log('Site response:', response);
            console.log('Site data:', response.data);
            
            // Check if response.data is a site object directly (from fetchInterceptor)
            if (response.data && response.data.points) {
                console.log('Site points fetched (direct object):', response.data.points);
                setSelectedSitePoints(response.data.points || []);
            } else if (response.data && response.data.success && response.data.data && response.data.data.points) {
                console.log('Site points fetched (wrapped):', response.data.data.points);
                setSelectedSitePoints(response.data.data.points || []);
            } else {
                console.error('Failed to fetch site points - response structure:', response.data);
                setSelectedSitePoints([]);
            }
        } catch (error) {
            console.error('Error fetching site points:', error);
            setSelectedSitePoints([]);
        } finally {
            setLoadingPoints(false);
        }
    }, []);

    // Fetch attendance data
    const fetchAttendance = useCallback(async () => {
        try {
            console.log('Fetching attendance data...');
            const response = await api.get('/attendence/');
            console.log('Attendance API response:', response);

            if (response.attendance) {
                setAttendanceList(response.attendance);
                console.log('Attendance data loaded:', response.attendance.length, 'records');
            } else {
                setAttendanceList([]);
                console.log('No attendance data found');
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
            toast.error('Failed to fetch attendance data');
        }
    }, []);

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
                console.log('Using fallback location:', locationData.address);
            } else {
                toast.success('Location captured successfully!');
            }
        } catch {
            console.error('Error getting location');
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
            setLocation(selectedLocation.address); // Use full address instead of name
            toast.success(`Location selected: ${selectedLocation.name}`);
        } else {
            setSelectedLocationName('');
            setLocation('');
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
                 console.log('Initializing StepInStepOut data...');
                 await Promise.all([
                     fetchEmployees(),
                     fetchAttendance(),
                     fetchSites()
                 ]);
                 console.log('StepInStepOut data initialized successfully');

                 // Force refresh attendance data after initial load to ensure we have the latest records
                 setTimeout(async () => {
                     console.log('🔄 Secondary attendance refresh after initialization...');
                     await fetchAttendance();
                 }, 2000);

             } catch (error) {
                 console.error('Error initializing data:', error);
                 toast.error('Failed to load initial data');
             }
         };

         initializeData();
     }, [fetchEmployees, fetchAttendance, fetchSites]);

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
                console.log('Auto-refreshing attendance data...');
                await fetchAttendance();
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [fetchAttendance]);

    // Force refresh function for manual updates
    const forceRefreshAttendance = useCallback(async () => {
        try {
            console.log('🔄 Force refreshing attendance data...');
            await fetchAttendance();
            console.log('✅ Attendance data force refreshed');
            toast.success('Data refreshed successfully');
        } catch (error) {
            console.error('❌ Force refresh failed:', error);
            toast.error('Failed to refresh data');
        }
    }, [fetchAttendance]);

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
    const getEmployeeStatus = useCallback((employeeId) => {
        const today = new Date().toDateString();

        console.log('🔍 Getting employee status for:', employeeId);
        console.log('📅 Today:', today);
        console.log('📊 Total attendance records:', attendanceList.length);

        // Find all attendance records for this employee today
        const todayAttendanceRecords = attendanceList.filter(a => {
            const isCurrentEmployee = a.employeeId?._id === employeeId || a.employeeId === employeeId;
            const isToday = a.stepIn ? new Date(a.stepIn).toDateString() === today : false;
            return isCurrentEmployee && isToday;
        });

        console.log('📋 Today\'s attendance records for employee:', todayAttendanceRecords.length);

        if (!todayAttendanceRecords || todayAttendanceRecords.length === 0) {
            console.log('❌ No attendance records found for today');
            return { status: 'not-clocked', text: 'Not Clocked', color: 'gray', image: null };
        }

        // Get the most recent attendance record for today
        const latestAttendance = todayAttendanceRecords.sort((a, b) =>
            new Date(b.stepIn) - new Date(a.stepIn)
        )[0];

        console.log('🎯 Latest attendance record:', {
            employeeId,
            today,
            latestAttendance: {
                _id: latestAttendance._id,
                stepIn: latestAttendance.stepIn,
                stepOut: latestAttendance.stepOut,
                stepInImage: latestAttendance.stepInImage,
                stepOutImage: latestAttendance.stepOutImage
            },
            hasStepIn: !!latestAttendance.stepIn,
            hasStepOut: !!latestAttendance.stepOut,
            stepInTime: latestAttendance.stepIn,
            stepOutTime: latestAttendance.stepOut
        });

        // If employee has stepped in but not stepped out (stepOut is null/undefined), they are currently clocked in
        if (latestAttendance.stepIn && (latestAttendance.stepOut === null || latestAttendance.stepOut === undefined)) {
            console.log('✅ Employee is currently CLOCKED IN');
            return {
                status: 'clocked-in',
                text: 'Clocked In',
                color: 'green',
                image: latestAttendance.stepInImage
            };
        }

        // If employee has both stepped in and stepped out, they are clocked out
        if (latestAttendance.stepIn && latestAttendance.stepOut) {
            console.log('✅ Employee is CLOCKED OUT');
            return {
                status: 'clocked-out',
                text: 'Clocked Out',
                color: 'orange',
                image: latestAttendance.stepOutImage || latestAttendance.stepInImage
            };
        }

        console.log('❌ No valid status found, defaulting to not-clocked');
        return { status: 'not-clocked', text: 'Not Clocked', color: 'gray', image: null };
    }, [attendanceList]);

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
                        finalLocation = `${autoLocation}`;
                    }
                } catch {
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

            const response = await attendanceAPI.stepOut(formData);

            if (response.data.success) {
                toast.success(`${employee.name} successfully clocked out!`);
                console.log('Refreshing data after successful step-out...');
                await Promise.all([
                    fetchAttendance(),
                    fetchEmployees()
                ]);
                console.log('Data refreshed after step-out');
            } else {
                toast.error(response.message || 'Failed to clock out employee');
            }
        } catch {
            console.error('Step out error');
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
                    finalLocation = `${autoLocation}`;
                    setLocation(finalLocation);
                    toast.success(`Location ${autoLocation}`);
                } else {
                    finalLocation = 'Location not available';
                    toast.error('Could not detect location from GPS coordinates');
                }
            } catch {
                console.error('Error in auto-location');
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
            formData.append("stepOut", null)

            console.log("formData ==> ", formData);
            if (stepType === 'step-in') {
                formData.append('stepInImage', file);
            }

            let response;
            if (stepType === 'step-in') {
                response = await attendanceAPI.stepIn(formData);
                console.log('Step in response:', response);
            } else {
                response = await attendanceAPI.stepOut(formData);
                console.log('Step out response:', response);
            }
            
            if (response.data.success === true) {
                toast.success(`${selectedEmployee.name} successfully ${stepType === 'step-in' ? 'clocked in' : 'clocked out'}!`);

                // Close modal first
                setShowCamera(false);
                setCapturedImage(null);
                setSelectedEmployee(null);
                setLocation('');
                setNote('');

                // Refresh data to get the latest status
                console.log('Refreshing data after successful attendance operation...');

                // Force refresh attendance data to get latest records
                try {
                    await fetchAttendance();
                    console.log('Attendance data refreshed successfully');

                    // Also refresh employees to ensure data consistency
                    await fetchEmployees();
                    console.log('Employee data refreshed successfully');

                    // Additional check: fetch attendance again to ensure we have the latest data
                    setTimeout(async () => {
                        console.log('Secondary attendance refresh...');
                        await fetchAttendance();
                    }, 1000);

                } catch (error) {
                    console.error('Error refreshing data:', error);
                    toast.error('Data refresh failed, but operation was successful');
                }

                console.log('Data refreshed after attendance operation');
            } else {
                toast.error(response.data.message || `Failed to ${stepType} employee`);
                return;
            }
        } catch (error) {
            console.error('Failed to submit attendance:', error);
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
                <div className="space-y-4">
                    {/* Search Bar */}
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

            {/* Employee Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredEmployees.map(employee => {
                    const status = getEmployeeStatus(employee._id);
                    console.log("status ==> ", status);
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
                                                    Select Site <span className="text-blue-600 text-xs">(Optional)</span>
                                                </label>
                                                <select
                                                    value={selectedLocationName}
                                                    onChange={(e) => {
                                                        const selectedLocation = predefinedLocations.find(loc => loc.name === e.target.value);
                                                        handleLocationSelect(selectedLocation);
                                                    }}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
                                                >
                                                    <option value="">Choose a site...</option>
                                                    {predefinedLocations.map((loc, index) => (
                                                        <option key={index} value={loc.name}>
                                                            {loc.name}
                                                        </option>
                                                    ))}
                                                </select>
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
                                                        <input
                                                            type="text"
                                                            value={location}
                                                            onChange={(e) => setLocation(e.target.value)}
                                                            placeholder="Enter your current location or use auto-detect..."
                                                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base"
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
                                                        <div className="mt-1 text-xs text-green-600">
                                                            {location.length > 50 ? `${location.substring(0, 50)}...` : location}
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
