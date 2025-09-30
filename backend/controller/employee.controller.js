import Employee from "../models/employee.models.js";
import Company from "../models/company.models.js";
import Manager from "../models/manager.models.js";
import Attendance from "../models/attendence.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

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
      managerId: req.body.managerId
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
      designation: designation || "security guard",
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
      active: true
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

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    const employees = await Employee.find({
      companyId: companyId,
      role: "employee"
    })
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .populate("createdById", "name email")
      .sort({ createdAt: -1 });

    console.log(`Found ${employees.length} employees for company: ${companyId}`);
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

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Build query for attendance records
    const attendanceQuery = {};

    // Filter by company through employees
    const employees = await Employee.find({
      companyId: companyId,
      role: "employee"
    }).select('_id');

    const employeeIds = employees.map(emp => emp._id);
    attendanceQuery.employeeId = { $in: employeeIds };

    // Date range filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include end of day
      attendanceQuery.stepIn = { $gte: start, $lte: end };
    } else if (startDate) {
      const start = new Date(startDate);
      attendanceQuery.stepIn = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      attendanceQuery.stepIn = { $lte: end };
    }

    // Shift filter
    if (shift) {
      attendanceQuery.shift = shift;
    }

    // Status filter
    if (status) {
      attendanceQuery.status = status;
    }

    // Specific employee filter
    if (employeeId) {
      attendanceQuery.employeeId = employeeId;
    }

    // Get attendance records with populated employee data
    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('employeeId', 'name empCode email position shift')
      .populate('managerId', 'name email')
      .sort({ stepIn: -1 });

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

// Export Muster Roll Report to PDF
export const exportMusterRollPDF = async (req, res) => {
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

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    const fileName = `MusterRoll_${company?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    // Add title
    doc.fontSize(20).text('Muster Roll Report', { align: 'center' });
    doc.moveDown();

    // Add company info
    if (company) {
      doc.fontSize(14).text(`Company: ${company.name}`, { align: 'center' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    }

    doc.moveDown();

    // Add filter information
    doc.fontSize(12).text('Report Filters:', { underline: true });
    if (startDate) doc.text(`Start Date: ${startDate}`);
    if (endDate) doc.text(`End Date: ${endDate}`);
    if (shift) doc.text(`Shift: ${shift}`);
    if (status) doc.text(`Status: ${status}`);
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
    doc.text('Step In', col4, tableTop);
    doc.text('Status', col5, tableTop);

    // Add data rows
    let yPosition = tableTop + 20;
    attendanceRecords.forEach((record, index) => {
      if (record.employeeId && yPosition < 750) { // Check page height
        const date = record.stepIn ? new Date(record.stepIn).toLocaleDateString() : 'N/A';
        const stepInTime = record.stepIn ? new Date(record.stepIn).toLocaleTimeString() : 'N/A';

        doc.text(record.employeeId.empCode || 'N/A', col1, yPosition);
        doc.text(record.employeeId.name, col2, yPosition);
        doc.text(date, col3, yPosition);
        doc.text(stepInTime, col4, yPosition);
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
    console.error("Error exporting muster roll to PDF:", error);
    res.status(500).json({ message: "Error exporting muster roll to PDF", error: error.message });
  }
};