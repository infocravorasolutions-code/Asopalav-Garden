const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['system', 'admin', 'manager', 'employee'], required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // only for employees
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    active: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
