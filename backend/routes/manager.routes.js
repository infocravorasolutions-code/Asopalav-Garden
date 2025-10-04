import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Import controllers
import {
    createManager,
    getManager,
    updateManager,
    deleteManager,
    getAllManagers,
    getManagersByCompany,
    loginManager,
    getManagerTeamMembers,
    managerStepInEmployee,
    managerStepOutEmployee,
    getEmployeeAttendanceStatus
} from "../controller/manager.controller.js";
import { authenticateUser } from "../utils/middlewere.js";
import { requireRole, canManageManagers, checkReadOnlyAdmin } from "../utils/roleMiddleware.js";
const router = express.Router();
// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory path (goes up one level from current file)
const uploadDir = path.join(__dirname, "../upload");

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use the resolved path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Define routes
router.post("/", authenticateUser, canManageManagers, createManager);
router.post("/login", loginManager);
router.get("/", authenticateUser, getManagersByCompany); // Get managers for current company
router.get("/all", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), getAllManagers);
router.get("/company", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), getManagersByCompany);

// Manager team management routes
router.get("/team", authenticateUser, requireRole(['manager']), getManagerTeamMembers);
router.post("/step-in", authenticateUser, requireRole(['manager']), upload.single("stepInImage"), managerStepInEmployee);
router.post("/step-out", authenticateUser, requireRole(['manager']), upload.single("stepOutImage"), managerStepOutEmployee);
router.get("/employee/:employeeId/status", authenticateUser, requireRole(['manager']), getEmployeeAttendanceStatus);

router.get("/:id", authenticateUser, getManager);
router.put("/:id", authenticateUser, canManageManagers, updateManager);
router.delete("/:id", authenticateUser, canManageManagers, deleteManager);

export default router;