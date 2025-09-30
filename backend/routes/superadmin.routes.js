import express from 'express';
import {
    superAdminLogin,
    getAllCompaniesForSuperAdmin,
    createCompanyBySuperAdmin,
    updateCompanyBySuperAdmin,
    deleteCompanyBySuperAdmin,
    getCompanyDetailsBySuperAdmin,
    superAdminForgotPassword,
    superAdminResetPassword,
    getSuperAdminProfile,
    updateSuperAdminProfile
} from '../controller/superadmin.controller.js';
import { authenticateToken } from '../utils/middlewere.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', superAdminLogin);
router.post('/forgot-password', superAdminForgotPassword);
router.post('/reset-password', superAdminResetPassword);

// Protected routes (authentication required)
router.use(authenticateToken);

// Profile routes
router.get('/profile', getSuperAdminProfile);
router.put('/profile', updateSuperAdminProfile);

// Company management routes
router.get('/companies', getAllCompaniesForSuperAdmin);
router.post('/companies', createCompanyBySuperAdmin);
router.get('/companies/:companyId', getCompanyDetailsBySuperAdmin);
router.put('/companies/:companyId', updateCompanyBySuperAdmin);
router.delete('/companies/:companyId', deleteCompanyBySuperAdmin);

export default router;
