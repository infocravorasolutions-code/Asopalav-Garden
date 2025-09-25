const mongoose = require('mongoose');
const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    stepInTime: Date,
    stepOutTime: Date,
    stepInLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
    stepOutLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: [Number] },
    status: String,
    totalHours: Number
}, { timestamps: true });
AttendanceSchema.index({ stepInLocation: '2dsphere' });
module.exports = mongoose.model('Attendance', AttendanceSchema);