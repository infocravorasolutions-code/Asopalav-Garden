import Manager from "../models/manager.models.js";
import Company from "../models/company.models.js"
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
    const { email, password } = req.body;
    console.log("Manager login attempt:", { email });
    
    const manager = await Manager.findOne({ email });
    if (!manager) {
      console.log("Manager not found for email:", email);
      return res.status(404).json({ message: "Manager not found" });
    }
    
    console.log("Manager found:", manager.name, "Company ID:", manager.companyId);
    
    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      console.log("Invalid password for manager:", email);
      return res.status(401).json({ message: "Invalid password" });
    }
    
    // Get company details
    let company = null;
    if (manager.companyId) {
      company = await Company.findById(manager.companyId);
      console.log("Company found:", company ? company.name : "No company");
    }
    
    const token = jwt.sign({ 
      id: manager._id, 
      email: manager.email, 
      userType: 'manager', 
      companyId: manager.companyId 
    }, JWT_SECRET, { expiresIn: '1y' });
    
    console.log("Manager login successful:", manager.name);
    res.status(200).json({ message: "Login successful", token, manager, company });
  }
  catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
}

export const getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.find().populate("companyId", "name code address timezone");
    console.log("managers", managers)
    res.status(200).json({ message: "success", data: managers });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ message: "Error fetching managers", error });
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
    const checkCompanyOfAdmin = companyModels.findById({ companyId: req.user.id })
    console.log("checkCompanyOfAdmin ==> ", checkCompanyOfAdmin);
    
    const newManager = new Manager({
      email,
      password: hashedPassword,
      name,
      mobile,
      address,
      createdBy: adminId,
      companyId: req.user.companyId,
      // Manual location fields
      locationName: locationName || "Office",
      locationAddress: locationAddress || "",
      locationLatitude: locationLatitude || 0,
      locationLongitude: locationLongitude || 0,
      locationRadius: locationRadius || 100
    });

    await newManager.save();
    res.status(201).json({ message: "Manager created successfully", manager: newManager, company: checkCompanyOfAdmin });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error("Error creating manager:", error);
    res.status(500).json({ message: "Error creating manager", error });
  }
};
