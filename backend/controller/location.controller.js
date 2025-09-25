import EmployeeLocation from '../models/employeeLocation.models.js';
import Employee from '../models/employee.models.js';
import Attendance from '../models/attendence.models.js';

/**
 * Update employee location with geo-fencing validation
 */
export const updateEmployeeLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, batteryLevel, accuracy, deviceInfo } = req.body;
    const employeeId = req.user.id || req.user._id;

    console.log('📍 [updateEmployeeLocation] Request:', {
      employeeId,
      location: { latitude, longitude },
      address,
      batteryLevel,
      accuracy
    });

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided"
      });
    }

    // Get employee details
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check for active attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeAttendance = await Attendance.findOne({
      employeeId,
      stepIn: { $gte: today, $lt: tomorrow },
      stepOut: { $exists: false }
    });


    // Prepare location data
    const locationData = {
      employeeId,
      employeeName: employee.name,
      employeeCode: employee.empCode,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || 'Location not available',
      isOnline: true,
      lastSeen: new Date(),
      isInGeoFence,
      geoFenceValidation,
      attendanceId: activeAttendance?._id || null,
      status,
      batteryLevel: batteryLevel || null,
      accuracy: accuracy || null,
      deviceInfo: deviceInfo || null,
      timestamp: new Date()
    };

    // Update or create location record
    const existingLocation = await EmployeeLocation.findOne({ employeeId });

    if (existingLocation) {
      await EmployeeLocation.findByIdAndUpdate(existingLocation._id, locationData, { new: true });
      console.log('✅ [updateEmployeeLocation] Location updated for employee:', employee.empCode);
    } else {
      await EmployeeLocation.create(locationData);
      console.log('✅ [updateEmployeeLocation] New location created for employee:', employee.empCode);
    }

    // Emit real-time update via WebSocket (if socket server is available)
    try {
      const { broadcastLocationUpdate } = await import('../socket/socketServer.js');
      broadcastLocationUpdate(employeeId, {
        employeeName: employee.name,
        employeeCode: employee.empCode,
        location: { latitude, longitude },
        address,
        isInGeoFence,
        status,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.log('⚠️ [updateEmployeeLocation] WebSocket not available:', socketError.message);
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        employeeId,
        employeeName: employee.name,
        employeeCode: employee.empCode,
        location: { latitude, longitude },
        address,
        isInGeoFence,
        status,
        lastSeen: new Date(),
        geoFenceValidation: {
          isValid: geoFenceValidation.isValid,
          reason: geoFenceValidation.reason,
          source: geoFenceValidation.source
        }
      }
    });

  } catch (error) {
    console.error('❌ [updateEmployeeLocation] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error updating location",
      error: error.message
    });
  }
};

/**
 * Get all online employees with their locations
 */
export const getOnlineEmployees = async (req, res) => {
  try {
    console.log('📍 [getOnlineEmployees] Fetching online employees');

    const onlineEmployees = await EmployeeLocation.findOnline();

    const employeesWithLocations = onlineEmployees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId._id,
      name: emp.employeeName,
      empCode: emp.employeeCode,
      designation: emp.employeeId.designation,
      email: emp.employeeId.email,
      latitude: emp.latitude,
      longitude: emp.longitude,
      address: emp.address,
      isOnline: emp.isOnline,
      lastSeen: emp.lastSeen,
      isInGeoFence: emp.isInGeoFence,
      status: emp.getCurrentStatus(),
      batteryLevel: emp.batteryLevel,
      accuracy: emp.accuracy,
      timestamp: emp.timestamp,
      distanceInfo: emp.distanceInfo,
      geoFenceValidation: emp.geoFenceValidation ? {
        isValid: emp.geoFenceValidation.isValid,
        reason: emp.geoFenceValidation.reason,
        source: emp.geoFenceValidation.source,
        distance: emp.geoFenceValidation.distance,
        nearestPoint: emp.geoFenceValidation.nearestPoint
      } : null
    }));

    console.log(`✅ [getOnlineEmployees] Found ${employeesWithLocations.length} online employees`);

    res.status(200).json({
      success: true,
      message: "Online employees fetched successfully",
      data: employeesWithLocations,
      count: employeesWithLocations.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('❌ [getOnlineEmployees] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching online employees",
      error: error.message
    });
  }
};

/**
 * Get employee location history
 */
export const getEmployeeLocationHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, limit = 50, page = 1 } = req.query;

    console.log('📍 [getEmployeeLocationHistory] Request:', {
      employeeId,
      startDate,
      endDate,
      limit,
      page
    });

    // Build query
    const query = { employeeId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get location history
    const [locationHistory, total] = await Promise.all([
      EmployeeLocation.find(query)
        .populate('employeeId', 'name empCode designation')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      EmployeeLocation.countDocuments(query)
    ]);

    const historyData = locationHistory.map(location => ({
      _id: location._id,
      employeeId: location.employeeId._id,
      employeeName: location.employeeName,
      employeeCode: location.employeeCode,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      },
      isInGeoFence: location.isInGeoFence,
      status: location.status,
      timestamp: location.timestamp,
      batteryLevel: location.batteryLevel,
      accuracy: location.accuracy,
      geoFenceValidation: location.geoFenceValidation
    }));

    res.status(200).json({
      success: true,
      message: "Location history fetched successfully",
      data: historyData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ [getEmployeeLocationHistory] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching location history",
      error: error.message
    });
  }
};

/**
 * Mark employee as offline
 */
export const markEmployeeOffline = async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;

    console.log('📍 [markEmployeeOffline] Marking employee offline:', employeeId);

    await EmployeeLocation.findOneAndUpdate(
      { employeeId },
      {
        isOnline: false,
        status: 'offline',
        lastSeen: new Date()
      }
    );

    // Emit offline status via WebSocket
    try {
      const { broadcastLocationUpdate } = await import('../socket/socketServer.js');
      broadcastLocationUpdate(employeeId, {
        status: 'offline',
        isOnline: false,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.log('⚠️ [markEmployeeOffline] WebSocket not available:', socketError.message);
    }

    res.status(200).json({
      success: true,
      message: "Employee marked as offline successfully"
    });

  } catch (error) {
    console.error('❌ [markEmployeeOffline] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error marking employee offline",
      error: error.message
    });
  }
};

/**
 * Record step-in with geo-fence validation (with bearer token)
 */
export const recordStepIn = async (req, res) => {
  try {
    const { latitude, longitude, employeeId, employeeName, empCode } = req.body;

    console.log('📍 [recordStepIn] Request:', {
      latitude,
      longitude,
      employeeId,
      employeeName,
      empCode
    });

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided"
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);


    // Create step-in record
    const stepInRecord = {
      id: `stepin_${Date.now()}`,
      employeeId: employeeId || 'current_user',
      employeeName: employeeName || 'Current User',
      empCode: empCode || 'CURRENT_USER',
      latitude: lat,
      longitude: lng,
      address: address,
      stepInTime: new Date(),
      isValid: true,
    };

    // Here you can save to database if needed
    // await Attendance.create(stepInRecord);

    console.log('✅ [recordStepIn] Step-in recorded:', stepInRecord.employeeName);

    res.status(200).json({
      success: true,
      message: "Step-in recorded successfully",
      data: stepInRecord
    });

  } catch (error) {
    console.error('❌ [recordStepIn] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error recording step-in",
      error: error.message
    });
  }
};

/**
 * Get address from coordinates (with bearer token)
 */
export const getAddress = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    console.log('🏠 [getAddress] Request:', { latitude, longitude });

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided"
      });
    }


  } catch (error) {
    console.error('❌ [getAddress] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error getting address",
      error: error.message
    });
  }
};


/**
 * Record step-in using AWS Location Service with development mode support
 * POST /api/location/step-in
 */
export const recordStepInWithAWS = async (req, res) => {
  try {
    const { latitude, longitude, employeeId, employeeName, empCode, developmentMode } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('📍 [recordStepInWithAWS] Request:', {
      userId,
      location: { latitude, longitude },
      employeeId,
      employeeName,
      empCode,
      developmentMode
    });

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided"
      });
    }

    const deviceId = employeeId || `user_${userId}`;
    let validationResult;
    let address = 'Sabarmati Riverfront, Ahmedabad';

    // Always use live geo-fence validation
    console.log('📍 [recordStepInWithAWS] Using live geo-fence validation');


    if (!validationResult.isValid) {
      const distance = calculateDistanceFromRiver(latitude, longitude);
      return res.status(400).json({
        success: false,
        message: `Location is outside geo-fence area (distance: ${distance.toFixed(1)} meters from river)`,
        error: validationResult.reason
      });
    }


    // Calculate distance
    const distance = calculateDistanceFromRiver(latitude, longitude);

    // Create step-in record
    const stepInRecord = {
      id: `stepin_${Date.now()}_${userId}`,
      employeeId: employeeId || userId,
      employeeName: employeeName || 'Current User',
      empCode: empCode || 'CURRENT_USER',
      latitude: latitude,
      longitude: longitude,
      address: address,
      stepInTime: new Date(),
      isValid: true,
      distance: distance,
      validation: {
        source: validationResult.source || 'local',
        mode: validationResult.mode || 'production',
        fallback: validationResult.fallback || false
      }
    };

    // Here you can save to database if needed
    // await Attendance.create(stepInRecord);

    const response = {
      success: true,
      message: validationResult.mode === 'development' ?
        "Step-in recorded successfully (Development Mode)" :
        "Step-in recorded successfully",
      data: stepInRecord
    };

    console.log('✅ [recordStepInWithAWS] Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ [recordStepInWithAWS] Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to record step-in",
      error: error.message
    });
  }
};

/**
 * Get address from coordinates using AWS Location Service
 * GET /api/location/address?latitude=23.061715&longitude=72.591704
 */
export const getAddressFromCoords = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const userId = req.user.id || req.user._id;

    console.log('🏠 [getAddressFromCoords] Request:', {
      userId,
      location: { latitude, longitude }
    });

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) ||
      lat < -90 || lat > 90 ||
      lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided"
      });
    }


    console.log('✅ [getAddressFromCoords] Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ [getAddressFromCoords] Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get address",
      error: error.message
    });
  }
};

/**
 * Test AWS Location Service connection
 * GET /api/location/aws-status
 */
// export const getAWSLocationStatus = async (req, res) => {
//   try {
//     const userId = req.user.id || req.user._id;

//     console.log('🧪 [getAWSLocationStatus] Request from user:', userId);

//     // Get AWS configuration status
//     const configStatus = getAWSStatus();

//     // Test AWS connection
//     const connectionTest = await testAWSConnection();

//     // Check development mode status
//     const developmentModeStatus = {

//       DEVELOPMENT_MODE: process.env.DEVELOPMENT_MODE,

//     };

//     const response = {
//       success: true,
//       message: "AWS Location Service status retrieved",
//       data: {
//         configuration: configStatus,
//         connection: connectionTest,
//         developmentMode: developmentModeStatus,
//         timestamp: new Date()
//       }
//     };

//     console.log('✅ [getAWSLocationStatus] Response:', response);
//     res.json(response);

//   } catch (error) {
//     console.error('❌ [getAWSLocationStatus] Error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to get AWS status",
//       error: error.message
//     });
//   }
// };

/**
 * Toggle development mode for geo-fencing
 * POST /api/location/toggle-development-mode
 */
export const toggleDevelopmentMode = async (req, res) => {
  try {
    const { enabled } = req.body;
    const userId = req.user.id || req.user._id;

    console.log('🔧 [toggleDevelopmentMode] Request:', {
      userId,
      enabled,
      currentEnv: process.env.NODE_ENV
    });

    // Only allow admins to toggle development mode
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only administrators can toggle development mode"
      });
    }

    // In a real implementation, you might want to store this in a database
    // For now, we'll use environment variable or a simple in-memory flag
    const isDevelopmentMode = enabled || process.env.NODE_ENV === 'development';

    const response = {
      success: true,
      message: `Development mode ${isDevelopmentMode ? 'enabled' : 'disabled'}`,
      data: {
        developmentMode: isDevelopmentMode,
        environment: process.env.NODE_ENV,
        timestamp: new Date(),
        toggledBy: {
          userId: userId,
          userType: req.user.userType
        }
      }
    };

    console.log('✅ [toggleDevelopmentMode] Response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ [toggleDevelopmentMode] Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle development mode",
      error: error.message
    });
  }
};

/**
 * Calculate distance from Sabarmati River (simplified)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {number} Distance in meters
 */
const calculateDistanceFromRiver = (latitude, longitude) => {
  // Sabarmati River center coordinates (approximate)
  const riverCenter = { lat: 23.040107, lng: 72.574729 };

  // Simple distance calculation (you can enhance this)
  const R = 6371000; // Earth's radius in meters
  const dLat = (latitude - riverCenter.lat) * Math.PI / 180;
  const dLng = (longitude - riverCenter.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(riverCenter.lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

export default {
  updateEmployeeLocation,
  getOnlineEmployees,
  getEmployeeLocationHistory,
  markEmployeeOffline,
  getGeoFenceStats,
  testGeoFencing,
  validateGeoFence,
  recordStepIn,
  getAddress,
  validateGeoFenceWithAWS,
  recordStepInWithAWS,
  getAddressFromCoords,
  toggleDevelopmentMode
};