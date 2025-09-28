import express from "express";
const router = express.Router();

// Import controllers
import { 
  createAdmin, 
  loginAdmin, 
  getAllAdmins, 
  getAdminById, 
  updateAdmin, 
  deleteAdmin 
} from "../controller/admin.controller.js";    
import { authenticateUser } from "../utils/middlewere.js";
import { requireRole, canManageManagers, checkReadOnlyAdmin } from "../utils/roleMiddleware.js";

// Define routes
router.post("/", createAdmin);
router.post("/login", loginAdmin); 
router.get("/all", authenticateUser, requireRole(['superadmin']), getAllAdmins);
router.get("/:id", authenticateUser, getAdminById);
router.put("/:id", authenticateUser, checkReadOnlyAdmin, updateAdmin);
router.delete("/:id", authenticateUser, requireRole(['superadmin']), deleteAdmin);








export default router;
