import express from "express";
import { 
  createCompany, 
  getCompanyById,
  getCompanyByCode,
  updateCompanyTheme,
  updateCompanyDetails,
  getCompanyStats,
  getAllCompanies,
  deleteCompany
} from '../controller/company.controller.js';
import { authenticateUser } from '../utils/middlewere.js';

const router = express.Router();

// Public routes
router.get("/companies/code/:companyCode", getCompanyByCode);

// Protected routes
router.post("/companies", authenticateUser, createCompany);
router.get("/companies", authenticateUser, getAllCompanies);
router.get("/companies/:id", authenticateUser, getCompanyById);
router.get("/companies/:companyId/stats", authenticateUser, getCompanyStats);
router.put("/companies/:companyId/theme", authenticateUser, updateCompanyTheme);
router.put("/companies/:companyId/details", authenticateUser, updateCompanyDetails);
router.delete("/companies/:companyId", authenticateUser, deleteCompany);

export default router;
