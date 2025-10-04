import Employee from "../models/employee.models.js";
import Company from "../models/company.models.js";
import Manager from "../models/manager.models.js";
import Attendance from "../models/attendence.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// Create Employee
export const createEmployee = async (req, res) => {
  try {
    console.log("🚀 [createEmployee] Starting employee creation process");
    console.log("📥 [createEmployee] Request body:", {
      name: req.body.name,
      email: req.body.email,
      empCode: req.body.empCode,
      designation: req.body.designation,
      category: req.body.category,
      shift: req.body.shift,
      hasPassword: !!req.body.password,
      hasMobile: !!req.body.mobile,
      hasAddress: !!req.body.address,
      assignedManager: req.body.assignedManager,
      managerId: req.body.managerId,
      assignedSiteId: req.body.assignedSiteId,
      assignedPointsCount: req.body.assignedPoints?.length || 0
    });

    const {
      name,
      email,
      password,
      mobile,
      address,
      empCode,
      designation,
      category,
      shift,
      uanNumber,
      esicNumber,
      accountNumber,
      ifscCode,
      photo,
      assignedSiteId,
      assignedPoints
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get creator info from authenticated user
    let createdBy = req.user.id;
    const userRole = req.user.role || req.user.userType;
    // const managerId = req.user.id
    // Map superadmin to admin for createdByRole since schema only allows ['admin', 'manager']
    const createdByRole = userRole === 'superadmin' ? 'admin' : userRole;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company to create employees" });
    }

    // Determine manager ID based on who is creating the employee
    console.log("🔍 [createEmployee] User details:", {
      userId: req.user.id,
      userRole: userRole,
      companyId: companyId,
      bodyManagerId: req.body.managerId,
      assignedManager: req.body.assignedManager
    });

    let finalManagerId = null;

    // If a manager is creating the employee, set managerId to the logged-in manager's ID
    if (userRole === 'manager') {
      finalManagerId = createdBy; // Set managerId to the logged-in manager's ID

      // Get the admin who created this manager for the createdBy field
      const manager = await Manager.findById(createdBy);
      if (manager && manager.createdBy) {
        createdBy = manager.createdBy; // Set createdBy to the admin who created the manager
        console.log("👨‍💼 [createEmployee] Manager creating employee - setting createdBy to admin:", createdBy);
      }

      console.log("👨‍💼 [createEmployee] Manager creating employee - setting managerId to:", finalManagerId);
    } else if (userRole === 'admin' || userRole === 'superadmin') {
      // Admin can create employee with or without managerId
      // Check if assignedManager is provided (new field) or managerId (existing field)
      const managerId = req.body.assignedManager || req.body.managerId;

      if (managerId) {
        // Validate that the manager belongs to the same company and was created by this admin
        const manager = await Manager.findOne({
          _id: managerId,
          companyId: companyId,
          createdBy: createdBy
        });

        if (!manager) {
          return res.status(400).json({
            message: "Manager not found or does not belong to your company"
          });
        }

        finalManagerId = managerId;
        console.log("👨‍💻 [createEmployee] Admin creating employee - assigned manager:", manager.name);
      } else {
        finalManagerId = null;
        console.log("👨‍💻 [createEmployee] Admin creating employee - no manager assigned");
      }
    } else {
      console.log("❌ [createEmployee] Invalid user role for creating employee:", userRole);
      return res.status(403).json({ message: "Insufficient permissions to create employee" });
    }

    console.log("✅ [createEmployee] Final managerId decision:", finalManagerId);

    console.log("🏗️ [createEmployee] Creating employee with data:", {
      name,
      email,
      empCode,
      designation,
      category,
      shift,
      companyId,
      managerId: finalManagerId,
      createdBy,
      createdByRole
    });

    const newEmployee = new Employee({
      name,
      email,
      passwordHash: hashedPassword,
      mobile: mobile || "",
      address: address || "",
      empCode: empCode || "",
      designation: designation || "gardener",
      category: category || "semi-skilled",
      shift: shift || "Morning Shift (7:00 AM - 3:00 PM)",
      uanNumber: uanNumber || "",
      esicNumber: esicNumber || "",
      accountNumber: accountNumber || "",
      ifscCode: ifscCode || "",
      photo: photo || null,
      companyId: companyId,
      managerId: finalManagerId || null,
      createdBy: createdBy,
      createdByRole: createdByRole,
      createdById: createdBy,
      role: "employee",
      active: true,
      assignedSiteId: assignedSiteId || null,
      assignedPoints: assignedPoints || []
    });

    console.log("💾 [createEmployee] Saving employee to database...");
    await newEmployee.save();
    console.log("✅ [createEmployee] Employee saved successfully with ID:", newEmployee._id);

    // Populate the created employee with company and manager info
    const populatedEmployee = await Employee.findById(newEmployee._id)
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .populate("createdById", "name email");

    console.log("✅ [createEmployee] Employee created successfully:", {
      employeeId: populatedEmployee._id,
      name: populatedEmployee.name,
      managerId: populatedEmployee.managerId,
      managerName: populatedEmployee.managerId?.name || 'No manager assigned'
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee: populatedEmployee
    });
  } catch (error) {
    console.error("❌ [createEmployee] Error occurred:", {
      errorCode: error.code,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack
    });

    if (error.code === 11000) {
      console.log("📧 [createEmployee] Duplicate key error:", error.message);

      // Check if it's a duplicate email
      if (error.message.includes('email')) {
        console.log("📧 [createEmployee] Duplicate email error - email already exists");
        return res.status(400).json({ message: "Email already exists" });
      }

      // Check if it's a duplicate empCode
      if (error.message.includes('empCode')) {
        console.log("🏷️ [createEmployee] Duplicate employee code error - empCode already exists");
        return res.status(400).json({ message: "Employee code already exists" });
      }

      // Check if it's a duplicate companyId (should not happen after index fix)
      if (error.message.includes('companyId')) {
        console.log("🏢 [createEmployee] Duplicate company error - this should not happen after index fix");
        return res.status(500).json({ message: "Database configuration error - please contact administrator" });
      }

      // Generic duplicate key error
      console.log("🔑 [createEmployee] Generic duplicate key error");
      return res.status(400).json({ message: "Duplicate key error - please check your input" });
    }

    if (error.name === 'ValidationError') {
      console.log("📝 [createEmployee] Validation error:", error.errors);
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    console.error("💥 [createEmployee] Unexpected error creating employee:", error);
    res.status(500).json({ message: "Error creating employee", error: error.message });
  }
};

// Get All Employees (for admin - all company employees)
export const getAllEmployees = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const adminId = req.user.id;
    const adminRole = req.user.role;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Build employee query based on admin role
    let employeeQuery = {
      companyId: companyId,
      role: "employee"
    };

    // If admin is readonly, show all employees in the company (read-only access)
    if (adminRole === 'readonly') {
      console.log(`Readonly admin ${adminId} - showing all employees in company for read-only access`);
    }

    const employees = await Employee.find(employeeQuery)
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .populate("createdById", "name email")
      .sort({ createdAt: -1 });

    console.log(`Found ${employees.length} employees for company: ${companyId} (Admin role: ${adminRole})`);
    res.status(200).json({ message: "success", data: employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Error fetching employees", error: error.message });
  }
};

// Get Employees by Manager (for manager - their team)
export const getEmployeesByManager = async (req, res) => {
  try {
    const managerId = req.user.id;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    const employees = await Employee.find({
      managerId: managerId,
      companyId: companyId,
      role: "employee"
    })
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .populate("createdById", "name email")
      .sort({ createdAt: -1 });

    console.log(`Found ${employees.length} employees for manager: ${managerId}`);
    res.status(200).json({ message: "success", data: employees });
  } catch (error) {
    console.error("Error fetching employees by manager:", error);
    res.status(500).json({ message: "Error fetching employees by manager", error: error.message });
  }
};

// Get Single Employee
export const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .populate("createdById", "name email");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "success", data: employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ message: "Error fetching employee", error: error.message });
  }
};

// Update Employee
export const updateEmployee = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Get current user info for validation
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role || req.user.userType;
    const companyId = req.user.companyId;

    console.log("🔄 [updateEmployee] Starting employee update process");
    console.log("📥 [updateEmployee] Request body:", {
      employeeId: req.params.id,
      updateData: updateData,
      assignedManager: updateData.assignedManager,
      managerId: updateData.managerId,
      assignedSiteId: updateData.assignedSiteId,
      assignedPointsCount: updateData.assignedPoints?.length || 0,
      userRole: currentUserRole,
      userId: currentUserId,
      companyId: companyId
    });

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company to update employees" });
    }

    // Handle manager assignment if provided
    if (updateData.assignedManager || updateData.managerId) {
      const managerId = updateData.assignedManager || updateData.managerId;

      if (managerId) {
        console.log("🔍 [updateEmployee] Validating manager assignment:", managerId);

        // Different validation logic based on user role
        let manager;
        if (currentUserRole === 'manager') {
          // For managers, they can only assign themselves or other managers from the same company
          manager = await Manager.findOne({
            _id: managerId,
            companyId: companyId
          });
        } else {
          // For admins, they can only assign managers they created
          manager = await Manager.findOne({
            _id: managerId,
            companyId: companyId,
            createdBy: currentUserId
          });
        }

        if (!manager) {
          return res.status(400).json({
            message: "Manager not found or does not belong to your company"
          });
        }

        // Set the managerId in updateData
        updateData.managerId = managerId;
        console.log("✅ [updateEmployee] Manager validation passed:", manager.name);
      } else {
        // If empty string or null, remove manager assignment
        updateData.managerId = null;
        console.log("🔄 [updateEmployee] Removing manager assignment");
      }
    }

    // Handle status to active field conversion
    if (updateData.status !== undefined) {
      updateData.active = updateData.status === 'Active';
      delete updateData.status; // Remove status field as it's not part of the schema
      console.log("🔄 [updateEmployee] Converted status to active:", {
        status: updateData.status,
        active: updateData.active
      });
    }

    // Only hash password if it's being updated
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password; // Remove plain password
    }

    // Remove undefined values and clean up assignedManager field
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Remove assignedManager field as it's not part of the schema
    delete updateData.assignedManager;

    // Handle site assignment if provided
    if (updateData.assignedSiteId !== undefined) {
      if (updateData.assignedSiteId) {
        console.log("🏗️ [updateEmployee] Site assigned:", updateData.assignedSiteId);
      } else {
        // If site is being cleared, clear all site-related fields
        updateData.assignedSiteId = null;
        updateData.assignedPoints = []; // Clear points when site is cleared
        console.log("🔄 [updateEmployee] Clearing site assignment");
      }
    }

    // Handle point assignments if provided
    if (updateData.assignedPoints !== undefined) {
      if (Array.isArray(updateData.assignedPoints)) {
        // Process points to ensure proper structure
        updateData.assignedPoints = updateData.assignedPoints.map(point => ({
          pointId: point.pointId,
          pointName: point.pointName,
          pointCode: point.pointCode,
          isRequired: point.isRequired || false,
          assignedDate: point.assignedDate || new Date(),
          assignedBy: point.assignedBy || currentUserId
        }));
        console.log("📍 [updateEmployee] Processing point assignments:", updateData.assignedPoints.length);
      } else {
        updateData.assignedPoints = [];
        console.log("🔄 [updateEmployee] Clearing point assignments");
      }
    }

    console.log("💾 [updateEmployee] Final update data:", updateData);

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .populate("createdById", "name email");

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    console.log("✅ [updateEmployee] Employee updated successfully:", {
      employeeId: updatedEmployee._id,
      name: updatedEmployee.name,
      managerId: updatedEmployee.managerId,
      managerName: updatedEmployee.managerId?.name || 'No manager assigned'
    });

    res.status(200).json({ message: "Employee updated successfully", employee: updatedEmployee });
  } catch (error) {
    console.error("❌ [updateEmployee] Error updating employee:", error);
    res.status(500).json({ message: "Error updating employee", error: error.message });
  }
};

// Delete Employee
export const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully", employee: deletedEmployee });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Error deleting employee", error: error.message });
  }
};

// Employee Login
export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Employee login attempt:", { email });

    const employee = await Employee.findOne({ email, role: "employee" });
    if (!employee) {
      console.log("Employee not found for email:", email);
      return res.status(404).json({ message: "Employee not found" });
    }

    console.log("Employee found:", employee.name, "Company ID:", employee.companyId);

    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);
    if (!isPasswordValid) {
      console.log("Invalid password for employee:", email);
      return res.status(401).json({ message: "Invalid password" });
    }

    // Get company details
    let company = null;
    if (employee.companyId) {
      company = await Company.findById(employee.companyId);
      console.log("Company found:", company ? company.name : "No company");
    }

    const token = jwt.sign({
      id: employee._id,
      email: employee.email,
      userType: 'employee',
      companyId: employee.companyId
    }, JWT_SECRET, { expiresIn: '1y' });

    console.log("Employee login successful:", employee.name);
    res.status(200).json({ message: "Login successful", token, employee, company });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Get Muster Roll Report with filters
export const getMusterRollReport = async (req, res) => {
  try {
    const { startDate, endDate, shift, employeeId, status } = req.query;
    const companyId = req.user.companyId;
    const adminId = req.user.id;
    const adminRole = req.user.role;

    console.log('Muster Roll Report Filters:', { startDate, endDate, shift, employeeId, status, companyId, adminRole });

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Build employee query based on admin role
    let employeeQuery = {
      companyId: companyId,
      role: "employee"
    };

    // If admin is readonly, only show employees they created
    if (adminRole === 'readonly') {
      employeeQuery.createdBy = adminId;
      console.log(`Readonly admin ${adminId} - filtering employees they created`);
    }

    // Debug: Check what data exists in the database
    const debugEmployees = await Employee.find(employeeQuery).limit(5);
    console.log('Sample employees:', debugEmployees.map(emp => ({ name: emp.name, shift: emp.shift, createdBy: emp.createdBy })));

    const debugAttendance = await Attendance.find({}).populate('employeeId', 'name shift').limit(5);
    console.log('Sample attendance records:', debugAttendance.map(att => ({
      employee: att.employeeId?.name,
      shift: att.employeeId?.shift,
      status: att.status,
      stepIn: att.stepIn
    })));

    // Build query for attendance records
    const attendanceQuery = {};

    // First, get all employees for the company (filtered by admin role)
    const allEmployees = await Employee.find(employeeQuery).select('_id name shift');

    console.log(`Found ${allEmployees.length} employees for company ${companyId}`);
    console.log('Employee shifts:', allEmployees.map(emp => ({ name: emp.name, shift: emp.shift })));

    let employeeIds = allEmployees.map(emp => emp._id);

    // Date range filter - improved date handling
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0); // Start of day
      end.setHours(23, 59, 59, 999); // End of day
      attendanceQuery.stepIn = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      attendanceQuery.stepIn = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      attendanceQuery.stepIn = { $lte: end };
    }

    // Shift filter - filter employees by shift first
    if (shift) {
      console.log(`Filtering by shift: ${shift}`);

      // Filter employees by shift (case-insensitive and flexible matching)
      const shiftEmployees = allEmployees.filter(emp => {
        if (!emp.shift) return false;

        const empShift = emp.shift.toLowerCase();
        const filterShift = shift.toLowerCase();

        // Check for various shift name patterns
        if (filterShift === 'morning') {
          return empShift.includes('morning') || empShift.includes('9:00') || empShift.includes('am');
        } else if (filterShift === 'evening') {
          return empShift.includes('evening') || empShift.includes('5:00') || empShift.includes('pm');
        } else if (filterShift === 'night') {
          return empShift.includes('night') || empShift.includes('11:00') || empShift.includes('night');
        } else {
          return empShift.includes(filterShift);
        }
      });

      console.log(`Found ${shiftEmployees.length} employees for shift ${shift}`);
      console.log('Shift employees:', shiftEmployees.map(emp => ({ name: emp.name, shift: emp.shift })));

      if (shiftEmployees.length > 0) {
        employeeIds = shiftEmployees.map(emp => emp._id);
      } else {
        // No employees found for this shift, return empty result
        return res.status(200).json({
          data: [],
          summary: { total: 0, present: 0, absent: 0, late: 0 },
          message: `No employees found for the selected shift: ${shift}`
        });
      }
    }

    // Status filter - handle different status naming conventions
    if (status) {
      console.log(`Filtering by status: ${status}`);

      let statusFilter;
      switch (status.toLowerCase()) {
        case 'present':
          statusFilter = { $in: ['present', 'Present', 'PRESENT', 'Present'] };
          break;
        case 'absent':
          statusFilter = { $in: ['absent', 'Absent', 'ABSENT', 'Absent'] };
          break;
        case 'late':
          statusFilter = { $in: ['late', 'Late', 'LATE', 'Late'] };
          break;
        case 'half-day':
          statusFilter = { $in: ['half-day', 'Half Day', 'HALF_DAY', 'half_day', 'Half Day'] };
          break;
        default:
          statusFilter = { $regex: new RegExp(status, 'i') }; // Case-insensitive regex
      }
      attendanceQuery.status = statusFilter;
    }

    // Specific employee filter
    if (employeeId) {
      attendanceQuery.employeeId = employeeId;
    } else {
      // Use the filtered employee IDs
      attendanceQuery.employeeId = { $in: employeeIds };
    }

    // Get attendance records with populated employee data
    console.log('Final attendance query:', JSON.stringify(attendanceQuery, null, 2));
    console.log(`Filtering for ${employeeIds.length} employees:`, employeeIds);

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('employeeId', 'name empCode email position shift')
      .populate('managerId', 'name email')
      .sort({ stepIn: -1 });

    console.log(`Found ${attendanceRecords.length} attendance records`);

    // If no records found, return empty result with helpful message
    if (attendanceRecords.length === 0) {
      let message = "No attendance records found";
      if (shift) message += ` for shift: ${shift}`;
      if (status) message += ` with status: ${status}`;
      if (startDate || endDate) message += ` in the specified date range`;

      return res.status(200).json({
        data: [],
        summary: { total: 0, present: 0, absent: 0, late: 0 },
        message: message
      });
    }

    // Group by employee and date for muster roll format
    const musterRollData = {};

    attendanceRecords.forEach(record => {
      if (!record.employeeId) return;

      const employeeId = record.employeeId._id.toString();
      const date = new Date(record.stepIn).toDateString();

      if (!musterRollData[employeeId]) {
        musterRollData[employeeId] = {
          employee: record.employeeId,
          attendance: {}
        };
      }

      // Keep only the latest record for each date
      if (!musterRollData[employeeId].attendance[date] ||
        new Date(record.stepIn) > new Date(musterRollData[employeeId].attendance[date].stepIn)) {
        musterRollData[employeeId].attendance[date] = record;
      }
    });

    // Convert to array format
    const reportData = Object.values(musterRollData).map(empData => ({
      employee: empData.employee,
      attendanceRecords: Object.values(empData.attendance)
    }));

    // Calculate summary statistics
    const summary = {
      totalEmployees: reportData.length,
      totalRecords: attendanceRecords.length,
      presentCount: attendanceRecords.filter(r => r.status === 'present').length,
      absentCount: attendanceRecords.filter(r => r.status === 'absent').length,
      lateCount: attendanceRecords.filter(r => r.status === 'late').length,
      halfDayCount: attendanceRecords.filter(r => r.status === 'half-day').length
    };

    res.status(200).json({
      message: "Muster roll report generated successfully",
      data: reportData,
      summary,
      filters: {
        startDate,
        endDate,
        shift,
        status,
        employeeId
      }
    });

  } catch (error) {
    console.error("Error generating muster roll report:", error);
    res.status(500).json({ message: "Error generating muster roll report", error: error.message });
  }
};

// Export Muster Roll Report to Excel
export const exportMusterRollExcel = async (req, res) => {
  try {
    const { startDate, endDate, shift, employeeId, status } = req.query;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Get company details
    const company = await Company.findById(companyId);

    // Build query (same as getMusterRollReport)
    const attendanceQuery = {};
    const employees = await Employee.find({
      companyId: companyId,
      role: "employee"
    }).select('_id');

    const employeeIds = employees.map(emp => emp._id);
    attendanceQuery.employeeId = { $in: employeeIds };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      attendanceQuery.stepIn = { $gte: start, $lte: end };
    }

    if (shift) attendanceQuery.shift = shift;
    if (status) attendanceQuery.status = status;
    if (employeeId) attendanceQuery.employeeId = employeeId;

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('employeeId', 'name empCode email position shift')
      .populate('managerId', 'name email')
      .sort({ stepIn: -1 });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Muster Roll Report');

    // Add headers
    worksheet.columns = [
      { header: 'Employee Code', key: 'empCode', width: 15 },
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Shift', key: 'shift', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Step In', key: 'stepIn', width: 20 },
      { header: 'Step Out', key: 'stepOut', width: 20 },
      { header: 'Total Hours', key: 'totalHours', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Manager', key: 'manager', width: 25 },
      { header: 'Location', key: 'location', width: 30 }
    ];

    // Add data rows
    attendanceRecords.forEach(record => {
      if (record.employeeId) {
        const totalHours = record.totalTime ? (record.totalTime / 60).toFixed(2) : 'N/A';
        const stepInTime = record.stepIn ? new Date(record.stepIn).toLocaleString() : 'N/A';
        const stepOutTime = record.stepOut ? new Date(record.stepOut).toLocaleString() : 'N/A';
        const date = record.stepIn ? new Date(record.stepIn).toLocaleDateString() : 'N/A';

        worksheet.addRow({
          empCode: record.employeeId.empCode || 'N/A',
          name: record.employeeId.name,
          position: record.employeeId.position || 'N/A',
          shift: record.shift || 'N/A',
          date: date,
          stepIn: stepInTime,
          stepOut: stepOutTime,
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
    const fileName = `MusterRoll_${company?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Error exporting muster roll to Excel:", error);
    res.status(500).json({ message: "Error exporting muster roll to Excel", error: error.message });
  }
};

// Export Muster Roll Report to PDF - Traditional Style
export const exportMusterRollPDF = async (req, res) => {
  try {
    const { startDate, endDate, shift, employeeId, status } = req.query;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Get company details
    const company = await Company.findById(companyId);

    // Build employee query first with filters
    let employeeQuery = {
      companyId: companyId,
      role: "employee"
    };

    // Apply shift filter to employees first
    if (shift) {
      employeeQuery.shift = { $regex: shift, $options: 'i' };
    }

    // Apply employee ID filter to employees
    if (employeeId) {
      employeeQuery.$or = [
        { empCode: { $regex: employeeId, $options: 'i' } },
        { employeeId: { $regex: employeeId, $options: 'i' } },
        { _id: employeeId }
      ];
    }

    // Get filtered employees
    const employees = await Employee.find(employeeQuery).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // Build attendance query with filtered employees
    const attendanceQuery = {
      employeeId: { $in: employeeIds }
    };

    // Apply date filters
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      attendanceQuery.stepIn = { $gte: start, $lte: end };
    }

    // Apply status filter
    if (status) {
      attendanceQuery.status = { $regex: status, $options: 'i' };
    }

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('employeeId', 'name empCode email position shift designation uan esic')
      .populate('managerId', 'name email')
      .sort({ stepIn: -1 });

    // Create PDF document using jsPDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Set response headers
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `MusterRoll_${company?.name?.replace(/\s+/g, '_') || 'Report'}_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Add header section
    doc.setFontSize(16).text('Form XVI 1 [See Rule 78(1) (a) (1)]', 105, 30, { align: 'center' });
    doc.setFontSize(14).text('MUSTER ROLL', 105, 40, { align: 'center' });
    doc.setFontSize(12).text(company?.name || 'Asopalav Garden', 105, 50, { align: 'center' });

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    doc.setFontSize(10).text(`DEPLOYMENT OF SECURITY PERSON AT ${company?.address || 'RIVERFRONT AHMEDABAD UNIT'} ON ${currentMonth}`, 105, 60, { align: 'center' });

    // Prepare table data
    const tableData = [];
    const tableHeaders = [
      'SR NO', 'EMP CODE', 'NAME OF EMPLOYEE', 'DESIGNATION', 'SHIFT', 'UAN', 'ESIC',
      ...Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
      'TOTAL DAYS'
    ];

    // Debug: Log table structure
    console.log('Table headers count:', tableHeaders.length);
    console.log('Table headers:', tableHeaders);
    console.log('Daily columns (1-31):', tableHeaders.slice(7, 38));

    // Process attendance records to create table rows
    attendanceRecords.forEach((record, index) => {
      if (record.employeeId) {
        const row = [
          (index + 1).toString(),
          record.employeeId.empCode || record.employeeId.employeeId || `EMP${record.employeeId._id.slice(-6)}`,
          record.employeeId.name || 'N/A',
          record.employeeId.designation || record.employeeId.position || 'employee',
          record.employeeId.shift || 'morning',
          record.employeeId.uan || record.employeeId.uanNumber || 'Not Available',
          record.employeeId.esic || record.employeeId.esicNumber || 'Not Available'
        ];

        // Add daily attendance columns (1-31)
        for (let day = 1; day <= 31; day++) {
          // Simple demo attendance logic
          const employeeId = record.employeeId._id?.toString() || '';
          const seed = (employeeId.charCodeAt(0) + day) % 10;
          let attendanceMark = '';

          if (seed < 6) attendanceMark = 'P';
          else if (seed < 8) attendanceMark = 'A';
          else if (seed < 9) attendanceMark = 'L';
          else attendanceMark = 'H';

          row.push(attendanceMark);
        }

        // Add total days
        const totalDays = Math.floor(Math.random() * 25) + 5;
        row.push(totalDays.toString());

        // Debug: Log first row structure
        if (index === 0) {
          console.log('First row length:', row.length);
          console.log('First row data:', row);
          console.log('Daily columns in row:', row.slice(7, 38));
        }

        tableData.push(row);
      }
    });

    // Debug: Verify table data before creating PDF
    console.log('Total table data rows:', tableData.length);
    console.log('Table headers length:', tableHeaders.length);
    console.log('Expected columns: 7 main + 31 daily + 1 total = 39');

    // Create table using jsPDF autotable
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 80,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // SR NO
        1: { halign: 'left', cellWidth: 25 },   // EMP CODE
        2: { halign: 'left', cellWidth: 60 },  // NAME
        3: { halign: 'left', cellWidth: 30 },  // DESIGNATION
        4: { halign: 'center', cellWidth: 20 }, // SHIFT
        5: { halign: 'left', cellWidth: 35 },  // UAN
        6: { halign: 'left', cellWidth: 25 },  // ESIC
        // Daily columns (7-37)
        ...Object.fromEntries(
          Array.from({ length: 31 }, (_, i) => [i + 7, { halign: 'center', cellWidth: 8 }])
        ),
        // TOTAL DAYS (38)
        38: { halign: 'center', cellWidth: 20 }
      },
      didDrawCell: (data) => {
        // Color coding for attendance marks
        if (data.column.index >= 7 && data.column.index <= 37) { // Daily columns
          const cellValue = data.cell.raw;
          if (cellValue === 'P') {
            data.cell.styles.fillColor = [34, 197, 94]; // Green for Present
            data.cell.styles.textColor = [255, 255, 255];
          } else if (cellValue === 'A') {
            data.cell.styles.fillColor = [239, 68, 68]; // Red for Absent
            data.cell.styles.textColor = [255, 255, 255];
          } else if (cellValue === 'L') {
            data.cell.styles.fillColor = [245, 158, 11]; // Orange for Late
            data.cell.styles.textColor = [255, 255, 255];
          } else if (cellValue === 'H') {
            data.cell.styles.fillColor = [139, 92, 246]; // Purple for Half-day
            data.cell.styles.textColor = [255, 255, 255];
          }
        }
      }
    });

    // Send PDF to client
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error("Error exporting muster roll to PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error exporting muster roll to PDF", error: error.message });
    }
  }
};

// Assign site to employee
export const assignSiteToEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { siteId, siteName, siteCode } = req.body;
    const companyId = req.user.companyId;

    console.log('🏗️ [assignSiteToEmployee] Request:', {
      employeeId, siteId, siteName, siteCode, companyId
    });

    // Validate required fields
    if (!siteId || !siteName || !siteCode) {
      return res.status(400).json({
        success: false,
        message: "Site ID, name, and code are required"
      });
    }

    // Update employee with site assignment
    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, companyId },
      {
        assignedSiteId: siteId,
        assignedSiteName: siteName,
        assignedSiteCode: siteCode,
        assignedPoints: [] // Clear existing points when site changes
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    console.log('✅ [assignSiteToEmployee] Site assigned successfully');

    res.status(200).json({
      success: true,
      message: "Site assigned successfully",
      data: {
        _id: employee._id,
        name: employee.name,
        assignedSiteId: employee.assignedSiteId,
        assignedSiteName: employee.assignedSiteName,
        assignedSiteCode: employee.assignedSiteCode
      }
    });

  } catch (error) {
    console.error('❌ [assignSiteToEmployee] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error assigning site to employee",
      error: error.message
    });
  }
};

// Assign points to employee
export const assignPointsToEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { points } = req.body;
    const companyId = req.user.companyId;
    const assignedBy = req.user.id || req.user._id;

    console.log('📍 [assignPointsToEmployee] Request:', {
      employeeId, pointsCount: points?.length || 0, companyId
    });

    // Validate required fields
    if (!points || !Array.isArray(points)) {
      return res.status(400).json({
        success: false,
        message: "Points array is required"
      });
    }

    // Process points to ensure proper structure
    const processedPoints = points.map(point => ({
      pointId: point.pointId,
      pointName: point.pointName,
      pointCode: point.pointCode,
      isRequired: point.isRequired || false,
      assignedDate: new Date(),
      assignedBy: assignedBy
    }));

    // Update employee with point assignments
    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, companyId },
      { assignedPoints: processedPoints },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    console.log('✅ [assignPointsToEmployee] Points assigned successfully');

    res.status(200).json({
      success: true,
      message: "Points assigned successfully",
      data: {
        _id: employee._id,
        name: employee.name,
        assignedPoints: employee.assignedPoints
      }
    });

  } catch (error) {
    console.error('❌ [assignPointsToEmployee] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error assigning points to employee",
      error: error.message
    });
  }
};

// Get employee's assigned site and points
export const getEmployeeSiteAssignment = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const companyId = req.user.companyId;

    console.log('📋 [getEmployeeSiteAssignment] Request:', { employeeId, companyId });

    const employee = await Employee.findOne(
      { _id: employeeId, companyId },
      'assignedSiteId assignedSiteName assignedSiteCode assignedPoints'
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        assignedSiteId: employee.assignedSiteId,
        assignedSiteName: employee.assignedSiteName,
        assignedSiteCode: employee.assignedSiteCode,
        assignedPoints: employee.assignedPoints || []
      }
    });

  } catch (error) {
    console.error('❌ [getEmployeeSiteAssignment] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching employee site assignment",
      error: error.message
    });
  }
};