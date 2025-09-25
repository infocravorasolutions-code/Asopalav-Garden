import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { 
  MapPin, 
  Users, 
  Battery, 
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { attendanceAPI } from '../../services/api';
import { getMapConfig, getGeoFencingConfig } from '../../config/staticConfig';
import { getSocketUrl } from '../../config/apiConfig';
import UserDetailsModal from '../ui/UserDetailsModal';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import './SabarmatiRiverMap.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different employee statuses
const createCustomIcon = (color, status) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      font-weight: bold;
    ">${status === 'working' ? 'W' : status === 'tracking' ? 'T' : 'O'}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// // Sabarmati River coordinates from your images
// const SABARMATI_RIVER_COORDINATES = [
//   [23.061715, 72.591704], // Gayatri Mandir, Riverfront Road
//   [23.060091, 72.586441], // Subhash Bridge
//   [23.052869, 72.579168], // Rishi Dadhichi Bridge
//   [23.040107, 72.574729], // Gandhi Bridge
//   [23.027089, 72.576119], // Nehru Bridge
//   [23.020216, 72.577146], // Unnamed road, Jamalpur
//   [23.013011, 72.576807], // Sabarmati Riverfront Promenade
//   [23.006932, 72.574382], // Sabarmati River front Road, Bhavna colony
//   [22.995622, 72.565339], // Dr Ambedkar Bridge, Ranna Park
//   [22.988129, 72.557547]  // Southern point
// ];

// const RIVER_LOCATIONS = [
//   { name: "Gayatri Mandir", coords: [23.061715, 72.591704], type: "landmark" },
//   { name: "Subhash Bridge", coords: [23.060091, 72.586441], type: "bridge" },
//   { name: "Rishi Dadhichi Bridge", coords: [23.052869, 72.579168], type: "bridge" },
//   { name: "Gandhi Bridge", coords: [23.040107, 72.574729], type: "bridge" },
//   { name: "Nehru Bridge", coords: [23.027089, 72.576119], type: "bridge" },
//   { name: "Jamalpur Road", coords: [23.020216, 72.577146], type: "road" },
//   { name: "Riverfront Promenade", coords: [23.013011, 72.576807], type: "promenade" },
//   { name: "Bhavna Colony", coords: [23.006932, 72.574382], type: "area" },
//   { name: "Dr Ambedkar Bridge", coords: [22.995622, 72.565339], type: "bridge" },
//   { name: "Southern Point", coords: [22.988129, 72.557547], type: "endpoint" }
// ];




const SABARMATI_RIVER_COORDINATES = [
  [23.065101, 72.589291], // Gayatri Mandir, Riverfront Road
  [23.062739, 72.585058], // Subhash Bridge
  [23.054574, 72.575457], // Rishi Dadhichi Bridge
  [23.040387, 72.571968], // Gandhi Bridge
  [23.02702, 72.573314], // Nehru Bridge
  [23.022427, 72.573703], // Unnamed road, Jamalpur
  [23.013359, 72.573852], // Sabarmati Riverfront Promenade
  [23.008, 72.571223], // Sabarmati River front Road, Bhavna colony
  [22.997107, 72.562712], // Dr Ambedkar Bridge, Ranna Park
  [22.99284, 72.553536]  // Southern point
];

const RIVER_LOCATIONS = [
  { name: "Gayatri Mandir", coords: [23.065101, 72.589291], type: "landmark" },
  { name: "Subhash Bridge", coords: [23.062739, 72.585058], type: "bridge" },
  { name: "Rishi Dadhichi Bridge", coords: [23.054574, 72.575457], type: "bridge" },
  { name: "Gandhi Bridge", coords: [23.040387, 72.571968], type: "bridge" },
  { name: "Nehru Bridge", coords: [23.02702, 72.573314], type: "bridge" },
  { name: "Jamalpur Road", coords: [23.022427, 72.573703], type: "road" },
  { name: "Riverfront Promenade", coords: [23.013359, 72.573852], type: "promenade" },
  { name: "Bhavna Colony", coords: [23.008, 72.571223], type: "area" },
  { name: "Dr Ambedkar Bridge", coords: [22.997107, 72.562712], type: "bridge" },
  { name: "Southern Point", coords: [22.99284, 72.553536], type: "endpoint" }
];


const SabarmatiRiverMap = () => {
  const { user, logout } = useAuth();
  const [onlineEmployees, setOnlineEmployees] = useState([]);
  const [employeeRoutes, setEmployeeRoutes] = useState([]);
  const [stepInLocations, setStepInLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bufferWidth] = useState(500); // meters - fixed at 500m
  const [showEmployees] = useState(true);
  const [showRoutes] = useState(false);
  const [showStepIns] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [settings, setSettings] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const socketRef = useRef(null);
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [socketHealthStatus, setSocketHealthStatus] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = () => {
      try {
        // Connect to socket server
        const socket = io(getSocketUrl(), {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
          console.log('Socket connected:', socket.id);
          setSocketConnected(true);
          setSocketError(null);
          toast.success('Real-time connection established');
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setSocketConnected(false);
          toast('Real-time connection lost', { type: 'warning' });
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setSocketConnected(false);
          setSocketError(error.message);
          toast.error('Failed to connect to real-time server');
        });

        // Socket health status updates
        socket.on('socket-health-status', (healthData) => {
          console.log('🏥 Socket health status:', healthData);
          setSocketHealthStatus(healthData);
        });

        // Real-time employee location updates
        socket.on('employeeLocationUpdate', (data) => {
          console.log('Received employee location update:', data);
          setOnlineEmployees(prevEmployees => {
            const updatedEmployees = [...prevEmployees];
            const existingIndex = updatedEmployees.findIndex(emp => emp._id === data.employeeId);
            
            if (existingIndex >= 0) {
              // Update existing employee
              updatedEmployees[existingIndex] = {
                ...updatedEmployees[existingIndex],
                latitude: data.latitude,
                longitude: data.longitude,
                lastSeen: new Date().toISOString(),
                isInGeoFence: isWithinGeoFence(data.latitude, data.longitude),
                batteryLevel: data.batteryLevel || updatedEmployees[existingIndex].batteryLevel,
                status: data.status || updatedEmployees[existingIndex].status
              };
            } else {
              // Add new employee
              updatedEmployees.push({
                _id: data.employeeId,
                name: data.employeeName || 'Unknown Employee',
                empCode: data.empCode || 'N/A',
                latitude: data.latitude,
                longitude: data.longitude,
                status: data.status || 'tracking',
                isInGeoFence: isWithinGeoFence(data.latitude, data.longitude),
                batteryLevel: data.batteryLevel || 100,
                lastSeen: new Date().toISOString(),
                address: data.address || 'Location not available'
              });
            }
            
            setLastUpdate(new Date());
            return updatedEmployees;
          });
        });

        // Real-time step-in updates
        socket.on('stepInUpdate', (data) => {
          console.log('Received step-in update:', data);
          setStepInLocations(prevStepIns => {
            const newStepIn = {
              _id: data._id || `stepin_${Date.now()}`,
              latitude: data.latitude,
              longitude: data.longitude,
              employeeName: data.employeeName || 'Unknown Employee',
              timestamp: data.timestamp || new Date().toISOString(),
              empCode: data.empCode || 'N/A',
              address: data.address || 'Location not available'
            };
            
            // Only add if within geo-fence
            if (isWithinGeoFence(data.latitude, data.longitude)) {
              return [newStepIn, ...prevStepIns.slice(0, 9)]; // Keep only last 10 step-ins
            }
            return prevStepIns;
          });
        });

        // Employee status updates
        socket.on('employeeStatusUpdate', (data) => {
          console.log('Received employee status update:', data);
          setOnlineEmployees(prevEmployees => 
            prevEmployees.map(emp => 
              emp._id === data.employeeId 
                ? { ...emp, status: data.status, lastSeen: new Date().toISOString() }
                : emp
            )
          );
        });

        return () => {
          socket.disconnect();
        };
      } catch (error) {
        console.error('Error initializing socket:', error);
        setSocketError(error.message);
        toast.error('Failed to initialize real-time connection');
      }
    };

    initializeSocket();
  }, []);

  useEffect(() => {
    console.log('🔄 Initializing map data...');
    fetchSettings();
    fetchOnlineEmployees();
    fetchStepInLocations();
    
    // Fallback polling if socket is not connected
    const interval = setInterval(() => {
      if (!socketConnected) {
        fetchOnlineEmployees();
        fetchStepInLocations();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [socketConnected]);

  // Debug state changes
  useEffect(() => {
    console.log('🔄 Employee state updated:', {
      count: onlineEmployees.length,
      employees: onlineEmployees.map(emp => ({
        name: emp.name,
        id: emp._id,
        lat: emp.latitude,
        lng: emp.longitude,
        isInGeoFence: emp.isInGeoFence
      }))
    });
  }, [onlineEmployees]);


  // Cleanup socket connection on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (showRoutes) {
      fetchEmployeeRoutes();
    }
  }, [showRoutes]);

  const fetchSettings = async () => {
    try {
      // Use static configuration instead of API call
      const mapConfig = getMapConfig();
      const geoFencingConfig = getGeoFencingConfig();
      setSettings({
        mapSettings: mapConfig,
        geoFencing: geoFencingConfig
      });
    } catch (error) {
      console.error('Error loading static configuration:', error);
    }
  };

  const fetchOnlineEmployees = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching stepped-in employees from API...');
      
      // Get employees who have step-in records (last 7 days to be safe)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      
      const response = await attendanceAPI.getAllAttendance({
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        limit: 100
      });
      
      console.log('📅 Date range:', {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      });
      
      if (response.data.success || response.data.attendance) {
        const attendanceData = response.data.attendance || response.data.data || [];
        console.log('📊 Raw attendance data:', attendanceData.length, 'records');
        console.log('📊 Sample record:', attendanceData[0]);
        
        // Filter employees who have step-in records with valid coordinates AND have NOT stepped out
        const steppedInEmployees = attendanceData
          .filter(record => {
            const hasStepIn = !!record.stepIn;
            const hasCoords = !!(record.latitude && record.longitude);
            const hasEmployee = !!record.employeeId;
            const hasNotSteppedOut = !record.stepOut; // Only show if NOT stepped out
            
            console.log('🔍 Record filter check:', {
              id: record._id,
              hasStepIn,
              hasCoords,
              hasEmployee,
              hasNotSteppedOut,
              stepIn: record.stepIn,
              stepOut: record.stepOut,
              lat: record.latitude,
              lng: record.longitude,
              employeeId: record.employeeId
            });
            
            return hasStepIn && hasCoords && hasEmployee && hasNotSteppedOut;
          })
          .map(record => {
            const employee = {
              _id: record.employeeId._id || record.employeeId,
              name: record.employeeId.name || 'Unknown Employee',
              empCode: record.employeeId.empCode || 'N/A',
              latitude: record.latitude,
              longitude: record.longitude,
              status: 'working', // All stepped-in employees are considered working
              isInGeoFence: isWithinGeoFence(record.latitude, record.longitude),
              batteryLevel: 100, // Default battery level for stepped-in employees
              lastSeen: record.stepIn,
              address: record.address || 'Location not available',
              stepInTime: record.stepIn
            };
            
            console.log('📍 Mapped employee:', {
              name: employee.name,
              lat: employee.latitude,
              lng: employee.longitude,
              isInGeoFence: employee.isInGeoFence
            });
            
            return employee;
          })
          .filter(employee => {
            console.log('🌍 Geo-fence filter:', {
              name: employee.name,
              isInGeoFence: employee.isInGeoFence,
              lat: employee.latitude,
              lng: employee.longitude
            });
            // Temporarily show ALL employees to debug the issue
            return true; // Show all employees regardless of geo-fence
          });
        
        // Remove duplicates based on employee ID
        const uniqueEmployees = steppedInEmployees.reduce((acc, current) => {
          const existing = acc.find(emp => emp._id === current._id);
          if (!existing) {
            acc.push(current);
          } else if (new Date(current.stepInTime) > new Date(existing.stepInTime)) {
            // Keep the most recent step-in location
            const index = acc.findIndex(emp => emp._id === current._id);
            acc[index] = current;
          }
          return acc;
        }, []);
        
        console.log('📍 Final stepped-in employees:', uniqueEmployees.length);
        console.log('📍 Final employee list:', uniqueEmployees);
        setOnlineEmployees(uniqueEmployees);
        setLastUpdate(new Date());
        toast.success(`Loaded ${uniqueEmployees.length} stepped-in employee locations`);
      } else {
        console.log('⚠️ No stepped-in employee data available, trying fallback...');
        
        // Fallback: try to get any attendance records
        try {
          const fallbackResponse = await attendanceAPI.getAllAttendance({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            endDate: new Date().toISOString(),
            limit: 50
          });
          
          if (fallbackResponse.data.success || fallbackResponse.data.attendance) {
            const fallbackData = fallbackResponse.data.attendance || fallbackResponse.data.data || [];
            console.log('📊 Fallback attendance data:', fallbackData.length, 'records');
            
            if (fallbackData.length > 0) {
              toast.info(`Found ${fallbackData.length} attendance records (last 30 days)`);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback fetch failed:', fallbackError);
        }
        
        setOnlineEmployees([]);
        setLastUpdate(new Date());
        toast.info('No stepped-in employees found in the last 7 days');
      }
        
    } catch (error) {
      console.error('Error fetching stepped-in employees:', error);
      setOnlineEmployees([]);
      setLastUpdate(new Date());
      toast.error('Failed to load stepped-in employee data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeRoutes = async () => {
    try {
      const response = await attendanceAPI.getEmployeeRoutes({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
      
      if (response.data.success) {
        setEmployeeRoutes(response.data.data || []);
      } else {
        toast.error('Failed to fetch employee routes');
      }
    } catch (error) {
      console.error('Error fetching employee routes:', error);
      toast.error('Error fetching employee routes');
    }
  };

  // Check if a point is within the 500m buffer around the river
  const isWithinGeoFence = (lat, lng) => {
    try {
      const point = turf.point([lng, lat]);
      const lineString = turf.lineString(SABARMATI_RIVER_COORDINATES);
      const buffer = turf.buffer(lineString, 0.5, { units: 'kilometers' }); // 500m buffer
      return turf.booleanPointInPolygon(point, buffer);
    } catch (error) {
      console.error('Error checking geo-fence:', error);
      return false;
    }
  };

  const fetchStepInLocations = async () => {
    try {
      console.log('🔄 Fetching live step-in data from API...');
      
      // First try to get live step-ins from backend
      const liveResponse = await attendanceAPI.getLiveStepIns();
      
      if (liveResponse.data.success && liveResponse.data.data) {
        const liveStepIns = liveResponse.data.data
          .filter(stepIn => {
            // Only show step-ins that have NOT stepped out
            return stepIn.latitude && stepIn.longitude && !stepIn.stepOut;
          })
          .map(stepIn => ({
            _id: stepIn._id,
            latitude: stepIn.latitude,
            longitude: stepIn.longitude,
            employeeName: stepIn.employeeId?.name || stepIn.employeeName || 'Unknown Employee',
            timestamp: stepIn.stepIn || stepIn.timestamp || new Date().toISOString(),
            empCode: stepIn.employeeId?.empCode || stepIn.empCode || 'N/A',
            address: stepIn.address || 'Location not available'
          }))
          .filter(stepIn => isWithinGeoFence(stepIn.latitude, stepIn.longitude));
        
        console.log('📍 Loaded live step-ins:', liveStepIns.length);
        setStepInLocations(liveStepIns);
        toast.success(`Loaded ${liveStepIns.length} live step-ins`);
        return;
      }
    } catch (error) {
      console.log('Live step-ins not available, trying fallback...');
    }

    try {
      // Fallback to regular attendance data
      const response = await attendanceAPI.getAllAttendance({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit: 100
      });
      
      if (response.data.success || response.data.attendance) {
        const attendanceData = response.data.attendance || response.data.data || [];
        
        const stepInData = attendanceData
          .filter(record => {
            // Only show step-ins that have NOT stepped out
            return record.stepIn && record.latitude && record.longitude && !record.stepOut;
          })
          .map(record => ({
            _id: record._id,
            latitude: record.latitude,
            longitude: record.longitude,
            employeeName: record.employeeId?.name || 'Unknown Employee',
            timestamp: record.stepIn,
            empCode: record.employeeId?.empCode || 'N/A',
            address: record.address || 'Location not available'
          }))
          .filter(stepIn => isWithinGeoFence(stepIn.latitude, stepIn.longitude));
        
        console.log('📍 Loaded step-ins from attendance:', stepInData.length);
        setStepInLocations(stepInData);
        toast.info(`Loaded ${stepInData.length} step-ins from attendance data`);
      } else {
        console.log('⚠️ No step-in data available');
        setStepInLocations([]);
        toast.info('No step-in data available');
      }
    } catch (error) {
      console.error('Error fetching step-in locations:', error);
      setStepInLocations([]);
      toast.error('Failed to load step-in data. Please check your connection.');
    }
  };

  // const getBatteryIcon = (level) => {
  //   if (level >= 80) return <BatteryFull className="h-4 w-4 text-green-500" />;
  //   if (level >= 50) return <BatteryMedium className="h-4 w-4 text-yellow-500" />;
  //   if (level >= 20) return <BatteryLow className="h-4 w-4 text-orange-500" />;
  //   return <Battery className="h-4 w-4 text-red-500" />;
  // };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'tracking':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'offline':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getMarkerColor = (status, isInGeoFence) => {
    // If outside geo-fence, use red regardless of status
    if (!isInGeoFence) return '#ef4444'; // red for outside geo-fence
    
    switch (status) {
      case 'working': return '#10b981'; // green
      case 'tracking': return '#3b82f6'; // blue
      case 'offline': return '#6b7280'; // gray
      default: return '#f59e0b'; // orange
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };


  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance * 1000; // Convert to meters
  };



  // Create 500m buffer polygon around the river using Turf.js
  const createBufferPolygon = () => {
    const lineString = turf.lineString(SABARMATI_RIVER_COORDINATES);
    const buffer = turf.buffer(lineString, 0.5, { units: 'kilometers' }); // 500m buffer
    return buffer.geometry.coordinates[0].map(coord => [coord[1], coord[0]]); // Convert to [lat, lng]
  };

  // Create main geo-fence polygon (500m buffer around river)
  const createMainGeofencePolygon = () => {
    const lineString = turf.lineString(SABARMATI_RIVER_COORDINATES);
    const buffer = turf.buffer(lineString, 0.5, { units: 'kilometers' }); // 500m buffer
    return buffer.geometry.coordinates[0].map(coord => [coord[1], coord[0]]); // Convert to [lat, lng]
  };


  // Handle user marker click for user details
  const handleUserMarkerClick = (employee) => {
    setSelectedUser(employee);
    setShowUserModal(true);
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Handle escape key to exit full screen and force map resize
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    if (isFullScreen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when in full screen
      document.body.style.overflow = 'hidden';
      
      // Force map resize after a short delay to ensure DOM is updated
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isFullScreen]);


  return (
    <div className={`${isFullScreen ? 'fullscreen-container' : 'p-6'}`}>
      {!isFullScreen && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Sabarmati River Geo-Fencing Map
              </h1>
              <p className="text-gray-600">
                Real-time monitoring of currently working employees (stepped-in but not stepped-out) with 500m buffer around Sabarmati River route using Turf.js
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome,</p>
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Map Container */}
      <div className={`${isFullScreen ? 'map-wrapper' : 'bg-white rounded-lg shadow mb-6'}`}>
        <div className={`${isFullScreen ? 'map-header p-3 border-b border-gray-200' : 'p-4 border-b border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <div>
              {isFullScreen ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Sabarmati River Geo-Fencing Map - Full Screen</h3>
                  <div className="flex items-center mt-1 space-x-4">
                    <div className="text-sm text-gray-600">
                      Logged in as: <span className="font-medium text-gray-900">{user?.name || 'Admin'}</span>
                    </div>
                    {lastUpdate && (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">
                          Last updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Interactive Leaflet Map</h3>
                  {lastUpdate && (
                    <div className="flex items-center mt-1 space-x-4">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-xs text-gray-500">
                          Live data • Last updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {socketConnected ? (
                          <>
                            <Wifi className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600">Real-time Connected</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 text-red-500 mr-1" />
                            <span className="text-xs text-red-600">Real-time Disconnected</span>
                          </>
                        )}
                        {socketHealthStatus && (
                          <div className="flex items-center">
                            <div className={`h-2 w-2 rounded-full mr-1 ${
                              socketHealthStatus.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className="text-xs text-gray-500">
                              {socketHealthStatus.connectedClients} clients
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('🔄 Manual refresh triggered');
                  fetchOnlineEmployees();
                  fetchStepInLocations();
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
              <button
                onClick={toggleFullScreen}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="h-4 w-4" />
                    Exit Full Screen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4" />
                    Full Screen
                  </>
                )}
              </button>
              {isFullScreen && (
                <>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                    Logout
                  </button>
                  <button
                    onClick={() => setIsFullScreen(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Exit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className={`${isFullScreen ? 'map-content' : 'h-96 relative rounded-lg overflow-hidden border-2 border-gray-200'}`}>
          <MapContainer
            center={[23.025, 72.575]} // Center of the river route
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* River Route Line */}
            <Polyline
              positions={SABARMATI_RIVER_COORDINATES}
              color="blue"
              weight={4}
              opacity={0.8}
            />
            
            {/* 500m Buffer Zone around River */}
            <Polygon
              positions={createBufferPolygon()}
              color="red"
              fillColor="red"
              fillOpacity={0.15}
              weight={3}
            />
            
            {/* River Location Markers */}
            {RIVER_LOCATIONS.map((location, index) => (
              <Marker
                key={index}
                position={location.coords}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="
                    background-color: #3b82f6;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 8px;
                    color: white;
                    font-weight: bold;
                  ">${index + 1}</div>`,
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              />
            ))}
            
            {/* Employee Markers */}
            {showEmployees && onlineEmployees.map((employee) => {
              console.log('🎯 Rendering employee marker:', {
                name: employee.name,
                id: employee._id,
                position: [employee.latitude, employee.longitude],
                status: employee.status
              });
              return (
                <Marker
                  key={employee._id}
                  position={[employee.latitude, employee.longitude]}
                  icon={createCustomIcon(getMarkerColor(employee.status, employee.isInGeoFence), employee.status)}
                  eventHandlers={{
                    click: () => handleUserMarkerClick(employee)
                  }}
                />
              );
            })}
            

            {/* Step-in Location Markers */}
            {showStepIns && stepInLocations.map((stepIn) => (
              <Marker
                key={stepIn._id}
                position={[stepIn.latitude, stepIn.longitude]}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="
                    background-color: #8b5cf6;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  "></div>`,
                  iconSize: [12, 12],
                  iconAnchor: [6, 6]
                })}
              />
            ))}
          </MapContainer>
          
          
        </div>
      </div>

      {/* Employee List - Only show when not in full screen */}
      {!isFullScreen && (
        <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Currently Working Employee Locations</h3>
              <p className="text-sm text-gray-600">{onlineEmployees.length} currently working employees found (stepped-in but not stepped-out)</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-xs text-gray-500">Live tracking active</span>
              </div>
              <div className="flex items-center space-x-2">
                {socketConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Real-time</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-xs text-red-600">Polling</span>
                  </>
                )}
                {socketHealthStatus && (
                  <span className="text-xs text-gray-400">
                    ({socketHealthStatus.connectedClients} clients)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currently Working Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Battery
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Step-In Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {onlineEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.empCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(employee.status)}
                      <span className="ml-2 text-sm text-gray-900">{employee.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {employee.address || 'Location not available'}
                      </span>
                    </div>
                    {/* <div className={`text-xs ${employee.isInGeoFence ? 'text-green-600' : 'text-red-600'}`}>
                      {employee.isInGeoFence ? '✅ In Geo-Fence' : '❌ Out of Geo-Fence'}
                    </div> */}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getBatteryIcon(employee.batteryLevel)}
                      <span className="ml-2 text-sm text-gray-900">
                        {employee.batteryLevel || 0}%
                      </span>
                    </div>
                  </td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatLastSeen(employee.stepInTime || employee.lastSeen)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowDetailModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Employee Details</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee Code</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.empCode}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center">
                    {getStatusIcon(selectedEmployee.status)}
                    <span className="ml-2 text-sm text-gray-900">{selectedEmployee.status}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.address || 'Not available'}</p>
                  <p className="text-xs text-gray-500">
                    {selectedEmployee.isInGeoFence ? 'Within Geo-Fence' : 'Outside Geo-Fence'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                  <p className="text-sm text-gray-900">
                    {selectedEmployee.latitude && selectedEmployee.longitude 
                      ? `${selectedEmployee.latitude.toFixed(6)}, ${selectedEmployee.longitude.toFixed(6)}`
                      : 'Not available'
                    }
                  </p>
                </div>
                
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700">Battery Level</label>
                  <div className="flex items-center">
                    {getBatteryIcon(selectedEmployee.batteryLevel)}
                    <span className="ml-2 text-sm text-gray-900">
                      {selectedEmployee.batteryLevel || 0}%
                    </span>
                  </div>
                </div> */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Step-In Time</label>
                  <p className="text-sm text-gray-900">{formatLastSeen(selectedEmployee.stepInTime || selectedEmployee.lastSeen)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
        location={selectedUser ? {
          latitude: selectedUser.latitude,
          longitude: selectedUser.longitude,
          address: selectedUser.address,
          lastUpdate: selectedUser.lastUpdate
        } : null}
      />
    </div>
  );
};

export default SabarmatiRiverMap;
