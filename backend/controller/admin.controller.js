import Admin from "../models/admin.models.js";
import Company from "../models/company.models.js";
import Employee from "../models/employee.models.js";
import Manager from "../models/manager.models.js";
import Attendance from "../models/attendence.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import companyModels from "../models/company.models.js";
import { SHIFT_ENUM } from "../constants/shifts.js";
dotenv.config();


const JWT_SECRET = process.env.JWT_SECRET

export const createAdmin = async (req, res) => {
  try {
    const { email, password, name, mobile, address, company } = req.body;

    if (!email || !password || !name || !mobile || !address || !company) {
      return res.status(400).json({ message: "All fields including companyId are required" });
    }

    const findadmininCompany = await companyModels.findOne({ code: company })

    if (findadmininCompany) {
      console.log(findadmininCompany._id, 'admincompany')
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      email,
      password: hashedPassword,
      name,
      mobile,
      address,
      companyId: findadmininCompany._id
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Error creating admin", error });
  }
};


export const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate("company", "name code address timezone");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin", error });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).populate("company", "name code address timezone");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin", error });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Only hash password if it's being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin updated successfully", admin: updatedAdmin });
  } catch (error) {
    console.log("update admin error", error)
    res.status(500).json({ message: "Error updating admin", error });
  }
}

export const deleteAdmin = async (req, res) => {
  try {
    const deletedAdmin = await Admin.findByIdAndDelete(req.params.id);
    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting admin", error });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().populate("company", "name code");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins", error });
  }
};


export const loginAdmin = async (req, res) => {
  try {
    const { email, password, company } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // If company code is provided, validate it
    let companyData = null;
    if (company) {
      companyData = await Company.findOne({ code: company });
      if (!companyData) {
        return res.status(400).json({ message: "Company not found with the provided company code" });
      }

      // Check if admin belongs to the same company
      if (!admin.companyId || admin.companyId.toString() !== companyData._id.toString()) {
        return res.status(403).json({ message: "Admin does not belong to this company" });
      }
    } else {
      // If no company code provided, get admin's company
      if (admin.companyId) {
        companyData = await Company.findById(admin.companyId);
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        userType: "admin",
        companyId: companyData ? companyData._id : admin.companyId
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1y" }
    );

    res.status(200).json({ message: "Login successful", token, admin, company: companyData });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};

// Get shift-wise employee data for admin dashboard
export const getShiftWiseData = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required" });
    }

    // Get all employees for the company
    const employees = await Employee.find({ companyId }).select('shift name empCode email active');

    // Get all managers for the company
    const managers = await Manager.find({ companyId }).select('name email active');

    // Get today's attendance data
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayAttendance = await Attendance.find({
      companyId,
      stepIn: { $gte: startOfDay, $lt: endOfDay }
    }).populate('employeeId', 'shift name');

    // Calculate working employees (currently stepped in)
    const workingEmployees = todayAttendance.filter(record =>
      record.stepIn && !record.stepOut
    ).length;

    // Calculate shift-wise employee counts without aggregation
    const shiftWise = {
      [SHIFT_ENUM.MORNING]: 0,
      [SHIFT_ENUM.EVENING]: 0,
      [SHIFT_ENUM.NIGHT]: 0,
      other: 0
    };

    employees.forEach(employee => {
      const shift = employee.shift?.toLowerCase() || '';

      if (shift === SHIFT_ENUM.MORNING || shift.includes('morning') ||
        shift.includes('9:00') || shift.includes('9:00 am') ||
        shift.includes('am') || shift.includes('day')) {
        shiftWise[SHIFT_ENUM.MORNING]++;
      } else if (shift === SHIFT_ENUM.EVENING || shift.includes('evening') ||
        shift.includes('5:00') || shift.includes('5:00 pm') ||
        shift.includes('pm') || shift.includes('afternoon')) {
        shiftWise[SHIFT_ENUM.EVENING]++;
      } else if (shift === SHIFT_ENUM.NIGHT || shift.includes('night') ||
        shift.includes('11:00') || shift.includes('11:00 pm') ||
        shift.includes('midnight') || shift.includes('late')) {
        shiftWise[SHIFT_ENUM.NIGHT]++;
      } else {
        shiftWise.other++;
      }
    });

    // Calculate shift-wise active employees (currently working)
    const shiftWiseActive = {
      [SHIFT_ENUM.MORNING]: 0,
      [SHIFT_ENUM.EVENING]: 0,
      [SHIFT_ENUM.NIGHT]: 0,
      other: 0
    };

    todayAttendance.forEach(record => {
      if (!record.stepIn || record.stepOut) return; // Skip if not currently active

      const employee = employees.find(emp =>
        (emp._id.toString() === record.employeeId?._id?.toString()) ||
        (emp._id.toString() === record.employeeId?.toString())
      );

      if (employee) {
        const shift = employee.shift?.toLowerCase() || '';

        if (shift === SHIFT_ENUM.MORNING || shift.includes('morning') ||
          shift.includes('9:00') || shift.includes('9:00 am') ||
          shift.includes('am') || shift.includes('day')) {
          shiftWiseActive[SHIFT_ENUM.MORNING]++;
        } else if (shift === SHIFT_ENUM.EVENING || shift.includes('evening') ||
          shift.includes('5:00') || shift.includes('5:00 pm') ||
          shift.includes('pm') || shift.includes('afternoon')) {
          shiftWiseActive[SHIFT_ENUM.EVENING]++;
        } else if (shift === SHIFT_ENUM.NIGHT || shift.includes('night') ||
          shift.includes('11:00') || shift.includes('11:00 pm') ||
          shift.includes('midnight') || shift.includes('late')) {
          shiftWiseActive[SHIFT_ENUM.NIGHT]++;
        } else {
          shiftWiseActive.other++;
        }
      }
    });

    // Calculate total counts
    const totalEmployees = employees.length;
    const totalManagers = managers.length;
    const activeEmployees = employees.filter(emp => emp.active).length;
    const activeManagers = managers.filter(mgr => mgr.active).length;

    res.status(200).json({
      success: true,
      message: "Shift-wise data retrieved successfully",
      data: {
        totalEmployees,
        totalManagers,
        activeEmployees,
        activeManagers,
        workingEmployees,
        shiftWise,
        shiftWiseActive,
        todayDate: today.toISOString().split('T')[0],
        summary: {
          totalShifts: Object.values(shiftWise).reduce((sum, count) => sum + count, 0),
          activeShifts: Object.values(shiftWiseActive).reduce((sum, count) => sum + count, 0),
          attendanceRate: totalEmployees > 0 ? Math.round((workingEmployees / totalEmployees) * 100) : 0
        }
      }
    });

  } catch (error) {
    console.error("Error getting shift-wise data:", error);
    res.status(500).json({
      success: false,
      message: "Error getting shift-wise data",
      error: error.message
    });
  }
};
