// routes/authRoutes.js
import express from "express";

import { forgotPassword, verifyOtpAndResetPassword } from "../controller/auth.controller.js";
import { loginEmployee } from "../controller/employee.controller.js";

const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtpAndResetPassword);
router.post("/employee/login", loginEmployee);

export default router;
