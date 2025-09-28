import express from "express";
const router = express.Router();
// Import controllers
import {
    createManager,
    getManager,
    updateManager,
    deleteManager,
    getAllManagers,
    loginManager
} from "../controller/manager.controller.js";   
import { authenticateUser } from "../utils/middlewere.js";
import { requireRole, canManageManagers, checkReadOnlyAdmin } from "../utils/roleMiddleware.js";

// Define routes
router.post("/", authenticateUser, canManageManagers, createManager);    
router.post("/login", loginManager);
router.get("/all", authenticateUser, requireRole(['superadmin', 'admin']), getAllManagers);
router.get("/:id", authenticateUser, getManager);
router.put("/:id", authenticateUser, canManageManagers, updateManager);  
router.delete("/:id", authenticateUser, canManageManagers, deleteManager);

export default router;