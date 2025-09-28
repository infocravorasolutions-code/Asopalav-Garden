import Attendance from "../models/attendence.models.js";
import Employee from "../models/employee.models.js";
import Manager from "../models/manager.models.js";
import Location from "../models/location.model.js";
import EmployeeLocation from "../models/employeeLocation.models.js";
import EmployeeRoute from "../models/employeeRoute.models.js";
import Company from "../models/company.models.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// Default shift configurations
const DEFAULT_SHIFT_TIMES = {
  morning: {
    stepIn: "07:00",
    stepOut: "15:00",
    label: "7 AM - 3 PM (Morning)"
  },
  evening: {
    stepIn: "14:00",
    stepOut: "22:00",
    label: "2 PM - 10 PM (Evening)"
  },
  night: {
    stepIn: "22:00",
    stepOut: "07:00",
    label: "10 PM - 7 AM (Night)"
  }
};

// Mark step in without geo-fencing validation
export const markStepIn = async (req, res) => {
  try {
    // For manager step-in: employeeId comes from body, managerId from JWT token
    // For employee step-in: employeeId comes from JWT token, managerId from body
    const { employeeId, managerId, companyId, longitude, latitude, address, note, shift, status } = req.body;
    const authenticatedUserId = req.user.id;

    // Determine if this is manager step-in or employee step-in
    const isManagerStepIn = employeeId && employeeId !== authenticatedUserId;
    const finalEmployeeId = isManagerStepIn ? employeeId : authenticatedUserId;
    const finalManagerId = isManagerStepIn ? authenticatedUserId : managerId;

    // Validate required fields
    if (!finalEmployeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    // For employee step-ins, managerId is optional
    // For manager step-ins, managerId should be provided
    if (isManagerStepIn && !finalManagerId) {
      return res.status(400).json({
        success: false,
        message: "Manager ID is required for manager step-ins"
      });
    }

    // Get companyId from request or user context
    const finalCompanyId = companyId || req.user.companyId;
    if (!finalCompanyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required"
      });
    }

    // Check if there is already an open attendance for this employee
    const openAttendance = await Attendance.findOne({ employeeId: finalEmployeeId, stepOut: { $exists: false } });
    if (openAttendance) {
      return res.status(400).json({
        success: false,
        message: "Already stepped in. Please step out before stepping in again."
      });
    }

    const stepIn = new Date();
    const stepInImage = req.file ? req.file.filename : null;

    // Create attendance record
    const attendance = new Attendance({
      employeeId: finalEmployeeId,
      managerId: finalManagerId,
      companyId: finalCompanyId,
      stepIn,
      stepInImage,
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      address: address || 'Location not available',
      note,
      shift,
      status: status || 'present',
    });

    await attendance.save();
    await Employee.findByIdAndUpdate(finalEmployeeId, { isWorking: true });

    // Create route tracking for this attendance (optional)
    try {
      const route = new EmployeeRoute({
        employeeId: finalEmployeeId,
        attendanceId: attendance._id,
        startTime: stepIn,
        routePoints: [{
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          address: address || 'Location not available',
          timestamp: stepIn,
        }]
      });
      await route.save();
    } catch (routeError) {
      console.log('Route tracking failed:', routeError.message);
    }

    // Update employee location status (optional)
    try {
      const employee = await Employee.findById(finalEmployeeId);
      await EmployeeLocation.findOneAndUpdate(
        { employeeId: finalEmployeeId },
        {
          employeeId: finalEmployeeId,
          employeeName: employee.name,
          employeeCode: employee.empCode,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          address: address || 'Location not available',
          isOnline: true,
          lastSeen: new Date(),
          attendanceId: attendance._id,
          status: 'working',
          timestamp: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (locationError) {
      console.log('Location update failed:', locationError.message);
    }

    res.status(201).json({
      success: true,
      message: "Step In marked successfully",
      attendance: {
        _id: attendance._id,
        employeeId: attendance.employeeId,
        managerId: attendance.managerId,
        stepIn: attendance.stepIn,
        shift: attendance.shift,
        status: attendance.status,
        location: {
          latitude: attendance.latitude,
          longitude: attendance.longitude,
          address: attendance.address
        },
      }
    });

  } catch (error) {
    console.error("❌ [markStepIn] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error marking step in",
      error: error.message
    });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const {
      longitude,
      latitude,
      address,
      note,
      stepOut,
      stepOutImage,
      totalTime,
      employeeId,
      managerId,
      stepIn,
      shift,
      status,

    } = req.body;

    // Validate attendanceId
    if (!attendanceId) {
      return res.status(400).json({ message: "Attendance ID is required" });
    }

    // Find the attendance record
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Prepare update data
    const updateData = {};

    if (longitude !== undefined) updateData.longitude = longitude;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (address !== undefined) updateData.address = address;
    if (note !== undefined) updateData.note = note;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (managerId !== undefined) updateData.managerId = managerId;
    if (stepIn !== undefined) {
      updateData.stepIn = new Date(stepIn);
    }
    if (totalTime !== undefined) updateData.totalTime = totalTime;
    if (shift !== undefined) updateData.shift = shift;
    if (status !== undefined) updateData.status = status;

    // Handle stepOut update
    if (stepOut !== undefined) {
      updateData.stepOut = new Date(stepOut);

      // Calculate totalTime if not provided
      if (totalTime === undefined && attendance.stepIn) {
        const stepInTime = new Date(attendance.stepIn);
        const stepOutTime = new Date(stepOut);
        updateData.totalTime = Math.floor((stepOutTime - stepInTime) / (1000 * 60)); // in minutes
      }

      // Update employee working status when stepping out
      if (attendance.employeeId) {
        await Employee.findByIdAndUpdate(attendance.employeeId, { isWorking: false });
      }
    }

    // Handle image updates
    if (req.file) {
      // Determine which image to update based on field name or current state
      if (req.file.fieldname === 'stepOutImage' || stepOut !== undefined) {
        updateData.stepOutImage = req.file.filename;
      } else {
        updateData.stepInImage = req.file.filename;
      }
    }

    // Handle stepOutImage as string (if passed in body)
    if (stepOutImage !== undefined) {
      updateData.stepOutImage = stepOutImage;
    }

    // Update the attendance record
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: "Failed to update attendance record" });
    }

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error("Error updating attendance:", error);

    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        error: error.message
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid attendance ID format",
        error: error.message
      });
    }

    res.status(500).json({
      message: "Error updating attendance",
      error: error.message
    });
  }
};

export const bulkUpdateAttendance = async (req, res) => {
  try {
    const { attendanceIds, stepIn, stepOut, shift, status } = req.body;

    // Validate input
    if (!attendanceIds || !Array.isArray(attendanceIds)) {
      return res.status(400).json({ message: "attendanceIds must be an array" });
    }

    if (attendanceIds.length === 0) {
      return res.status(400).json({ message: "No attendance records selected" });
    }

    // Prepare update data
    const updateData = {};
    if (stepIn !== undefined) updateData.stepIn = new Date(stepIn);
    if (stepOut !== undefined) updateData.stepOut = new Date(stepOut);
    if (shift !== undefined) updateData.shift = shift;
    if (status !== undefined) updateData.status = status;

    // If both stepIn and stepOut are provided, calculate totalTime
    if (stepIn !== undefined && stepOut !== undefined) {
      const stepInTime = new Date(stepIn);
      const stepOutTime = new Date(stepOut);
      updateData.totalTime = Math.floor((stepOutTime - stepInTime) / (1000 * 60)); // in minutes
    }

    // Update all selected attendance records
    const result = await Attendance.updateMany(
      { _id: { $in: attendanceIds } },
      updateData,
      { runValidators: true }
    );

    // Update employee working status if stepping out
    if (stepOut !== undefined) {
      // Get all affected employeeIds
      const attendances = await Attendance.find({ _id: { $in: attendanceIds } });
      const employeeIds = [...new Set(attendances.map(a => a.employeeId))];

      await Employee.updateMany(
        { _id: { $in: employeeIds } },
        { isWorking: false }
      );
    }

    res.status(200).json({
      message: `Successfully updated ${result.modifiedCount} attendance records`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error bulk updating attendance:", error);
    res.status(500).json({ message: "Error bulk updating attendance", error });
  }
};

// Mark step out without geo-fencing validation
export const markStepOut = async (req, res) => {
  try {
    // Handle both employee self step-out and manager step-out
    const { employeeId, managerId, companyId, attendanceId, note, status, latitude, longitude, address } = req.body;
    const authenticatedUserId = req.user.id;

    // Determine if this is manager step-out or employee step-out
    const isManagerStepOut = employeeId && employeeId !== authenticatedUserId;
    const finalEmployeeId = isManagerStepOut ? employeeId : authenticatedUserId;

    console.log('🔔 [markStepOut] Step-out request:', {
      finalEmployeeId,
      attendanceId,
      location: { latitude, longitude },
      address,
      isManagerStepOut
    });

    if (!finalEmployeeId && !attendanceId) {
      return res.status(400).json({
        success: false,
        message: "Either employeeId or attendanceId is required"
      });
    }

    const stepOut = new Date();
    const stepOutImage = req.file ? req.file.filename : null;

    let attendance;

    if (attendanceId) {
      attendance = await Attendance.findById(attendanceId);
    } else {
      attendance = await Attendance.findOne({
        employeeId: finalEmployeeId,
        stepOut: { $exists: false }
      });
    }

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No open attendance record found for this employee"
      });
    }

    const totalTime = Math.round((stepOut - attendance.stepIn) / 60000);

    // Update attendance record
    attendance.stepOut = stepOut;
    attendance.stepOutImage = stepOutImage;
    attendance.totalTime = totalTime;
    attendance.note = note || attendance.note;
    attendance.status = status || attendance.status;

    // Update step-out location data if provided
    if (latitude && longitude) {
      attendance.stepOutLocation = {
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        address: address || 'Location not available'
      };
    }

    await attendance.save();
    await Employee.findByIdAndUpdate(attendance.employeeId, { isWorking: false });

    // Complete route tracking for this attendance
    try {
      const route = await EmployeeRoute.findOne({
        employeeId: attendance.employeeId,
        attendanceId: attendance._id,
        isActive: true
      });

      if (route) {
        // Add final route point if location provided
        if (latitude && longitude) {
          await route.addRoutePoint(
            parseFloat(latitude),
            parseFloat(longitude),
            address || 'Location not available',
            null
          );
        }

        // End the route
        await route.endRoute();
        console.log('🗺️ [markStepOut] Route tracking completed for employee:', attendance.employeeId);
      }
    } catch (routeError) {
      console.error('⚠️ [markStepOut] Failed to complete route tracking:', routeError);
    }

    // Update employee location status
    try {
      const employee = await Employee.findById(attendance.employeeId);
      await EmployeeLocation.findOneAndUpdate(
        { employeeId: attendance.employeeId },
        {
          status: 'tracking',
          attendanceId: null,
          lastSeen: new Date(),
          ...(latitude && longitude && {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            address: address || 'Location not available',
          })
        }
      );
    } catch (locationError) {
      console.error('⚠️ [markStepOut] Failed to update location:', locationError);
    }

    console.log('✅ [markStepOut] Step-out successful for employee:', attendance.employeeId);

    res.status(200).json({
      success: true,
      message: "Step Out marked successfully",
      attendance: {
        _id: attendance._id,
        employeeId: attendance.employeeId,
        stepIn: attendance.stepIn,
        stepOut: attendance.stepOut,
        totalTime: attendance.totalTime,
        shift: attendance.shift,
        status: attendance.status,
        stepInLocation: {
          latitude: attendance.latitude,
          longitude: attendance.longitude,
          address: attendance.address
        },
        ...(attendance.stepOutLocation && {
          stepOutLocation: attendance.stepOutLocation
        }),

      }
    });

  } catch (error) {
    console.error("❌ [markStepOut] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error marking step out",
      error: error.message
    });
  }
};

// Check if employee is currently stepped in
export const checkEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Check if there is an open attendance for this employee
    const openAttendance = await Attendance.findOne({
      employeeId,
      stepOut: { $exists: false }
    }).populate('employeeId', 'name email');

    if (openAttendance) {
      return res.status(200).json({
        isSteppedIn: true,
        attendance: openAttendance,
        message: `Employee is currently stepped in since ${new Date(openAttendance.stepIn).toLocaleString()}`
      });
    } else {
      return res.status(200).json({
        isSteppedIn: false,
        message: "Employee is not currently stepped in"
      });
    }
  } catch (error) {
    console.error("Error checking employee status:", error);
    res.status(500).json({ message: "Error checking employee status", error });
  }
};

// Get all attendance for an employee - Show only latest entry per day
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required in params" });
    }

    // Get all attendance records for this employee
    const allAttendance = await Attendance.find({ employeeId })
      .populate("employeeId")
      .populate("managerId")
      .sort({ createdAt: -1 }); // Sort by newest first

    // Group by date, keeping only the latest entry per day
    const attendanceMap = new Map();

    allAttendance.forEach(record => {
      const dateKey = new Date(record.stepIn).toDateString(); // Use stepIn date as key

      // Only keep the latest record for each date
      if (!attendanceMap.has(dateKey)) {
        attendanceMap.set(dateKey, record);
      }
    });

    // Convert map back to array and sort by stepIn date (newest first)
    const uniqueAttendance = Array.from(attendanceMap.values())
      .sort((a, b) => new Date(b.stepIn) - new Date(a.stepIn));

    res.status(200).json({ attendance: uniqueAttendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Error fetching attendance", error });
  }
};

// Get all attendance records (for admin reports) - Show only latest entry per employee per day
export const getAllAttendance = async (req, res) => {
  try {
    // Get all attendance records
    const allAttendance = await Attendance.find({})
      .populate("employeeId")
      .populate("managerId")
      .sort({ createdAt: -1 }); // Sort by newest first

    // Group by employee and date, keeping only the latest entry per day
    const attendanceMap = new Map();

    allAttendance.forEach(record => {
      if (!record.employeeId) return; // Skip records without employee

      const employeeId = record.employeeId._id || record.employeeId;
      const dateKey = new Date(record.stepIn).toDateString(); // Use stepIn date as key
      const mapKey = `${employeeId}_${dateKey}`;

      // Only keep the latest record for each employee-date combination
      if (!attendanceMap.has(mapKey)) {
        attendanceMap.set(mapKey, record);
      }
    });

    // Convert map back to array and sort by stepIn date (newest first)
    const uniqueAttendance = Array.from(attendanceMap.values())
      .sort((a, b) => new Date(b.stepIn) - new Date(a.stepIn));

    res.status(200).json({ attendance: uniqueAttendance });
  } catch (error) {
    console.error("Error fetching all attendance:", error);
    res.status(500).json({ message: "Error fetching all attendance", error });
  }
};

// Delete attendance record
export const deleteAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    if (!attendanceId) {
      return res.status(400).json({ message: "Attendance ID is required" });
    }

    const deletedAttendance = await Attendance.findByIdAndDelete(attendanceId);

    if (!deletedAttendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    // Update employee working status if they were clocked in
    if (deletedAttendance.employeeId && !deletedAttendance.stepOut) {
      await Employee.findByIdAndUpdate(deletedAttendance.employeeId, { isWorking: false });
    }

    res.status(200).json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ message: "Error deleting attendance record", error });
  }
};

export const locationWiseAttendence = async (req, res) => {
  try {
    const { date } = req.query;
    let targetDate = date ? new Date(date) : new Date();

    if (date && isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format. Use YYYY-MM-DD format"
      });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const locations = await Location.aggregate([
      // Join managers
      {
        $lookup: {
          from: "managers",
          localField: "_id",
          foreignField: "location",
          as: "managers"
        }
      },
      // For each manager, lookup employees
      {
        $lookup: {
          from: "employees",
          localField: "managers._id",
          foreignField: "managerId",
          as: "employees"
        }
      },
      // For each employee, lookup attendances
      {
        $lookup: {
          from: "attendances",
          let: { empId: "$employees._id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$employeeId", "$$empId"] },
                    { $gte: ["$createdAt", startOfDay] },
                    { $lte: ["$createdAt", endOfDay] }
                  ]
                }
              }
            }
          ],
          as: "attendanceData"
        }
      },
      // Attach employees + attendanceData inside managers
      {
        $addFields: {
          managers: {
            $map: {
              input: "$managers",
              as: "mgr",
              in: {
                _id: "$$mgr._id",
                name: "$$mgr.name",
                email: "$$mgr.email",
                mobile: "$$mgr.mobile",
                // Full employees under this manager
                employees: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$employees",
                        as: "emp",
                        cond: { $eq: ["$$emp.managerId", "$$mgr._id"] }
                      }
                    },
                    as: "emp",
                    in: {
                      _id: "$$emp._id",
                      name: "$$emp.name",
                      email: "$$emp.email",
                      mobile: "$$emp.mobile",
                      position: "$$emp.position",
                      // Attach attendanceData
                      attendanceData: {
                        $filter: {
                          input: "$attendanceData",
                          as: "att",
                          cond: { $eq: ["$$att.employeeId", "$$emp._id"] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          managers: 1
        }
      },
      { $sort: { name: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: locations,
      attendanceDate: targetDate.toISOString().split("T")[0]
    });

  } catch (err) {
    console.error("Error in locationWiseAttendance:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Get employee routes for admin map visualization
export const getEmployeeRoutes = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get routes with populated employee data
    const routes = await EmployeeRoute.find(query)
      .populate('employeeId', 'name empCode designation email')
      .populate('attendanceId', 'stepIn stepOut shift status')
      .sort({ startTime: -1 })
      .limit(50); // Limit to recent 50 routes

    // Format routes for frontend
    const formattedRoutes = routes.map(route => ({
      _id: route._id,
      employeeId: route.employeeId._id,
      employeeName: route.employeeId.name,
      empCode: route.employeeId.empCode,
      designation: route.employeeId.designation,
      attendanceId: route.attendanceId._id,
      startTime: route.startTime,
      endTime: route.endTime,
      totalDistance: route.totalDistance,
      status: route.status,
      routePoints: route.routePoints.map(point => ({
        latitude: point.latitude,
        longitude: point.longitude,
        address: point.address,
        timestamp: point.timestamp,
        accuracy: point.accuracy
      })),
      duration: route.duration,
      isActive: route.isActive
    }));

    res.status(200).json({
      success: true,
      data: formattedRoutes,
      count: formattedRoutes.length
    });

  } catch (error) {
    console.error('❌ [getEmployeeRoutes] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee routes',
      error: error.message
    });
  }
};

// Get live step-ins within the last 24 hours
export const getLiveStepIns = async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log('🔄 [getLiveStepIns] Fetching step-ins from last 24 hours...');

    // Get all step-ins from the last 24 hours
    const liveStepIns = await Attendance.find({
      stepIn: { $gte: twentyFourHoursAgo },
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    })
      .populate('employeeId', 'name empCode email designation')
      .populate('managerId', 'name email')
      .sort({ stepIn: -1 })
      .limit(50);

    // Filter step-ins from the last 24 hours
    const recentStepIns = liveStepIns.filter(stepIn => {
      const stepInTime = new Date(stepIn.stepIn);
      return stepInTime >= twentyFourHoursAgo;
    });

    // Format response
    const formattedStepIns = recentStepIns.map(stepIn => ({
      _id: stepIn._id,
      employeeId: stepIn.employeeId,
      managerId: stepIn.managerId,
      stepIn: stepIn.stepIn,
      stepOut: stepIn.stepOut,
      latitude: stepIn.latitude,
      longitude: stepIn.longitude,
      address: stepIn.address,
      shift: stepIn.shift,
      status: stepIn.status,
      note: stepIn.note,
      totalTime: stepIn.totalTime,
      createdAt: stepIn.createdAt,
      updatedAt: stepIn.updatedAt
    }));

    console.log(`✅ [getLiveStepIns] Found ${formattedStepIns.length} live step-ins`);

    res.status(200).json({
      success: true,
      message: "Live step-ins retrieved successfully",
      data: formattedStepIns,
      count: formattedStepIns.length,
      timeRange: {
        from: twentyFourHoursAgo,
        to: now
      }
    });

  } catch (error) {
    console.error('❌ [getLiveStepIns] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching live step-ins",
      error: error.message
    });
  }
};

// Export Attendance to Excel
export const exportAttendanceExcel = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Get company details
    const company = await Company.findById(companyId);

    // Get employees for this company
    const employees = await Employee.find({
      companyId: companyId,
      role: "employee"
    }).select('_id');

    const employeeIds = employees.map(emp => emp._id);

    // Get attendance records
    const attendanceRecords = await Attendance.find({ employeeId: { $in: employeeIds } })
      .populate('employeeId', 'name empCode email position')
      .populate('managerId', 'name email')
      .sort({ stepIn: -1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Add headers
    worksheet.columns = [
      { header: 'Employee Code', key: 'empCode', width: 15 },
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Shift', key: 'shift', width: 15 },
      { header: 'Clock In', key: 'clockIn', width: 20 },
      { header: 'Clock Out', key: 'clockOut', width: 20 },
      { header: 'Total Hours', key: 'totalHours', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Manager', key: 'manager', width: 25 },
      { header: 'Location', key: 'location', width: 30 }
    ];

    // Add data rows
    attendanceRecords.forEach(record => {
      if (record.employeeId) {
        const totalHours = record.totalTime ? (record.totalTime / 60).toFixed(2) : 'N/A';
        const clockInTime = record.stepIn ? new Date(record.stepIn).toLocaleString() : 'N/A';
        const clockOutTime = record.stepOut ? new Date(record.stepOut).toLocaleString() : 'N/A';
        const date = record.stepIn ? new Date(record.stepIn).toLocaleDateString() : 'N/A';

        worksheet.addRow({
          empCode: record.employeeId.empCode || 'N/A',
          name: record.employeeId.name,
          position: record.employeeId.position || 'N/A',
          date: date,
          shift: record.shift || 'N/A',
          clockIn: clockInTime,
          clockOut: clockOutTime,
          totalHours: totalHours,
          status: record.status || 'N/A',
          manager: record.managerId ? record.managerId.name : 'N/A',
          location: record.address || 'N/A'
        });
      }
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    const fileName = `Attendance_${company?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error exporting attendance to Excel:", error);
    res.status(500).json({ message: "Error exporting attendance to Excel", error: error.message });
  }
};

// Export Attendance to PDF
export const exportAttendancePDF = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Get company details
    const company = await Company.findById(companyId);

    // Get employees for this company
    const employees = await Employee.find({
      companyId: companyId,
      role: "employee"
    }).select('_id');

    const employeeIds = employees.map(emp => emp._id);

    // Get attendance records
    const attendanceRecords = await Attendance.find({ employeeId: { $in: employeeIds } })
      .populate('employeeId', 'name empCode email position')
      .populate('managerId', 'name email')
      .sort({ stepIn: -1 });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const fileName = `Attendance_${company?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    // Add company info
    if (company) {
      doc.fontSize(14).text(`Company: ${company.name}`, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    }

    doc.moveDown();

    // Add table headers
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;

    doc.fontSize(10);
    doc.text('Emp Code', col1, tableTop);
    doc.text('Name', col2, tableTop);
    doc.text('Date', col3, tableTop);
    doc.text('Clock In', col4, tableTop);
    doc.text('Status', col5, tableTop);

    // Add data rows
    let yPosition = tableTop + 20;
    attendanceRecords.forEach((record, index) => {
      if (record.employeeId && yPosition < 750) { // Check page height
        const date = record.stepIn ? new Date(record.stepIn).toLocaleDateString() : 'N/A';
        const clockInTime = record.stepIn ? new Date(record.stepIn).toLocaleTimeString() : 'N/A';

        doc.text(record.employeeId.empCode || 'N/A', col1, yPosition);
        doc.text(record.employeeId.name, col2, yPosition);
        doc.text(date, col3, yPosition);
        doc.text(clockInTime, col4, yPosition);
        doc.text(record.status || 'N/A', col5, yPosition);

        yPosition += 20;
      }

      // Add new page if needed
      if (yPosition > 750) {
        doc.addPage();
        yPosition = 50;
      }
    });

    // Add summary
    doc.addPage();
    doc.fontSize(16).text('Summary', { align: 'center' });
    doc.moveDown();

    const totalRecords = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;

    doc.fontSize(12);
    doc.text(`Total Records: ${totalRecords}`);
    doc.text(`Present: ${presentCount}`);
    doc.text(`Absent: ${absentCount}`);

    doc.end();

  } catch (error) {
    console.error("Error exporting attendance to PDF:", error);
    res.status(500).json({ message: "Error exporting attendance to PDF", error: error.message });
  }
};

// Get attendance summary
export const getAttendanceSummary = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Get employees for this company
    const employees = await Employee.find({
      companyId: companyId,
      role: "employee"
    }).select('_id');

    const employeeIds = employees.map(emp => emp._id);

    // Get attendance records
    const attendanceRecords = await Attendance.find({ employeeId: { $in: employeeIds } });

    // Calculate summary
    const summary = {
      totalRecords: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.status === 'present').length,
      absent: attendanceRecords.filter(r => r.status === 'absent').length,
      late: attendanceRecords.filter(r => r.status === 'late').length,
      halfDay: attendanceRecords.filter(r => r.status === 'half-day').length,
      totalHours: attendanceRecords.reduce((sum, r) => sum + (r.totalTime || 0), 0) / 60,
      morningShift: attendanceRecords.filter(r => r.shift === 'morning').length,
      eveningShift: attendanceRecords.filter(r => r.shift === 'evening').length,
      nightShift: attendanceRecords.filter(r => r.shift === 'night').length
    };

    res.status(200).json({
      message: "Attendance summary retrieved successfully",
      summary
    });

  } catch (error) {
    console.error("Error getting attendance summary:", error);
    res.status(500).json({ message: "Error getting attendance summary", error: error.message });
  }
};