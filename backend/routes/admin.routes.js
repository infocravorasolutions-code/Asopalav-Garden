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
import {
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary,
  exportAttendanceExcel,
  exportAttendancePDF
} from "../controller/attendence.controller.js";
import { authenticateUser } from "../utils/middlewere.js";
import { requireRole, canManageManagers, checkReadOnlyAdmin } from "../utils/roleMiddleware.js";

// Define routes
router.post("/", createAdmin);
router.post("/login", loginAdmin);
router.get("/all", authenticateUser, requireRole(['superadmin']), getAllAdmins);

// Admin attendance routes (must come before /:id route)
router.get("/attendance", authenticateUser, getAllAttendance);
router.put("/attendance/:attendanceId", authenticateUser, updateAttendance);
router.delete("/attendance/:attendanceId", authenticateUser, deleteAttendance);
router.get("/attendance/summary", authenticateUser, getAttendanceSummary);
router.get("/attendance/export/excel", authenticateUser, exportAttendanceExcel);
router.get("/attendance/export/pdf", authenticateUser, exportAttendancePDF);

// Admin CRUD routes (must come after specific routes)
router.get("/:id", authenticateUser, getAdminById);
router.put("/:id", authenticateUser, checkReadOnlyAdmin, updateAdmin);
router.delete("/:id", authenticateUser, requireRole(['superadmin']), deleteAdmin);








export default router;
