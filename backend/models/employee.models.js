import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['system', 'admin', 'manager', 'employee'], required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // only for employees
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdByRole: { type: String, enum: ['admin', 'manager'], default: 'admin' }, // Track who created the employee
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID of the creator

    // Employee Code
    empCode: { type: String, required: true },

    // Contact Information
    mobile: { type: String, required: true },
    address: { type: String, required: true },

    // Job Details
    designation: {
        type: String,
        enum: ['ladies guard', 'security guard', 'supervisor'],
        required: true
    },
    category: {
        type: String,
        enum: ['skilled', 'semi-skilled', 'unskilled'],
        required: true
    },

    // Shift Information
    shift: {
        type: String,
        enum: [
            'Morning Shift (7:00 AM - 3:00 PM)',
            'Evening Shift (3:00 PM - 11:00 PM)',
            'Night Shift (11:00 PM - 7:00 AM)'
        ],
        default: 'Morning Shift (7:00 AM - 3:00 PM)'
    },

    // Financial Information
    uanNumber: { type: String, required: true },
    esicNumber: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },

    // Employee Photo
    photo: { type: String }, // URL or filename of employee photo

    // Legacy fields for backward compatibility
    position: { type: String },
    active: { type: Boolean, default: true }
}, { timestamps: true });

const Employee = mongoose.model('Employee', UserSchema);
export default Employee;
