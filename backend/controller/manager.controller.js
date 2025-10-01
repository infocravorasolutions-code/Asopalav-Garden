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
