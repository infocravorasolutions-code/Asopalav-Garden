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
import { useManagerEmployee } from '../../contexts/ManagerEmployeeContext';
import { useManagerAttendance } from '../../contexts/ManagerAttendanceContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';
import { api, IMAGE_URL } from '../../services/api';

const StepInStepOut = () => {
  const { user } = useAuth();
  const { employees, fetchMyEmployees } = useManagerEmployee();
  const { 
    attendanceList, 
    fetchAttendance, 
    clockInEmployee, 
    clockOutEmployee,
    updateAttendance
  } = useManagerAttendance();

  // State for step in/out functionality
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [stepType, setStepType] = useState('step-in');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [cameraReady, setCameraReady] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto step-out state
  const [autoStepOutEnabled, setAutoStepOutEnabled] = useState(true);
  const [autoStepOutThreshold, setAutoStepOutThreshold] = useState(30); // 30 minutes
  const [pendingAutoStepOuts, setPendingAutoStepOuts] = useState([]);
  const [showAutoStepOutModal, setShowAutoStepOutModal] = useState(false);
  const [processingAutoStepOut, setProcessingAutoStepOut] = useState(false);

  // Form data
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [shift, setShift] = useState('morning');
  const [status, setStatus] = useState('present');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Search and filter with debouncing
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoCheckIntervalRef = useRef(null);

  // Video constraints for webcam
  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
  };

  // Debounced search to reduce processing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Check authentication status first
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    console.log('=== Authentication Debug ===');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!userData);
    if (token) {
      console.log('Token preview:', token.substring(0, 20) + '...');
    }
    if (userData) {
      console.log('User data:', JSON.parse(userData));
    }
    console.log('===========================');
    
    if (!token) {
      console.error('No authentication token found. Redirecting to login...');
      // Use proper SPA navigation instead of window.location
      window.location.href = '/login';
      return;
    }
    
    // Only fetch data if authenticated
    fetchMyEmployees();
    fetchAttendance();
    getCurrentLocation();
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (autoCheckIntervalRef.current) {
        clearInterval(autoCheckIntervalRef.current);
        autoCheckIntervalRef.current = null;
      }
    };
  }, []); // Empty dependency array to run only once on mount

  // Auto step-out checking functionality
  const startAutoStepOutChecking = useCallback(() => {
    // Clear existing interval
    if (autoCheckIntervalRef.current) {
      clearInterval(autoCheckIntervalRef.current);
    }

    // Check every 5 minutes for pending auto step-outs
    autoCheckIntervalRef.current = setInterval(() => {
      checkForAutoStepOuts();
    }, 5 * 60 * 1000); // 5 minutes

    // Initial check
    checkForAutoStepOuts();
  }, [autoStepOutThreshold]);

  const checkForAutoStepOuts = useCallback(() => {
    if (!Array.isArray(employees) || employees.length === 0) return;

    const now = new Date();
    const thresholdMs = autoStepOutThreshold * 60 * 1000; // Convert minutes to milliseconds
    const pendingStepOuts = [];

    // Handle different response structures
    let attendanceArray = [];
    if (Array.isArray(attendanceList)) {
      attendanceArray = attendanceList;
    } else if (attendanceList && attendanceList.data && Array.isArray(attendanceList.data)) {
      attendanceArray = attendanceList.data;
    } else if (attendanceList && attendanceList.attendance && Array.isArray(attendanceList.attendance)) {
      attendanceArray = attendanceList.attendance;
    }

    employees.forEach(employee => {
      const today = new Date().toDateString();
      
      // Find today's attendance for this employee
      const todayAttendance = attendanceArray.find(a => {
        const isCurrentEmployee = a.employeeId?._id === employee._id || a.employeeId === employee._id;
        const isToday = new Date(a.stepIn).toDateString() === today;
        return isCurrentEmployee && isToday && a.stepIn && !a.stepOut;
      });

      if (todayAttendance) {
        const stepInTime = new Date(todayAttendance.stepIn);
        const timeDiff = now - stepInTime;
        
        // Check if employee has been clocked in for more than threshold
        if (timeDiff > thresholdMs) {
          const hoursWorked = Math.floor(timeDiff / (1000 * 60 * 60));
          const minutesWorked = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          
          pendingStepOuts.push({
            employee,
            attendanceRecord: todayAttendance,
            stepInTime,
            hoursWorked,
            minutesWorked,
            overThresholdBy: Math.floor((timeDiff - thresholdMs) / (1000 * 60)) // minutes over threshold
          });
        }
      }
    });

    if (pendingStepOuts.length > 0) {
      setPendingAutoStepOuts(pendingStepOuts);
      setShowAutoStepOutModal(true);
      
      // Show toast notification
      toast.error(
        `${pendingStepOuts.length} employee(s) need auto step-out (worked > ${autoStepOutThreshold} min)`,
        { duration: 8000 }
      );
    }
  }, [employees, attendanceList, autoStepOutThreshold]);

  // Process auto step-out for a single employee
  const processAutoStepOut = async (employeeData) => {
    const { employee, attendanceRecord } = employeeData;
    
    try {
      setProcessingAutoStepOut(true);

      // Get current location or use fallback
      let finalLocation = 'Auto step-out location';
      if (latitude && longitude) {
        try {
          const autoLocation = await getAddressFromCoordinates(latitude, longitude);
          if (autoLocation) {
            finalLocation = `Auto step-out: ${autoLocation}`;
          }
        } catch (error) {
          // Continue with default location
        }
      }

      // Create FormData for auto step-out
      const formData = new FormData();
      formData.append('attendanceId', attendanceRecord._id);
      formData.append('longitude', parseFloat(longitude) || 0);
      formData.append('latitude', parseFloat(latitude) || 0);
      formData.append('address', finalLocation);
      formData.append('note', `Auto step-out after ${autoStepOutThreshold} minutes`);
      formData.append('status', 'present');
      formData.append('autoStepOut', 'true'); // Flag for backend

      const result = await clockOutEmployee(formData);
      if (result.success) {
        toast.success(`${employee.name} auto stepped-out successfully!`);
        return true;
      } else {
        toast.error(`Failed to auto step-out ${employee.name}: ${result.error}`);
        return false;
      }
    } catch (error) {
      console.error('Auto step-out error:', error);
      toast.error(`Failed to auto step-out ${employee.name}. Please try manual step-out.`);
      return false;
    } finally {
      setProcessingAutoStepOut(false);
    }
  };

  // Process all auto step-outs
  const processAllAutoStepOuts = async () => {
    const results = [];
    
    for (const employeeData of pendingAutoStepOuts) {
      const success = await processAutoStepOut(employeeData);
      results.push({ employee: employeeData.employee, success });
    }

    // Show summary
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    if (successCount > 0) {
      toast.success(`Successfully auto stepped-out ${successCount} employee(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to auto step-out ${failCount} employee(s)`);
    }

    // Refresh data and close modal
    await fetchAttendance();
    await fetchMyEmployees();
    setShowAutoStepOutModal(false);
    setPendingAutoStepOuts([]);
  };

  // Skip auto step-outs (dismiss)
  const skipAutoStepOuts = () => {
    setShowAutoStepOutModal(false);
    setPendingAutoStepOuts([]);
    toast.info('Auto step-out skipped. Will check again in 5 minutes.');
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        () => {
          // Don't set fallback coordinates - let user handle location manually
          setLatitude("23.0341367");
          setLongitude("72.5723255°");
        }
      );
    }
  };

  // Convert coordinates to address using reverse geocoding
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
          const relevantParts = addressParts.slice(0, 6).join(', ');
          return relevantParts;
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

  // Handle step in/out
  const handleStepInOut = async (employeeId, type) => {
    const employee = Array.isArray(employees) ? employees.find(emp => emp._id === employeeId) : null;
    
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

      getCurrentLocation();

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
      let attendanceArray = [];
      if (Array.isArray(attendanceList)) {
        attendanceArray = attendanceList;
      } else if (attendanceList && attendanceList.data && Array.isArray(attendanceList.data)) {
        attendanceArray = attendanceList.data;
      } else if (attendanceList && attendanceList.attendance && Array.isArray(attendanceList.attendance)) {
        attendanceArray = attendanceList.attendance;
      }

      const todayAttendance = attendanceArray.find(a => {
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

      const result = await clockOutEmployee(formData);
      if (result.success) {
        toast.success(`${employee.name} successfully clocked out!`);
        await fetchAttendance();
        await fetchMyEmployees();
      } else {
        toast.error(result.error || 'Failed to clock out employee');
      }
    } catch (error) {
      console.error('Step out error:', error);
      toast.error('Failed to clock out employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

      let managerId = null;
      if (user._id) {
        managerId = user._id;
      } else if (user.id) {
        managerId = user.id;
      } else if (user.manager && user.manager._id) {
        managerId = user.manager._id;
      } else if (user.manager && user.manager.id) {
        managerId = user.manager.id;
      }
      
      if (!managerId) {
        toast.error('Manager ID not found. Please log in again.');
        return;
      }

      const formData = new FormData();
      formData.append('employeeId', selectedEmployee._id);
      formData.append('managerId', managerId);
      formData.append('shift', shift);
      formData.append('status', status);
      formData.append('longitude', parseFloat(longitude) || 0);
      formData.append('latitude', parseFloat(latitude) || 0);
      formData.append('address', finalLocation);
      formData.append('note', note);

      if (stepType === 'step-in') {
        formData.append('stepInImage', file);
      }

      let result;
      if (stepType === 'step-in') {
        result = await clockInEmployee(formData);
        if (result.success) {
          toast.success(`${selectedEmployee.name} successfully clocked in!`);
        } else {
          toast.error(result.error || 'Failed to clock in employee');
          return;
        }
      } else {
        result = await clockOutEmployee(formData);
        if (result.success) {
          toast.success(`${selectedEmployee.name} successfully clocked out!`);
        } else {
          toast.error(result.error || 'Failed to clock out employee');
          return;
        }
      }

      setShowCamera(false);
      setCapturedImage(null);
      setSelectedEmployee(null);
      setLocation('');
      setNote('');
      
      await fetchAttendance();
      await fetchMyEmployees();
    } catch (error) {
      toast.error('Failed to submit attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get employee status and latest attendance image
  const getEmployeeStatus = (employeeId) => {
    const today = new Date().toDateString();
    
    let attendanceArray = [];
    if (Array.isArray(attendanceList)) {
      attendanceArray = attendanceList;
    } else if (attendanceList && attendanceList.data && Array.isArray(attendanceList.data)) {
      attendanceArray = attendanceList.data;
    } else if (attendanceList && attendanceList.attendance && Array.isArray(attendanceList.attendance)) {
      attendanceArray = attendanceList.attendance;
    }
    
    const todayAttendance = attendanceArray.find(a => {
      const isCurrentEmployee = a.employeeId?._id === employeeId || a.employeeId === employeeId;
      const isToday = new Date(a.stepIn).toDateString() === today;
      
      return isCurrentEmployee && isToday;
    });
    
    if (!todayAttendance) {
      return { status: 'not-clocked', text: 'Not Clocked', color: 'gray', image: null };
    }
    
    if (todayAttendance.stepIn && !todayAttendance.stepOut) {
      // Check if this employee needs auto step-out
      const stepInTime = new Date(todayAttendance.stepIn);
      const now = new Date();
      const timeDiff = now - stepInTime;
      const thresholdMs = autoStepOutThreshold * 60 * 1000;
      
      const needsAutoStepOut = timeDiff > thresholdMs;
      
      return { 
        status: 'clocked-in', 
        text: needsAutoStepOut ? 'Needs Auto Step-Out' : 'Clocked In', 
        color: needsAutoStepOut ? 'orange' : 'green',
        image: todayAttendance.stepInImage,
        needsAutoStepOut,
        workDuration: Math.floor(timeDiff / (1000 * 60)) // minutes worked
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

  // Get latest attendance image for employee
  const getLatestAttendanceImage = (employeeId) => {
    let attendanceArray = [];
    if (Array.isArray(attendanceList)) {
      attendanceArray = attendanceList;
    } else if (attendanceList && attendanceList.data && Array.isArray(attendanceList.data)) {
      attendanceArray = attendanceList.data;
    } else if (attendanceList && attendanceList.attendance && Array.isArray(attendanceList.attendance)) {
      attendanceArray = attendanceList.attendance;
    }
    
    const employeeAttendance = attendanceArray.filter(a => {
      const isCurrentEmployee = a.employeeId?._id === employeeId || a.employeeId === employeeId;
      return isCurrentEmployee;
    });
    
    if (employeeAttendance.length === 0) {
      return null;
    }
    
    const sortedAttendance = employeeAttendance.sort((a, b) => 
      new Date(b.stepIn) - new Date(a.stepIn)
    );
    
    for (const attendance of sortedAttendance) {
      if (attendance.stepOutImage) {
        return attendance.stepOutImage;
      }
      if (attendance.stepInImage) {
        return attendance.stepInImage;
      }
    }
    
    return null;
  };

  // Upload profile image for employee
  const uploadProfileImage = async (employeeId, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await api.put(`/employee/${employeeId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200) {
        toast.success('Profile image uploaded successfully!');
        await fetchMyEmployees();
      }
    } catch (error) {
      toast.error('Failed to upload profile image');
    }
  };

  // Handle profile image upload
  const handleProfileImageUpload = (employeeId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    uploadProfileImage(employeeId, file);
    event.target.value = '';
  };

  // Optimized filter employees with debounced search
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
    needsAutoStepOut: Array.isArray(employees) ? employees.filter(emp => getEmployeeStatus(emp._id).needsAutoStepOut).length : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Step In/Step Out</h1>
          <p className="text-secondary-600">Manage employee attendance with photo verification</p>
        </div>

                 {/* Manual Refresh Button */}
         <div className="flex items-center space-x-4">
           <button
             onClick={async () => {
               try {
                 console.log('Manual refresh triggered');
                 await Promise.all([
                   fetchMyEmployees(),
                   fetchAttendance()
                 ]);
                 toast.success('Data refreshed successfully');
               } catch (error) {
                 console.error('Manual refresh failed:', error);
                 toast.error('Failed to refresh data. Please check your connection.');
               }
             }}
             disabled={loading}
             className="btn btn-outline btn-sm"
           >
             {loading ? (
               <>
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 Loading...
               </>
             ) : (
               <>
                 <RefreshCw className="h-4 w-4 mr-2" />
                 Refresh Data
               </>
             )}
           </button>
         </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="card p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Employees</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-12 w-12 opacity-80" />
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Clocked In</p>
              <p className="text-3xl font-bold">{stats.clockedIn}</p>
            </div>
            <LogIn className="h-12 w-12 opacity-80" />
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Clocked Out</p>
              <p className="text-3xl font-bold">{stats.clockedOut}</p>
            </div>
            <LogOut className="h-12 w-12 opacity-80" />
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Not Clocked</p>
              <p className="text-3xl font-bold">{stats.notClocked}</p>
            </div>
            <Clock className="h-12 w-12 opacity-80" />
          </div>
        </div>
    
      </div>

      {/* Search and Filter */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search employees by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full pl-10"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="all">All Status</option>
              <option value="not-clocked">Not Clocked</option>
              <option value="clocked-in">Clocked In</option>
              <option value="clocked-out">Clocked Out</option>
            </select>
          </div>
          {stats.needsAutoStepOut > 0 && (
            <button
              onClick={() => setShowAutoStepOutModal(true)}
              className="btn btn-warning btn-sm"
            >
              <Timer className="h-4 w-4 mr-2" />
              Auto Step-Out ({stats.needsAutoStepOut})
            </button>
          )}
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map(employee => {
          const status = getEmployeeStatus(employee._id);
          const latestAttendanceImage = getLatestAttendanceImage(employee._id);
          const displayImage = status.image || latestAttendanceImage || employee.image;
          
          return (
            <div key={employee._id} className="card p-6 hover:shadow-lg transition-shadow duration-300">
              {/* Employee Info */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="avatar relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {displayImage ? (
                      <img 
                        src={`${IMAGE_URL}/${displayImage}`} 
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
                  {/* Profile Image Upload Button */}
                  <label className="absolute -bottom-1 -right-1 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-1 cursor-pointer transition-colors duration-200">
                    <Upload className="h-3 w-3" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProfileImageUpload(employee._id, e)}
                      className="hidden"
                    />
                  </label>
                  {/* Attendance Image Indicator */}
                  {(status.image || latestAttendanceImage) && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1">
                      <Camera className="h-3 w-3" />
                    </div>
                  )}
                  {/* Auto Step-Out Warning */}
                  {status.needsAutoStepOut && (
                    <div className="absolute -top-1 -left-1 bg-orange-500 text-white rounded-full p-1">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-secondary-900">{employee.name}</h3>
                  <p className="text-sm text-secondary-500">{employee.email}</p>
                  <p className="text-xs text-secondary-400 capitalize">{employee.shift} Shift</p>
                  {status.workDuration && status.status === 'clocked-in' && (
                    // <p className="text-xs text-orange-600 font-medium">
                    //   Working: {Math.floor(status.workDuration / 60)}h {status.workDuration % 60}m
                    // </p>
                    <></>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`badge badge-lg ${
                  status.color === 'green' ? 'badge-success' :
                  status.color === 'orange' ? 'badge-warning' :
                  'badge-outline'
                }`}>
                  {status.text}
                </span>
                {status.status === 'clocked-in' && !status.needsAutoStepOut && (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    ✓ Currently working
                  </div>
                )}
                {status.needsAutoStepOut && (
                  <div className="mt-2 text-xs text-orange-600 font-medium flex items-center">
                    <Timer className="h-3 w-3 mr-1" />
                    Over {autoStepOutThreshold} min limit
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {status.status === 'not-clocked' && (
                  <button
                    onClick={() => handleStepInOut(employee._id, 'step-in')}
                    className="btn btn-success btn-sm w-full"
                    disabled={loading}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Step In
                  </button>
                )}
                {status.status === 'clocked-out' && (
                  <button
                    onClick={() => handleStepInOut(employee._id, 'step-in')}
                    className="btn btn-success btn-sm w-full"
                    disabled={loading}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Step In Again
                  </button>
                )}
                {status.status === 'clocked-in' && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleStepInOut(employee._id, 'step-out')}
                      className={`btn btn-sm w-full ${status.needsAutoStepOut ? 'btn-warning' : 'btn-error'}`}
                      disabled={loading || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing Out...
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-2" />
                          {status.needsAutoStepOut ? 'Force Step Out' : 'Step Out'}
                        </>
                      )}
                    </button>
                    {status.needsAutoStepOut && (
                      <button
                        onClick={() => processAutoStepOut({employee, attendanceRecord: attendanceList.find(a => 
                          (a.employeeId?._id === employee._id || a.employeeId === employee._id) && 
                          new Date(a.stepIn).toDateString() === new Date().toDateString() && 
                          !a.stepOut
                        )})}
                        className="btn btn-outline btn-warning btn-xs w-full"
                        disabled={processingAutoStepOut}
                      >
                        {processingAutoStepOut ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Auto Step Out...
                          </>
                        ) : (
                          <>
                            <Timer className="h-3 w-3 mr-1" />
                            Auto Step Out
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="h-16 w-16 text-secondary-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No Employees Found</h3>
          <p className="text-secondary-600">No employees match your search criteria.</p>
        </div>
      )}

      {/* Auto Step-Out Modal */}
      {showAutoStepOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div>
                <h3 className="text-xl font-semibold text-secondary-900 flex items-center">
                  <Timer className="h-6 w-6 mr-2 text-orange-500" />
                  Auto Step-Out Required
                </h3>
                <p className="text-sm text-secondary-600">
                  {pendingAutoStepOuts.length} employee(s) have exceeded the {autoStepOutThreshold} minute work limit
                </p>
              </div>
              <button
                onClick={skipAutoStepOuts}
                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Employee List */}
            <div className="p-6 space-y-4">
              {pendingAutoStepOuts.map((employeeData, index) => (
                <div key={employeeData.employee._id} className="card p-4 bg-orange-50 border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="avatar">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {employeeData.employee.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-secondary-900">{employeeData.employee.name}</h4>
                        <p className="text-sm text-secondary-600">{employeeData.employee.email}</p>
                        <p className="text-xs text-orange-600 font-medium">
                          Stepped in: {employeeData.stepInTime.toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-orange-600">
                          Worked: {employeeData.hoursWorked}h {employeeData.minutesWorked}m 
                          (Over by {employeeData.overThresholdBy} min)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <button
                        onClick={() => processAutoStepOut(employeeData)}
                        className="btn btn-warning btn-sm"
                        disabled={processingAutoStepOut}
                      >
                        {processingAutoStepOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Timer className="h-4 w-4 mr-1" />
                            Auto Step Out
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-6 bg-secondary-50 border-t border-secondary-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={processAllAutoStepOuts}
                  className="btn btn-warning flex-1"
                  disabled={processingAutoStepOut}
                >
                  {processingAutoStepOut ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Timer className="h-4 w-4 mr-2" />
                      Auto Step Out All ({pendingAutoStepOuts.length})
                    </>
                  )}
                </button>
                <button
                  onClick={skipAutoStepOuts}
                  className="btn btn-outline flex-1"
                  disabled={processingAutoStepOut}
                >
                  <X className="h-4 w-4 mr-2" />
                  Skip for Now
                </button>
              </div>
              <p className="text-xs text-secondary-500 text-center mt-2">
                Auto step-out will automatically clock out employees with current timestamp and location
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-secondary-200">
              <div>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {stepType === 'step-in' ? 'Step In' : 'Step Out'} - {selectedEmployee?.name}
                </h3>
                <p className="text-sm text-secondary-600">Capture photo and enter details</p>
              </div>
              <button
                onClick={() => {
                  setShowCamera(false);
                  setCapturedImage(null);
                  setSelectedEmployee(null);
                }}
                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100"
              >
                <X className="h-6 w-6" />
              </button>
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
                    
                    {/* Camera Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                      <button
                        onClick={switchCamera}
                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white"
                      >
                        <RotateCcw className="h-5 w-5 text-secondary-700" />
                      </button>
                      
                      <button
                        onClick={capture}
                        disabled={!cameraReady}
                        className="p-4 bg-primary-600 rounded-full shadow-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        <Camera className="h-6 w-6 text-white" />
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-white bg-opacity-80 rounded-full shadow-lg hover:bg-white"
                      >
                        <Upload className="h-5 w-5 text-secondary-700" />
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
                        <RotateCcw className="h-5 w-5 text-secondary-700" />
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

              {/* Form Fields */}
              {capturedImage && (
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Location</span>
                      <span className="label-text-alt text-blue-600">(Optional - will auto-detect from GPS)</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter your current location or leave empty for auto-detection..."
                      className="input input-bordered w-full"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Shift</span>
                    </label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="select select-bordered w-full"
                    >
                      <option value="morning">Morning</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Status *</span>
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="select select-bordered w-full"
                      required
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="weekoff">Week Off</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Note (Optional)</span>
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add any additional notes..."
                      className="textarea textarea-bordered w-full"
                      rows="3"
                    />
                  </div>

                  <div className="flex gap-4 text-sm text-secondary-500">
                    <span>Latitude: {latitude || '...'}</span>
                    <span>Longitude: {longitude || '...'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-6 bg-secondary-50 border-t border-secondary-200">
              <p className="text-sm text-secondary-600 text-center">
                {!capturedImage 
                  ? 'Position your face in the camera and tap the camera button to capture, or upload a photo'
                  : 'Review your photo and fill in the details above to confirm'
                }
              </p>
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