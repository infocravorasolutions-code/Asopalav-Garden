/**
 * Static Configuration File for Frontend
 * Contains all hardcoded configuration values that were previously in settings
 */

export const staticConfig = {
  // Geo-fencing settings
  geoFencing: {
    // Main geo-fence area - Updated to match actual Sabarmati River coordinates
    mainArea: {
      center: {
        latitude: 23.025, // Center of the actual river route
        longitude: 72.575
      },
      radius: 5000, // 5km in meters - increased to cover the full river area
      name: "Sabarmati River Geo-Fence",
      description: "Primary geo-fence area covering Sabarmati River route"
    },
    
    // Buffer zone
    bufferZone: {
      radius: 5500, // 5.5km in meters
      name: "Buffer Zone",
      description: "Extended buffer area around main geo-fence"
    },
    
    // Riverfront line coordinates - Updated to match actual river coordinates
    riverfrontLine: {
      startPoint: {
        latitude: 23.061715,
        longitude: 72.591704,
        name: "Gayatri Mandir, Riverfront Road"
      },
      endPoint: {
        latitude: 22.988129,
        longitude: 72.557547,
        name: "Southern Point"
      },
      width: 1000 // 1km width in meters
    }
  },
  
  // Map settings
  mapSettings: {
    defaultCenter: {
      latitude: 23.025, // Center of the actual river route
      longitude: 72.575
    },
    defaultZoom: 13,
    defaultTilt: 45
  },
  
  // Attendance settings
  attendanceSettings: {
    // Shift times
    shifts: {
      morning: {
        start: "06:00",
        end: "14:00",
        label: "6 AM - 2 PM (Morning)"
      },
      evening: {
        start: "14:00",
        end: "22:00",
        label: "2 PM - 10 PM (Evening)"
      },
      night: {
        start: "22:00",
        end: "06:00",
        label: "10 PM - 7 AM (Night)"
      }
    },
    
    // Geo-fence tolerance
    geoFenceTolerance: 50, // 50 meters tolerance
    
    // Auto step-out time (in minutes)
    autoStepOutTime: 480 // 8 hours
  },
  
  // System settings
  systemSettings: {
    // Real-time update interval (in seconds)
    realTimeUpdateInterval: 30,
    
    // Maximum route points per employee
    maxRoutePoints: 1000,
    
    // Route cleanup days (delete routes older than X days)
    routeCleanupDays: 30
  },
  
  // Notification settings
  notificationSettings: {
    // Email notifications
    emailNotifications: {
      enabled: true,
      stepInAlert: true,
      stepOutAlert: true,
      geoFenceViolation: true
    },
    
    // SMS notifications
    smsNotifications: {
      enabled: false,
      stepInAlert: false,
      stepOutAlert: false,
      geoFenceViolation: true
    }
  }
};

// Helper functions to get specific configuration values
export const getGeoFencingConfig = () => staticConfig.geoFencing;
export const getMapConfig = () => staticConfig.mapSettings;
export const getAttendanceConfig = () => staticConfig.attendanceSettings;
export const getSystemConfig = () => staticConfig.systemSettings;
export const getNotificationConfig = () => staticConfig.notificationSettings;

// Get main area center coordinates
export const getMainAreaCenter = () => staticConfig.geoFencing.mainArea.center;

// Get riverfront line coordinates
export const getRiverfrontLine = () => staticConfig.geoFencing.riverfrontLine;

// Get shift times
export const getShiftTimes = () => staticConfig.attendanceSettings.shifts;

// Get default map center
export const getDefaultMapCenter = () => staticConfig.mapSettings.defaultCenter;

export default staticConfig;
