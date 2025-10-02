import express from "express";
const router = express.Router();
// Import controllers
import {
    createManager,
    getManager,
    updateManager,
    deleteManager,
    getAllManagers,
    getManagersByCompany,
    loginManager
} from "../controller/manager.controller.js";
import { authenticateUser } from "../utils/middlewere.js";
import { requireRole, canManageManagers, checkReadOnlyAdmin } from "../utils/roleMiddleware.js";

// Define routes
router.post("/", authenticateUser, canManageManagers, createManager);
router.post("/login", loginManager);
router.get("/", authenticateUser, getManagersByCompany); // Get managers for current company
router.get("/all", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), getAllManagers);
router.get("/company", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), getManagersByCompany);
router.get("/:id", authenticateUser, getManager);
router.put("/:id", authenticateUser, canManageManagers, updateManager);
router.delete("/:id", authenticateUser, canManageManagers, deleteManager);

export default router;