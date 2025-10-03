import EmployeeLocation from '../models/employeeLocation.models.js';
import Employee from '../models/employee.models.js';
import Attendance from '../models/attendence.models.js';

/**
 * Update employee location
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

    // Determine status based on attendance
    let status = 'tracking';
    if (activeAttendance) {
      status = 'working';
    }

    // Update or create employee location
    const locationData = {
      employeeId,
      employeeName: employee.name,
      employeeCode: employee.empCode,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || 'Location not available',
      isOnline: true,
      lastSeen: new Date(),
      attendanceId: activeAttendance?._id || null,
      status,
      batteryLevel: batteryLevel || null,
      accuracy: accuracy || null,
      deviceInfo: deviceInfo || null,
      timestamp: new Date()
    };

    const updatedLocation = await EmployeeLocation.findOneAndUpdate(
      { employeeId },
      locationData,
      { upsert: true, new: true }
    );

    console.log('✅ [updateEmployeeLocation] Location updated:', {
      employeeId,
      status,
      hasActiveAttendance: !!activeAttendance
    });

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        employeeId,
        employeeName: employee.name,
        employeeCode: employee.empCode,
        location: { latitude, longitude },
        address,
        status,
        timestamp: new Date()
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
 * Get all employee locations
 */
export const getAllEmployeeLocations = async (req, res) => {
  try {
    const locations = await EmployeeLocation.find({})
      .populate('employeeId', 'name empCode designation email')
      .sort({ lastSeen: -1 });

    const formattedLocations = locations.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId._id,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      location: {
        latitude: emp.latitude,
        longitude: emp.longitude,
        address: emp.address
      },
      isOnline: emp.isOnline,
      lastSeen: emp.lastSeen,
      status: emp.getCurrentStatus(),
      batteryLevel: emp.batteryLevel,
      accuracy: emp.accuracy,
      timestamp: emp.timestamp
    }));

    res.status(200).json({
      success: true,
      data: formattedLocations,
      count: formattedLocations.length
    });

  } catch (error) {
    console.error('❌ [getAllEmployeeLocations] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee locations",
      error: error.message
    });
  }
};

/**
 * Get employee location by ID
 */
export const getEmployeeLocation = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const location = await EmployeeLocation.findOne({ employeeId })
      .populate('employeeId', 'name empCode designation email');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Employee location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: location._id,
        employeeId: location.employeeId._id,
        employeeName: location.employeeName,
        employeeCode: location.employeeCode,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        },
        isOnline: location.isOnline,
        lastSeen: location.lastSeen,
        status: location.getCurrentStatus(),
        batteryLevel: location.batteryLevel,
        accuracy: location.accuracy,
        timestamp: location.timestamp
      }
    });

  } catch (error) {
    console.error('❌ [getEmployeeLocation] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee location",
      error: error.message
    });
  }
};

/**
 * Get online employees
 */
export const getOnlineEmployees = async (req, res) => {
  try {
    const onlineEmployees = await EmployeeLocation.findOnline();

    const formattedEmployees = onlineEmployees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId._id,
      employeeName: emp.employeeName,
      employeeCode: emp.employeeCode,
      location: {
        latitude: emp.latitude,
        longitude: emp.longitude,
        address: emp.address
      },
      isOnline: emp.isOnline,
      lastSeen: emp.lastSeen,
      status: emp.getCurrentStatus(),
      batteryLevel: emp.batteryLevel,
      accuracy: emp.accuracy,
      timestamp: emp.timestamp
    }));

    res.status(200).json({
      success: true,
      data: formattedEmployees,
      count: formattedEmployees.length
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
 * Record step-in without geo-fence validation
 */
export const recordStepIn = async (req, res) => {
  try {
    const { latitude, longitude, address, note, shift } = req.body;
    const employeeId = req.user.id || req.user._id;

    console.log('📍 [recordStepIn] Request:', {
      employeeId,
      location: { latitude, longitude },
      address,
      shift
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

    // Check if already stepped in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employeeId,
      stepIn: { $gte: today, $lt: tomorrow },
      stepOut: { $exists: false }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Employee is already stepped in today"
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      employeeId,
      managerId: employee.managerId,
      stepIn: new Date(),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || 'Location not available',
      note,
      shift: shift || 'morning',
      status: 'present'
    });

    await attendance.save();

    // Update employee working status
    await Employee.findByIdAndUpdate(employeeId, { isWorking: true });

    // Update location
    await EmployeeLocation.findOneAndUpdate(
      { employeeId },
      {
        employeeId,
        employeeName: employee.name,
        employeeCode: employee.empCode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || 'Location not available',
        isOnline: true,
        lastSeen: new Date(),
        attendanceId: attendance._id,
        status: 'working',
        timestamp: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('✅ [recordStepIn] Step-in recorded successfully');

    res.status(201).json({
      success: true,
      message: "Step-in recorded successfully",
      data: {
        attendanceId: attendance._id,
        employeeId,
        stepIn: attendance.stepIn,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: address || 'Location not available'
        },
        shift: attendance.shift,
        status: attendance.status
      }
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
 * Get address from coordinates
 */
export const getAddressFromCoords = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // For now, return a simple address format
    // In a real implementation, you would use a geocoding service
    const address = `Location: ${latitude}, ${longitude}`;

    res.status(200).json({
      success: true,
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address
      }
    });

  } catch (error) {
    console.error('❌ [getAddressFromCoords] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error getting address from coordinates",
      error: error.message
    });
  }
};

/**
 * Validate geo-fence with AWS (placeholder)
 */
export const validateGeoFenceWithAWS = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Since geo-fencing is removed, always return valid
    res.status(200).json({
      success: true,
      message: "Location validation passed",
      data: {
        isValid: true,
        reason: "Geo-fencing disabled"
      }
    });

  } catch (error) {
    console.error('❌ [validateGeoFenceWithAWS] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error validating geo-fence",
      error: error.message
    });
  }
};

/**
 * Record step-in with AWS (placeholder)
 */
export const recordStepInWithAWS = async (req, res) => {
  try {
    // Use the existing recordStepIn function
    return await recordStepIn(req, res);
  } catch (error) {
    console.error('❌ [recordStepInWithAWS] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error recording step-in with AWS",
      error: error.message
    });
  }
};

/**
 * Toggle development mode (placeholder)
 */
export const toggleDevelopmentMode = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Development mode toggled",
      data: {
        mode: "development",
        geoFencing: false
      }
    });

  } catch (error) {
    console.error('❌ [toggleDevelopmentMode] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error toggling development mode",
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
    const { limit = 50, offset = 0 } = req.query;

    const locations = await EmployeeLocation.find({ employeeId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const formattedLocations = locations.map(location => ({
      _id: location._id,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      status: location.status,
      isOnline: location.isOnline,
      lastSeen: location.lastSeen,
      timestamp: location.timestamp,
      batteryLevel: location.batteryLevel,
      accuracy: location.accuracy
    }));

    res.status(200).json({
      success: true,
      data: formattedLocations,
      count: formattedLocations.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ [getEmployeeLocationHistory] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching employee location history",
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

    await EmployeeLocation.findOneAndUpdate(
      { employeeId },
      {
        isOnline: false,
        status: 'offline',
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Employee marked as offline"
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
 * Test geo-fencing (placeholder)
 */
export const testGeoFencing = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Geo-fencing test completed",
      data: {
        geoFencingEnabled: false,
        testResult: "Geo-fencing is disabled"
      }
    });

  } catch (error) {
    console.error('❌ [testGeoFencing] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error testing geo-fencing",
      error: error.message
    });
  }
};