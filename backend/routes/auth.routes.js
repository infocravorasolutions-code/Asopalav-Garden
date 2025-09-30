import express from 'express';
import {
    forgotPassword,
    resetPassword,
    verifyResetToken
} from '../controller/auth.controller.js';

const router = express.Router();

// Forgot Password Route
router.post('/forgot-password', forgotPassword);

// Reset Password Route
router.post('/reset-password', resetPassword);

// Verify Reset Token Route
router.get('/verify-reset-token', verifyResetToken);

export default router;