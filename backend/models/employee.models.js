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
    shift: { 
        type: String, 
        enum: ['morning', 'evening', 'night'], 
        default: 'morning' 
    },
    mobile: { type: String },
    address: { type: String },
    position: { type: String },
    empCode: { type: String },
    active: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
export default User;
