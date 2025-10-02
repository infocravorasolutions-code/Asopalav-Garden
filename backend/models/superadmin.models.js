import { model, Schema, mongoose } from "mongoose";

const superAdminSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["superadmin"],
        default: "superadmin"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: {
        type: String,
        default: undefined
    },
    resetPasswordExpiry: {
        type: Date,
        default: undefined
    },
    otp: String,
    otpExpires: Date,
    lastLogin: {
        type: Date,
        default: null
    },
    permissions: {
        canCreateCompanies: { type: Boolean, default: true },
        canEditCompanies: { type: Boolean, default: true },
        canDeleteCompanies: { type: Boolean, default: true },
        canViewAllCompanies: { type: Boolean, default: true },
        canManageUsers: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

const SuperAdmin = model('SuperAdmin', superAdminSchema);
export default SuperAdmin;
