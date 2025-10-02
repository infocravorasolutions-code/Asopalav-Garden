import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Admin from '../models/admin.models.js';
import Manager from '../models/manager.models.js';
import Employee from '../models/employee.models.js';

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Forgot Password - Send Reset Email
export const forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({
        message: "Email and user type are required"
      });
    }

    // Find user based on user type
    let user;
    let UserModel;

    switch (userType) {
      case 'admin':
        UserModel = Admin;
        break;
      case 'manager':
        UserModel = Manager;
        break;
      case 'employee':
        UserModel = Employee;
        break;
      default:
        return res.status(400).json({
          message: "Invalid user type"
        });
    }

    user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found with this email address"
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Create email transporter
    const transporter = createTransporter();

    // Email content
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&type=${userType}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name || 'User'},</p>
          <p>You have requested to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
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
      message: "Password reset email sent successfully",
      email: email
    });

  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({
      message: "Error sending password reset email",
      error: error.message
    });
  }
};

// Reset Password - Verify Token and Update Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, userType } = req.body;

    if (!token || !newPassword || !userType) {
      return res.status(400).json({
        message: "Token, new password, and user type are required"
      });
    }

    // Find user based on user type
    let user;
    let UserModel;

    switch (userType) {
      case 'admin':
        UserModel = Admin;
        break;
      case 'manager':
        UserModel = Manager;
        break;
      case 'employee':
        UserModel = Employee;
        break;
      default:
        return res.status(400).json({
          message: "Invalid user type"
        });
    }

    // Find user with valid reset token
    user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.passwordHash = hashedPassword; // For compatibility
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({
      message: "Error resetting password",
      error: error.message
    });
  }
};

// Verify Reset Token
export const verifyResetToken = async (req, res) => {
  try {
    const { token, userType } = req.query;

    if (!token || !userType) {
      return res.status(400).json({
        message: "Token and user type are required"
      });
    }

    // Find user based on user type
    let user;
    let UserModel;

    switch (userType) {
      case 'admin':
        UserModel = Admin;
        break;
      case 'manager':
        UserModel = Manager;
        break;
      case 'employee':
        UserModel = Employee;
        break;
      default:
        return res.status(400).json({
          message: "Invalid user type"
        });
    }

    // Find user with valid reset token
    user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token"
      });
    }

    res.status(200).json({
      message: "Token is valid",
      email: user.email,
      name: user.name
    });

  } catch (error) {
    console.error("Error verifying reset token:", error);
    res.status(500).json({
      message: "Error verifying reset token",
      error: error.message
    });
  }
};