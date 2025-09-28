import Employee from "../models/employee.models.js";
import Company from "../models/company.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// Create Employee
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      address,
      position,
      empCode,
      shift,
      managerId
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Get creator info from authenticated user
    const createdBy = req.user.id;
    const createdByRole = req.user.role || req.user.userType;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: "User must be associated with a company to create employees" });
    }

    console.log("Creating employee for company:", companyId, "by:", createdByRole);

    const newEmployee = new Employee({
      name,
      email,
      passwordHash: hashedPassword,
      mobile: mobile || "",
      address: address || "",
      position: position || "",
      empCode: empCode || "",
      shift: shift || "morning",
      companyId: companyId,
      managerId: managerId || null,
      createdBy: createdBy,
      createdByRole: createdByRole,
      createdById: createdBy,
      role: "employee",
      active: true
    });

    await newEmployee.save();
    
    // Populate the created employee with company and manager info
    const populatedEmployee = await Employee.findById(newEmployee._id)
      .populate("companyId", "name code")
      .populate("managerId", "name email")
      .populate("createdById", "name email");

    res.status(201).json({ 
      message: "Employee created successfully", 
      employee: populatedEmployee 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error creating employee:", error);
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
    console.log("Updating employee:", req.params.id, updateData);

    // Only hash password if it's being updated
    if (updateData.password) {
      updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password; // Remove plain password
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

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
    
    console.log("Employee updated successfully:", updatedEmployee.name);
    res.status(200).json({ message: "Employee updated successfully", employee: updatedEmployee });
  } catch (error) {
    console.error("Error updating employee:", error);
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