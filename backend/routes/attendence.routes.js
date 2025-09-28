import express from "express";
import multer from "multer";
import {
  markStepIn,
  markStepOut,
  getEmployeeAttendance,
  getAllAttendance,
  updateAttendance,
  bulkUpdateAttendance,
  deleteAttendance,
  locationWiseAttendence,
  checkEmployeeStatus,
  getEmployeeRoutes,
  getLiveStepIns,
  exportAttendanceExcel,
  exportAttendancePDF,
  getAttendanceSummary
} from "../controller/attendence.controller.js";
import { authenticateUser } from "../utils/middlewere.js";

const router = express.Router();

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// Check employee status
router.get("/status/:employeeId", authenticateUser, checkEmployeeStatus);

// Step in: upload single image
router.post("/step-in", authenticateUser, upload.single("stepInImage"), markStepIn);

// Update attendance by attendance ID (supports all fields including stepOut)
router.put("/:attendanceId", authenticateUser, upload.single("stepInImage"), updateAttendance);

// bulk update
router.post("/bulk-update", authenticateUser, bulkUpdateAttendance);

// Step out: upload single image
router.post("/step-out", authenticateUser, upload.single("stepOutImage"), markStepOut);

// Get all attendance records
router.get("/", authenticateUser, getAllAttendance);

// Delete attendance record (must come before other parameterized routes)
router.delete("/:attendanceId", authenticateUser, deleteAttendance);

// Add this route for fetching attendance by employeeId (must come after delete route)
router.get("/employee/:employeeId", authenticateUser, getEmployeeAttendance);

//location wise 
router.get("/locationwise", authenticateUser, locationWiseAttendence);


// Employee routes for admin map visualization
router.get("/routes", authenticateUser, getEmployeeRoutes);

// Live step-ins endpoint
router.get("/live-stepins", authenticateUser, getLiveStepIns);

// Export endpoints
router.get("/export/excel", authenticateUser, exportAttendanceExcel);
router.get("/export/pdf", authenticateUser, exportAttendancePDF);

// Summary endpoint
router.get("/summary", authenticateUser, getAttendanceSummary);

export default router;
