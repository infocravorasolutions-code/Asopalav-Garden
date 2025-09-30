import jwt from "jsonwebtoken";
import Admin from "../models/admin.models.js";
import Manager from "../models/manager.models.js";
import Employee from "../models/employee.models.js";
import companyModels from "../models/company.models.js";

// export const authenticateUser = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   // console.log("[AUTH] Incoming Authorization header:", authHeader);

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   const token = authHeader.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // console.log("[AUTH] Decoded JWT user:", decoded);
//     let user;
//     if (decoded.userType === "admin") {
//       user = await Admin.findById(decoded.id);
//     } else if (decoded.userType === "manager") {
//       user = await Manager.findById(decoded.id);
//     } else if (decoded.userType === "employee") {
//       user = await Employee.findById(decoded.id);
//     }

//     if (!user) {
//       return res.status(401).json({ message: "User not found" });
//     }

//     req.user = {
//       id: user._id,
//       role: user.role || decoded.userType, // Use decoded userType as fallback
//       userType: decoded.userType,
//     };

//     // Read-only admins can only do GET
//     if (req.user.role === "readonly" && req.method !== "GET") {
//       return res.status(403).json({ message: "Read-only admin cannot modify data" });
//     }



//     next();
//   } catch (err) {
//     console.error("Auth error:", err);
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

// export function authenticateAccessToken(req, res, next) {
//   const auth = req.headers.authorization;
//   if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });

//   const token = auth.split(' ')[1];
//   try {
//     const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
//     // payload should contain sub (userId), role, company
//     req.user = {
//       id: payload.sub,
//       role: payload.role,
//       company: payload.company,
//     };
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: 'Invalid or expired token' });
//   }
// }


//for commpany relation

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;
    let company = null;

    if (decoded.userType === "admin") {
      user = await Admin.findById(decoded.id).populate("companyId", "name code timezone");
      if (user?.companyId) company = user.companyId;
    } else if (decoded.userType === "manager") {
      user = await Manager.findById(decoded.id).populate("companyId", "name code timezone");
      if (user?.companyId) company = user.companyId;
    } else if (decoded.userType === "employee") {
      user = await Employee.findById(decoded.id).populate("companyId", "name code timezone");
      if (user?.companyId) company = user.companyId;
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user._id,
      role: user.role || decoded.userType, // fallback if no explicit role
      userType: decoded.userType,
      company: company ? { id: company._id, name: company.name, code: company.code } : null,
      companyId: decoded.companyId || (company ? company._id : null), // Add companyId from JWT or populated company
    };

    // Read-only restriction
    if (req.user.role === "readonly" && req.method !== "GET") {
      return res.status(403).json({ message: "Read-only user cannot modify data" });
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};

export function authenticateAccessToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: payload.sub,
      role: payload.role,
      company: payload.company ? payload.company : null, // super-admin may not have company
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Generic token authentication for SuperAdmin
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // For SuperAdmin, we need to check if it's a SuperAdmin token
    if (decoded.role === 'superadmin') {
      // Import SuperAdmin model dynamically to avoid circular dependency
      const SuperAdmin = (await import('../models/superadmin.models.js')).default;
      const superAdmin = await SuperAdmin.findById(decoded.id);

      if (!superAdmin || !superAdmin.isActive) {
        return res.status(401).json({ message: "SuperAdmin not found or inactive" });
      }

      req.user = {
        id: superAdmin._id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: 'superadmin',
        permissions: superAdmin.permissions
      };
    } else {
      // For regular users, use the existing authentication logic
      let user = null;
      let company = null;

      if (decoded.userType === "admin") {
        user = await Admin.findById(decoded.id).populate("companyId", "name code timezone");
        if (user?.companyId) company = user.companyId;
      } else if (decoded.userType === "manager") {
        user = await Manager.findById(decoded.id).populate("companyId", "name code timezone");
        if (user?.companyId) company = user.companyId;
      } else if (decoded.userType === "employee") {
        user = await Employee.findById(decoded.id).populate("companyId", "name code timezone");
        if (user?.companyId) company = user.companyId;
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = {
        id: user._id,
        role: user.role || decoded.userType,
        userType: decoded.userType,
        company: company ? { id: company._id, name: company.name, code: company.code } : null,
        companyId: decoded.companyId || (company ? company._id : null),
      };

      // Read-only restriction
      if (req.user.role === "readonly" && req.method !== "GET") {
        return res.status(403).json({ message: "Read-only user cannot modify data" });
      }
    }

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};
