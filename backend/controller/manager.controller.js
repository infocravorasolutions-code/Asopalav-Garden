import Manager from "../models/manager.models.js";
import Company from "../models/company.models.js";
import Employee from "../models/employee.models.js";
import Attendance from "../models/attendence.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { get } from "http";
import companyModels from "../models/company.models.js";
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// export const createManager = async (req, res) => {
//   try {
//     const { email, password, name, mobile, address, location } = req.body;

//     // Validate required fields
//     if (!email || !password || !name || !mobile || !address || !location) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Get adminId from the authenticated user
//     const adminId = req.user.id;

//     const newManager = new Manager({
//       email,
//       password: hashedPassword,
//       name,
//       mobile,
//       address,
//       location,
//       createdBy: adminId
//     });

//     await newManager.save();
//     res.status(201).json({ message: "Manager created successfully", manager: newManager });
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Email already exists" });
//     }
//     console.error("Error creating manager:", error);
//     res.status(500).json({ message: "Error creating manager", error });
//   }
// }

export const getManager = async (req, res) => {
  try {
    const manager = await Manager.findOne({
      _id: req.params.id,
      companyId: req.user.companyId // 💡 Ensure manager belongs to the logged-in user's company
    })
      // Location fields are now embedded in manager record
      .populate("companyId", "name code address timezone"); // Adjusted to match field name

    if (!manager) {
      return res.status(404).json({ message: "Manager not found or access denied" });
    }

    res.status(200).json(manager);
  } catch (error) {
    console.error("Error fetching manager:", error);
    res.status(500).json({ message: "Error fetching manager", error });
  }
};

export const updateManager = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Only hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedManager = await Manager.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedManager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    res.status(200).json({ message: "Manager updated successfully", manager: updatedManager });
  } catch (error) {
    console.error("Error updating manager:", error);
    res.status(500).json({ message: "Error updating manager", error });
  }
};
export const deleteManager = async (req, res) => {
  try {
    const deletedManager = await Manager.findByIdAndDelete(req.params.id);
    if (!deletedManager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    res.status(200).json({ message: "Manager deleted successfully" });
  } catch (error) {
    console.error("Error deleting manager:", error);
    res.status(500).json({ message: "Error deleting manager", error });
  }
};


export const loginManager = async (req, res) => {
  try {
    const { email, password, company } = req.body;
    console.log("Manager login attempt:", { email, company });

    if (!email || !password || !company) {
      return res.status(400).json({ message: "Email, password, and company code are required" });
    }

    // First, find the company by company code
    const companyData = await Company.findOne({ code: company });
    if (!companyData) {
      console.log("Company not found with code:", company);
      return res.status(404).json({ message: "Company not found with the provided company code" });
    }

    // Find manager by email
    const manager = await Manager.findOne({ email });
    if (!manager) {
      console.log("Manager not found for email:", email);
      return res.status(404).json({ message: "Manager not found" });
    }

    console.log("Manager found:", manager.name, "Company ID:", manager.companyId);

    // Check if manager belongs to the same company
    if (!manager.companyId || manager.companyId.toString() !== companyData._id.toString()) {
      console.log("Manager does not belong to this company");
      return res.status(403).json({ message: "Manager does not belong to this company" });
    }

    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      console.log("Invalid password for manager:", email);
      return res.status(401).json({ message: "Invalid password" });
    }

    // Get company details
    let companyDetails = companyData;
    console.log("Company found:", companyDetails ? companyDetails.name : "No company");

    const token = jwt.sign({
      id: manager._id,
      email: manager.email,
      userType: 'manager',
      companyId: companyData._id
    }, JWT_SECRET, { expiresIn: '1y' });

    console.log("Manager login successful:", manager.name);
    res.status(200).json({ message: "Login successful", token, manager, company: companyDetails });
  }
  catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
}

export const getAllManagers = async (req, res) => {
  try {
    const { id: userId, companyId } = req.user;

    const managers = await Manager.find({
      companyId: companyId,
      _id: { $ne: userId } // Exclude current user
    }).populate("companyId", "name code address timezone");

    res.status(200).json({ message: "success", data: managers });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Error fetching managers", error });
  }
};

// Get managers by company ID (for admin to assign to employees)
export const getManagersByCompany = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Get all managers created by the current admin for the same company
    const managers = await Manager.find({
      companyId: companyId,
      createdBy: req.user.id // Only managers created by this admin
    }).select('_id name email mobile address locationName isActive')
      .populate("companyId", "name code");

    res.status(200).json({
      message: "success",
      data: managers,
      count: managers.length
    });
  } catch (error) {
    console.error("Error fetching managers by company:", error);
    res.status(500).json({ message: "Error fetching managers by company", error: error.message });
  }
};


// for company relation

export const createManager = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      mobile,
      address,
      locationName,
      locationAddress,
      locationLatitude,
      locationLongitude,
      locationRadius
    } = req.body;

    // Validate required fields
    if (!email || !password || !name || !mobile || !address) {
      return res.status(400).json({ message: "Email, password, name, mobile, and address are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get adminId from the authenticated user
    const adminId = req.user.id;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company to create managers" });
    }

    const newManager = new Manager({
      email,
      password: hashedPassword,
      name,
      mobile,
      address,
      createdBy: adminId,
      companyId: companyId,
      // Manual location fields
      locationName: locationName || "Office",
      locationAddress: locationAddress || "",
      locationLatitude: locationLatitude || 0,
      locationLongitude: locationLongitude || 0,
      locationRadius: locationRadius || 100
    });

    await newManager.save();

    // Populate the created manager with company info
    const populatedManager = await Manager.findById(newManager._id)
      .populate("companyId", "name code address timezone");

    res.status(201).json({
      message: "Manager created successfully",
      manager: populatedManager
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error creating manager:", error);
    res.status(500).json({
      message: "Error creating manager",
      error: error.message
    });
  }
};

// Get team members for manager with attendance status
export const getManagerTeamMembers = async (req, res) => {
  try {
    const managerId = req.user.id;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company" });
    }

    // Get all employees under this manager
    const employees = await Employee.find({
      managerId: managerId,
      companyId: companyId,
      role: "employee"
    })
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .sort({ createdAt: -1 });

    // Get today's attendance for all employees
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayAttendance = await Attendance.find({
      employeeId: { $in: employees.map(emp => emp._id) },
      stepIn: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ stepIn: -1 });

    // Create attendance map for quick lookup
    const attendanceMap = new Map();
    todayAttendance.forEach(attendance => {
      const employeeId = attendance.employeeId.toString();
      if (!attendanceMap.has(employeeId)) {
        attendanceMap.set(employeeId, attendance);
      }
    });

    // Add attendance status to each employee
    const employeesWithStatus = employees.map(employee => {
      const attendance = attendanceMap.get(employee._id.toString());
      let status = 'not-clocked';
      let statusText = 'Not Clocked';
      let statusColor = 'gray';
      let image = null;

      if (attendance) {
        if (attendance.stepIn && !attendance.stepOut) {
          status = 'clocked-in';
          statusText = 'Clocked In';
          statusColor = 'green';
          image = attendance.stepInImage;
        } else if (attendance.stepIn && attendance.stepOut) {
          status = 'clocked-out';
          statusText = 'Clocked Out';
          statusColor = 'orange';
          image = attendance.stepOutImage || attendance.stepInImage;
        }
      }

      return {
        ...employee.toObject(),
        attendanceStatus: {
          status,
          text: statusText,
          color: statusColor,
          image,
          stepIn: attendance?.stepIn,
          stepOut: attendance?.stepOut,
          attendanceId: attendance?._id
        }
      };
    });

    console.log(`Found ${employees.length} team members for manager: ${managerId}`);
    res.status(200).json({ 
      message: "success", 
      data: employeesWithStatus,
      count: employeesWithStatus.length,
      managerId,
      companyId
    });
  } catch (error) {
    console.error("Error fetching manager team members:", error);
    res.status(500).json({ 
      message: "Error fetching team members", 
      error: error.message 
    });
  }
};

// Manager step in employee
export const managerStepInEmployee = async (req, res) => {
  try {
    // Extract fields from FormData
    const { employeeId, longitude, latitude, address, note, shift, status } = req.body;
    const managerId = req.user.id;
    const companyId = req.user.companyId;
    
    console.log('Manager step-in request body:', req.body);
    console.log('Manager step-in file:', req.file);

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    // Verify employee belongs to this manager
    const employee = await Employee.findOne({
      _id: employeeId,
      managerId: managerId,
      companyId: companyId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or not under your management"
      });
    }

    // Check if employee is already clocked in today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employeeId: employeeId,
      stepIn: { $gte: startOfDay, $lt: endOfDay },
      stepOut: { $exists: false }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Employee is already clocked in today"
      });
    }

    const stepIn = new Date();
    const stepInImage = req.file ? req.file.filename : null;

    // Create attendance record
    const attendance = new Attendance({
      employeeId: employeeId,
      managerId: managerId,
      companyId: companyId,
      stepIn,
      stepInImage,
      longitude: longitude ? parseFloat(longitude) : null,
      latitude: latitude ? parseFloat(latitude) : null,
      address: address || 'Location not available',
      note: note || 'Step in by manager',
      shift: shift || 'morning',
      status: status || 'present'
    });

    await attendance.save();
    await Employee.findByIdAndUpdate(employeeId, { isWorking: true });

    res.status(201).json({
      success: true,
      message: `${employee.name} successfully clocked in by manager`,
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
        }
      }
    });

  } catch (error) {
    console.error("Error in manager step in:", error);
    res.status(500).json({
      success: false,
      message: "Error clocking in employee",
      error: error.message
    });
  }
};

// Manager step out employee
export const managerStepOutEmployee = async (req, res) => {
  try {
    const { employeeId, attendanceId, longitude, latitude, address, note, status } = req.body;
    const managerId = req.user.id;
    const companyId = req.user.companyId;

    if (!employeeId && !attendanceId) {
      return res.status(400).json({
        success: false,
        message: "Either employeeId or attendanceId is required"
      });
    }

    let attendance;

    if (attendanceId) {
      // Find attendance by ID
      attendance = await Attendance.findById(attendanceId);
    } else {
      // Find open attendance for employee
      attendance = await Attendance.findOne({
        employeeId: employeeId,
        stepOut: { $exists: false }
      });
    }

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No open attendance record found for this employee"
      });
    }

    // Verify the attendance belongs to an employee under this manager
    const employee = await Employee.findOne({
      _id: attendance.employeeId,
      managerId: managerId,
      companyId: companyId
    });

    if (!employee) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to manage this employee's attendance"
      });
    }

    const stepOut = new Date();
    const stepOutImage = req.file ? req.file.filename : null;
    const totalTime = Math.round((stepOut - attendance.stepIn) / 60000);

    // Update attendance record
    attendance.stepOut = stepOut;
    attendance.stepOutImage = stepOutImage;
    attendance.totalTime = totalTime;
    attendance.note = note || attendance.note || 'Step out by manager';
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

    res.status(200).json({
      success: true,
      message: `${employee.name} successfully clocked out by manager`,
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
        })
      }
    });

  } catch (error) {
    console.error("Error in manager step out:", error);
    res.status(500).json({
      success: false,
      message: "Error clocking out employee",
      error: error.message
    });
  }
};

// Get employee attendance status for manager
export const getEmployeeAttendanceStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const managerId = req.user.id;
    const companyId = req.user.companyId;

    // Verify employee belongs to this manager
    const employee = await Employee.findOne({
      _id: employeeId,
      managerId: managerId,
      companyId: companyId
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found or not under your management"
      });
    }

    // Get today's attendance
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId: employeeId,
      stepIn: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ stepIn: -1 });

    let status = 'not-clocked';
    let statusText = 'Not Clocked';
    let statusColor = 'gray';
    let image = null;

    if (attendance) {
      if (attendance.stepIn && !attendance.stepOut) {
        status = 'clocked-in';
        statusText = 'Clocked In';
        statusColor = 'green';
        image = attendance.stepInImage;
      } else if (attendance.stepIn && attendance.stepOut) {
        status = 'clocked-out';
        statusText = 'Clocked Out';
        statusColor = 'orange';
        image = attendance.stepOutImage || attendance.stepInImage;
      }
    }

    res.status(200).json({
      success: true,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        empCode: employee.empCode
      },
      attendanceStatus: {
        status,
        text: statusText,
        color: statusColor,
        image,
        stepIn: attendance?.stepIn,
        stepOut: attendance?.stepOut,
        attendanceId: attendance?._id
      }
    });

  } catch (error) {
    console.error("Error getting employee attendance status:", error);
    res.status(500).json({
      success: false,
      message: "Error getting employee attendance status",
      error: error.message
    });
  }
};
