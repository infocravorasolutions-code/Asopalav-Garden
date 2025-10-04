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
    loginEmployee,
    getMusterRollReport,
    exportMusterRollExcel,
    exportMusterRollPDF,
    assignSiteToEmployee,
    assignPointsToEmployee,
    getEmployeeSiteAssignment
} from "../controller/employee.controller.js";

import { authenticateUser } from "../utils/middlewere.js";
import { requireRole, canManageEmployees } from "../utils/roleMiddleware.js";

// Define routes
router.post("/", authenticateUser, canManageEmployees, createEmployee);
router.post("/login", loginEmployee);
router.get("/", authenticateUser, getAllEmployees); // Get employees for current company
router.get("/all", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), getAllEmployees);
router.get("/team", authenticateUser, requireRole(['manager']), getEmployeesByManager);
router.get("/muster-roll", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), getMusterRollReport);
router.get("/muster-roll/export/excel", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), exportMusterRollExcel);
router.get("/muster-roll/export/pdf", authenticateUser, requireRole(['superadmin', 'admin', 'readonly']), exportMusterRollPDF);
router.get("/:id", authenticateUser, getEmployee);
router.put("/:id", authenticateUser, canManageEmployees, updateEmployee);
router.delete("/:id", authenticateUser, canManageEmployees, deleteEmployee);

// Site and point assignment routes
router.post("/:id/assign-site", authenticateUser, canManageEmployees, assignSiteToEmployee);
router.post("/:id/assign-points", authenticateUser, canManageEmployees, assignPointsToEmployee);
router.get("/:id/site-assignment", authenticateUser, getEmployeeSiteAssignment);

export default router;