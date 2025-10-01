import express from "express";
import {
  updateEmployeeLocation,
  getOnlineEmployees,
  getEmployeeLocationHistory,
  markEmployeeOffline,
  // testGeoFencing,
  validateGeoFenceWithAWS,
  recordStepInWithAWS,
  getAddressFromCoords,
  toggleDevelopmentMode
} from "../controller/location.controller.js";
import { authenticateUser } from "../utils/middlewere.js";

const router = express.Router();

// Employee location tracking routes
router.post("/update", authenticateUser, updateEmployeeLocation);
router.post("/offline", authenticateUser, markEmployeeOffline);

// Admin/Manager routes for monitoring
router.get("/online", authenticateUser, getOnlineEmployees);
router.get("/history/:employeeId", authenticateUser, getEmployeeLocationHistory);
router.get("/stats", authenticateUser);

// Testing and utility routes
// router.post("/test-geofencing", authenticateUser, testGeoFencing);

// AWS Location Service routes (with bearer token authentication)
router.post("/validate-geofence", authenticateUser, validateGeoFenceWithAWS);
router.post("/step-in", authenticateUser, recordStepInWithAWS);
router.get("/address", authenticateUser, getAddressFromCoords);
// router.get("/aws-status", authenticateUser, getAWSLocationStatus);
router.post("/toggle-development-mode", authenticateUser, toggleDevelopmentMode);

export default router;
