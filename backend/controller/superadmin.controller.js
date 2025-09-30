import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import SuperAdmin from '../models/superadmin.models.js';
import Company from '../models/company.models.js';
import Admin from '../models/admin.models.js';
import Manager from '../models/manager.models.js';
import Employee from '../models/employee.models.js';

// Email configuration
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    });
};

// SuperAdmin Login
export const superAdminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find superadmin
        const superAdmin = await SuperAdmin.findOne({ email, isActive: true });

        if (!superAdmin) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, superAdmin.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Update last login
        superAdmin.lastLogin = new Date();
        await superAdmin.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: superAdmin._id,
                email: superAdmin.email,
                role: 'superadmin',
                name: superAdmin.name
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role,
                permissions: superAdmin.permissions
            }
        });

    } catch (error) {
        console.error("❌ [superAdminLogin] Error:", error);
        res.status(500).json({
            success: false,
            message: "Error during login",
            error: error.message
        });
    }
};

// Get all companies for SuperAdmin
export const getAllCompaniesForSuperAdmin = async (req, res) => {
    try {
        const companies = await Company.find({})
            .select('-__v')
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email');

        // Get statistics for each company
        const companiesWithStats = await Promise.all(
            companies.map(async (company) => {
                const adminCount = await Admin.countDocuments({ companyId: company._id });
                const managerCount = await Manager.countDocuments({ companyId: company._id });
                const employeeCount = await Employee.countDocuments({ companyId: company._id });

                return {
                    ...company.toObject(),
                    stats: {
                        admins: adminCount,
                        managers: managerCount,
                        employees: employeeCount,
                        totalUsers: adminCount + managerCount + employeeCount
                    }
                };
            })
        );

        res.status(200).json({
            success: true,
            data: companiesWithStats,
            count: companiesWithStats.length
        });

    } catch (error) {
        console.error('❌ [getAllCompaniesForSuperAdmin] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching companies',
            error: error.message
        });
    }
};

// Create new company by SuperAdmin
export const createCompanyBySuperAdmin = async (req, res) => {
    try {
        const {
            name,
            code,
            address,
            phone,
            email,
            website,
            industry,
            description,
            timezone,
            primaryColor,
            secondaryColor,
            accentColor,
            backgroundColor,
            textColor,
            fontFamily,
            logo,
            logoUrl,
            theme,
            settings
        } = req.body;

        // Check if company code already exists
        const existingCompany = await Company.findOne({ code });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'Company code already exists'
            });
        }

        const companyData = {
            name,
            code,
            address,
            phone,
            email,
            website,
            industry,
            description,
            timezone: timezone || 'Asia/Kolkata',
            primaryColor: primaryColor || '#3B82F6',
            secondaryColor: secondaryColor || '#1E40AF',
            accentColor: accentColor || '#F59E0B',
            backgroundColor: backgroundColor || '#F8FAFC',
            textColor: textColor || '#1F2937',
            fontFamily: fontFamily || 'Inter',
            logo,
            logoUrl,
            theme: theme || {
                mode: 'light',
                borderRadius: '8px',
                shadow: 'sm',
                spacing: 'comfortable'
            },
            settings: settings || {
                allowEmployeeRegistration: false,
                requireLocationForAttendance: false,
                allowMultipleShifts: true,
                autoStepOutHours: 8,
                workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                workingHours: {
                    start: '09:00',
                    end: '18:00'
                }
            },
            createdBy: req.user.id
        };

        const company = new Company(companyData);
        await company.save();

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: company
        });

    } catch (error) {
        console.error('❌ [createCompanyBySuperAdmin] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating company',
            error: error.message
        });
    }
};

// Update company by SuperAdmin
export const updateCompanyBySuperAdmin = async (req, res) => {
    try {
        const { companyId } = req.params;
        const updateData = req.body;

        const company = await Company.findByIdAndUpdate(
            companyId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Company updated successfully',
            data: company
        });

    } catch (error) {
        console.error('❌ [updateCompanyBySuperAdmin] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating company',
            error: error.message
        });
    }
};

// Delete company by SuperAdmin
export const deleteCompanyBySuperAdmin = async (req, res) => {
    try {
        const { companyId } = req.params;

        // Check if company has users
        const adminCount = await Admin.countDocuments({ companyId });
        const managerCount = await Manager.countDocuments({ companyId });
        const employeeCount = await Employee.countDocuments({ companyId });

        const totalUsers = adminCount + managerCount + employeeCount;

        if (totalUsers > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete company with ${totalUsers} existing users. Please remove all users first.`,
                userCount: {
                    admins: adminCount,
                    managers: managerCount,
                    employees: employeeCount,
                    total: totalUsers
                }
            });
        }

        const company = await Company.findByIdAndDelete(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Company deleted successfully'
        });

    } catch (error) {
        console.error('❌ [deleteCompanyBySuperAdmin] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting company',
            error: error.message
        });
    }
};

// Get company details by SuperAdmin
export const getCompanyDetailsBySuperAdmin = async (req, res) => {
    try {
        const { companyId } = req.params;

        const company = await Company.findById(companyId);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Get all users for this company
        const admins = await Admin.find({ companyId }).select('name email mobile role createdAt');
        const managers = await Manager.find({ companyId }).select('name email mobile role createdAt');
        const employees = await Employee.find({ companyId }).select('name email mobile role createdAt');

        res.status(200).json({
            success: true,
            data: {
                company,
                users: {
                    admins,
                    managers,
                    employees,
                    totalUsers: admins.length + managers.length + employees.length
                }
            }
        });

    } catch (error) {
        console.error('❌ [getCompanyDetailsBySuperAdmin] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company details',
            error: error.message
        });
    }
};

// Forgot Password for SuperAdmin
export const superAdminForgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        const superAdmin = await SuperAdmin.findOne({ email, isActive: true });

        if (!superAdmin) {
            return res.status(404).json({
                success: false,
                message: "SuperAdmin not found with this email address"
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save reset token to superadmin
        superAdmin.resetPasswordToken = resetToken;
        superAdmin.resetPasswordExpiry = resetTokenExpiry;
        await superAdmin.save();

        // Create email transporter
        const transporter = createTransporter();

        // Email content
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/superadmin/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: email,
            subject: 'SuperAdmin Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">SuperAdmin Password Reset Request</h2>
          <p>Hello ${superAdmin.name},</p>
          <p>You have requested to reset your SuperAdmin password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "Password reset email sent successfully",
            email: email
        });

    } catch (error) {
        console.error("❌ [superAdminForgotPassword] Error:", error);
        res.status(500).json({
            success: false,
            message: "Error sending password reset email",
            error: error.message
        });
    }
};

// Reset Password for SuperAdmin
export const superAdminResetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required"
            });
        }

        // Find superadmin with valid reset token
        const superAdmin = await SuperAdmin.findOne({
            resetPasswordToken: token,
            resetPasswordExpiry: { $gt: Date.now() }
        });

        if (!superAdmin) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token"
            });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update superadmin password and clear reset token
        superAdmin.password = hashedPassword;
        superAdmin.resetPasswordToken = undefined;
        superAdmin.resetPasswordExpiry = undefined;
        await superAdmin.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.error("❌ [superAdminResetPassword] Error:", error);
        res.status(500).json({
            success: false,
            message: "Error resetting password",
            error: error.message
        });
    }
};

// Get SuperAdmin profile
export const getSuperAdminProfile = async (req, res) => {
    try {
        const superAdmin = await SuperAdmin.findById(req.user.id)
            .select('-password -resetPasswordToken -resetPasswordExpiry -otp -otpExpires');

        if (!superAdmin) {
            return res.status(404).json({
                success: false,
                message: 'SuperAdmin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: superAdmin
        });

    } catch (error) {
        console.error('❌ [getSuperAdminProfile] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching SuperAdmin profile',
            error: error.message
        });
    }
};

// Update SuperAdmin profile
export const updateSuperAdminProfile = async (req, res) => {
    try {
        const { name, mobile, address } = req.body;
        const updateData = {};

        if (name) updateData.name = name;
        if (mobile) updateData.mobile = mobile;
        if (address) updateData.address = address;

        const superAdmin = await SuperAdmin.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpiry -otp -otpExpires');

        if (!superAdmin) {
            return res.status(404).json({
                success: false,
                message: 'SuperAdmin not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: superAdmin
        });

    } catch (error) {
        console.error('❌ [updateSuperAdminProfile] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};
