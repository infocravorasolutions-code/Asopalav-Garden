import express from "express";
import {
  createSite,
  getAllSites,
  getSiteById,
  updateSite,
  deleteSite,
  assignEmployeeToSite,
  unassignEmployeeFromSite,
  getAvailableEmployees,
  getNearbySites,
  getSiteStatistics,
  createSitePoint,
  getSitePoints,
  updateSitePoint,
  deleteSitePoint,
  reorderSitePoints,
  getSitePointStatistics,
  assignPointsToEmployee
} from "../controller/site.controller.js";
import { authenticateUser } from "../utils/middlewere.js";
import { requireRole } from "../utils/roleMiddleware.js";

const router = express.Router();

// Site management routes (Admin only)
router.post("/", authenticateUser, requireRole(['admin', 'superadmin']), createSite);
router.get("/", authenticateUser, getAllSites);
router.get("/statistics", authenticateUser, getSiteStatistics);
router.get("/nearby", authenticateUser, getNearbySites);
router.get("/available-employees", authenticateUser, getAvailableEmployees);
router.get("/:siteId", authenticateUser, getSiteById);
router.put("/:siteId", authenticateUser, requireRole(['admin', 'superadmin']), updateSite);
router.delete("/:siteId", authenticateUser, requireRole(['admin', 'superadmin']), deleteSite);

// Employee assignment routes (Admin only)
router.post("/:siteId/assign", authenticateUser, requireRole(['admin', 'superadmin']), assignEmployeeToSite);
router.post("/:siteId/unassign", authenticateUser, requireRole(['admin', 'superadmin']), unassignEmployeeFromSite);
router.post("/:siteId/employees/:employeeId/points", authenticateUser, requireRole(['admin', 'superadmin']), assignPointsToEmployee);

// Site points management routes (Admin only)
router.post("/:siteId/points", authenticateUser, requireRole(['admin', 'superadmin']), createSitePoint);
router.get("/:siteId/points", authenticateUser, getSitePoints);
router.get("/:siteId/points/statistics", authenticateUser, getSitePointStatistics);
router.put("/:siteId/points/:pointId", authenticateUser, requireRole(['admin', 'superadmin']), updateSitePoint);
router.delete("/:siteId/points/:pointId", authenticateUser, requireRole(['admin', 'superadmin']), deleteSitePoint);
router.post("/:siteId/points/reorder", authenticateUser, requireRole(['admin', 'superadmin']), reorderSitePoints);

export default router;
