import Attendance from "../models/attendence.models.js";
import Employee from "../models/employee.models.js";
import Company from '../models/company.models.js'
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;


export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Email or EmpCode is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailFormat = emailRegex.test(email);

    let employeeUser;
    if (isEmailFormat) {
      employeeUser = await Employee.findOne({ email });
    } else {
      employeeUser = await Employee.findOne({ empCode: email });

    }

    if (!employeeUser) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check company
    const company = await Company.findById(employeeUser.companyId);
    if (!company) {
      return res.status(401).json({ message: "Company not found for this employee" });
    }

    // Check password
    if (!employeeUser.password) {
      return res.status(400).json({ message: "Password not set for this employee. Please contact administrator." });
    }
    const isPasswordValid = await bcrypt.compare(password, employeeUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Create token
    const tokenPayload = {
      id: employeeUser._id,
      email: employeeUser.email,
      empCode: employeeUser.empCode,
      userType: employeeUser.userType || "employee",
      role: "employee",
      companyId: company._id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1y" });

    res.status(200).json({
      message: "Employee Login successful",
      token,
      employee: employeeUser,
      company
    });
  }
  catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      empCode,
      email,
      name,
      mobile,
      address,
      managerId,
      shift,
      createdBy,
      designation,
      category,
      uan,
      esic,
      accountNo,
      ifsc,
      isCreatedByAdmin,
      password // Required password for new employees
    } = req.body;

    // Validate required fields
    if (!empCode || !name || !address || !shift || !designation || !category || !uan || !esic || !accountNo || !ifsc || !password || isCreatedByAdmin === undefined || createdBy === undefined) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
    // Check for duplicate employee code
    const duplicateEmployeeCode = await Employee.findOne({ empCode });
    if (duplicateEmployeeCode) {
      return res.status(400).json({ message: "This Employee Code Already Exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle image field properly
    let image = "";
    if (req.file) {
      image = req.file.filename; // or `${req.protocol}://${req.get("host")}/upload/${req.file.filename}` for full URL
    }

    // Remove any empty or invalid image fields from req.body
    if (req.body.image === '' || req.body.image === null || req.body.image === undefined ||
      (typeof req.body.image === 'object' && Object.keys(req.body.image).length === 0)) {
      delete req.body.image;
    }

    const newEmployee = new Employee({
      empCode,
      email,
      name,
      mobile,
      address,
      managerId,
      shift,
      createdBy,
      designation,
      category,
      uan,
      esic,
      accountNo,
      ifsc,
      isCreatedByAdmin,
      password: hashedPassword,
      userType: "employee",
      isActive: true,
      image // optional image field
    });

    await newEmployee.save();
    res.status(201).json({ message: "Employee created successfully", employee: newEmployee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Error creating employee", error });
  }
};


export const updateEmployee = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle image field properly
    if (req.file) {
      updateData.image = req.file.filename; // or full URL if needed
    } else {
      // If no new file uploaded, remove image field from updateData to keep existing image
      delete updateData.image;
    }

    // Remove any empty or invalid image fields
    if (updateData.image === '' || updateData.image === null || updateData.image === undefined ||
      (typeof updateData.image === 'object' && Object.keys(updateData.image).length === 0)) {
      delete updateData.image;
    }

    // Clean up empty string values that might cause validation issues
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') {
        delete updateData[key];
      }
    });

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    console.log('[UPDATE EMPLOYEE] Update data:', updateData);

    // Check for duplicate employee code if empCode is being updated
    if (updateData.empCode) {
      const existingEmployee = await Employee.findOne({
        empCode: updateData.empCode,
        _id: { $ne: req.params.id } // Exclude current employee
      });
      if (existingEmployee) {
        return res.status(400).json({ message: "This Employee Code Already Exists" });
      }
    }

    // Validate enum fields if they are being updated
    if (updateData.designation && !["securityOfficer", "ladiesGuard", "securityGuard", "supervisor"].includes(updateData.designation)) {
      return res.status(400).json({ message: "Invalid designation value" });
    }

    if (updateData.category && !["skilled", "semiSkilled", "unSkilled"].includes(updateData.category)) {
      return res.status(400).json({ message: "Invalid category value" });
    }

    if (updateData.shift && !["morning", "evening", "night"].includes(updateData.shift)) {
      return res.status(400).json({ message: "Invalid shift value" });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Employee updated successfully", employee: updatedEmployee });
  } catch (error) {
    console.error("Error updating employee:", error);

    // Handle specific validation errors
    if (error.code === 11000) {
      return res.status(400).json({ message: "Employee code already exists" });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors
      });
    }

    res.status(500).json({ message: "Error updating employee", error: error.message });
  }
};


export const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Error deleting employee", error });
  }
}


export const getEmployees = async (req, res) => {
  try {
    const { isWorking, shift } = req.query;
    const userData = req?.user
    console.log("userData---->", userData)

    // Build aggregation pipeline
    const pipeline = [];

    if (userData.userType == "manager") {
      pipeline.push({ $match: { managerId: userData.id } });
    }


    // Filter by shift if isWorking param is provided
    if (typeof isWorking !== "undefined") {

      pipeline.push({ $match: { isWorking: isWorking } });

    }


    if (shift) {
      pipeline.push({ $match: { shift: shift } });
    }

    // Lookup for createdBy (Admin)
    pipeline.push({
      $lookup: {
        from: "admins",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy"
      }
    });
    pipeline.push({
      $unwind: {
        path: "$createdBy",
        preserveNullAndEmptyArrays: true
      }
    });

    // Lookup for managerId (Manager)
    pipeline.push({
      $lookup: {
        from: "managers",
        localField: "managerId",
        foreignField: "_id",
        as: "managerId"
      }
    });
    pipeline.push({
      $unwind: {
        path: "$managerId",
        preserveNullAndEmptyArrays: true
      }
    });

    const employees = await Employee.aggregate(pipeline.length ? pipeline : [{ $match: {} }]);
    res.status(200).json({ message: "Success", data: employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Error fetching employees", error });
  }
}

// Manager-specific employee creation
export const createEmployeeByManager = async (req, res) => {
  try {
    const {
      empCode,
      email,
      name,
      mobile,
      address,
      shift,
      designation,
      category,
      uan,
      esic,
      accountNo,
      ifsc,
      password, // Required password for new employees
    } = req.body;

    const user = req.user;
    const company = req.user.companyId

    // Log the incoming payload
    console.log('[CREATE EMPLOYEE BY MANAGER] Payload:', req.body);

    // Validate required fields
    if (!empCode || !name || !address || !shift || !designation || !category || !uan || !esic || !accountNo || !ifsc || !password) {
      return res.status(400).json({ message: "All required fields must be provided including companyId" });
    }

    // Check for duplicate employee code
    const duplicateEmployeeCode = await Employee.findOne({ empCode, companyId });
    if (duplicateEmployeeCode) {
      return res.status(400).json({ message: "This Employee Code Already Exists in this company" });
    }

    const managerId = user.id;
    const createdBy = user.id;
    const isCreatedByAdmin = false;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle image field properly
    let image = "";
    if (req.file) {
      image = req.file.filename;
    }

    if (req.body.image === '' || req.body.image === null || req.body.image === undefined ||
      (typeof req.body.image === 'object' && Object.keys(req.body.image).length === 0)) {
      delete req.body.image;
    }

    const newEmployee = new Employee({
      empCode,
      email,
      name,
      mobile,
      address,
      managerId,
      shift,
      createdBy,
      isCreatedByAdmin,
      designation,
      category,
      uan,
      esic,
      accountNo,
      ifsc,
      password: hashedPassword,
      userType: "employee",
      isActive: true,
      image,
      companyId: company // ✅ link employee to company
    });

    await newEmployee.save();
    res.status(201).json({ message: "Employee created successfully", employee: newEmployee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error creating employee by manager:", error);
    res.status(500).json({ message: "Error creating employee by manager", error });
  }
};




export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.companyId

    // Get employee details
    const employee = await Employee.findById(userId).select('-password');
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Get employee's attendance records (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await Attendance.find({
      employeeId: userId,
      stepIn: { $gte: thirtyDaysAgo }
    }).sort({ stepIn: -1 });

    // Calculate attendance statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(record => record.stepIn && record.stepOut).length;
    const absentDays = totalDays - presentDays;

    // Get today's attendance status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = attendance.find(record => {
      const recordDate = new Date(record.stepIn);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    // Get current month statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthAttendance = attendance.filter(record => {
      const recordDate = new Date(record.stepIn);
      return recordDate >= currentMonth;
    });

    const monthPresentDays = monthAttendance.filter(record =>
      record.stepIn && record.stepOut
    ).length;

    const dashboardData = {
      employee: {
        _id: employee._id,
        empCode: employee.empCode,
        name: employee.name,
        email: employee.email,
        designation: employee.designation,
        category: employee.category,
        shift: employee.shift,
        mobile: employee.mobile,
        address: employee.address,
        uan: employee.uan,
        esic: employee.esic,
        accountNo: employee.accountNo,
        ifsc: employee.ifsc,
        image: employee.image,
        isWorking: employee.isWorking,
        isActive: employee.isActive,
        managerId: employee.managerId,
        companyId: companyId
      },
      attendance: {
        today: todayAttendance ? {
          _id: todayAttendance._id,
          date: todayAttendance.stepIn,
          stepInTime: todayAttendance.stepIn,
          stepOutTime: todayAttendance.stepOut,
          status: todayAttendance.stepIn && todayAttendance.stepOut ? 'completed' :
            todayAttendance.stepIn ? 'working' : 'not_started'
        } : null,
        statistics: {
          totalDays: totalDays,
          presentDays: presentDays,
          absentDays: absentDays,
          monthPresentDays: monthPresentDays
        },
        recentRecords: attendance.slice(0, 10).map(record => ({
          date: record.stepIn,
          stepInTime: record.stepIn,
          stepOutTime: record.stepOut,
          status: record.stepIn && record.stepOut ? 'completed' :
            record.stepIn ? 'working' : 'not_started'
        })) // Last 10 attendance records with proper field mapping
      }
    };

    res.status(200).json({
      message: "Employee dashboard data retrieved successfully",
      data: dashboardData
    });

  } catch (error) {
    console.error("Error fetching employee dashboard:", error);
    res.status(500).json({ message: "Error fetching employee dashboard", error: error.message });
  }
};

// Set employee password (for admin/manager to set initial password)
export const setEmployeePassword = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: "Employee ID and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { password: hashedPassword },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Error setting employee password:", error);
    res.status(500).json({ message: "Error setting employee password", error: error.message });
  }
};

// Update employee profile (for employee to update their own profile)
export const updateEmployeeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, mobile, address } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (address) updateData.address = address;

    const employee = await Employee.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      employee
    });
  } catch (error) {
    console.error("Error updating employee profile:", error);
    res.status(500).json({ message: "Error updating employee profile", error: error.message });
  }
};

// Change employee password
export const changeEmployeePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    const employee = await Employee.findById(userId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await Employee.findByIdAndUpdate(
      userId,
      { password: hashedNewPassword }
    );

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing employee password:", error);
    res.status(500).json({ message: "Error changing employee password", error: error.message });
  }
};

