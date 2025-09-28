import express from "express";
const router = express.Router();

// Import controllers
import {
    createEmployee,
    getEmployee,
    updateEmployee,
    deleteEmployee,
    getAllEmployees,
    getEmployeesByManager,
    loginEmployee
} from "../controller/employee.controller.js";   

import { authenticateUser } from "../utils/middlewere.js";
import { requireRole, canManageEmployees } from "../utils/roleMiddleware.js";

// Define routes
router.post("/", authenticateUser, canManageEmployees, createEmployee);    
router.post("/login", loginEmployee);
router.get("/all", authenticateUser, requireRole(['superadmin', 'admin']), getAllEmployees);
router.get("/team", authenticateUser, requireRole(['manager']), getEmployeesByManager);
router.get("/:id", authenticateUser, getEmployee);
router.put("/:id", authenticateUser, canManageEmployees, updateEmployee);  
router.delete("/:id", authenticateUser, canManageEmployees, deleteEmployee);

export default router;