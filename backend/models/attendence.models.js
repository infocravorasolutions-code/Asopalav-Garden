import mongoose from 'mongoose';
import { SHIFT_ENUM } from '../constants/shifts.js';

const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    stepIn: { type: Date },
    stepOut: { type: Date },
    stepInImage: { type: String },
    stepOutImage: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    stepOutLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },
    note: { type: String },
    shift: { type: String, enum: Object.values(SHIFT_ENUM), default: SHIFT_ENUM.MORNING },
    status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'present' },
    totalTime: { type: Number }, // in minutes
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    lastKnownLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String },
        lastSeen: { type: Date }
    },
    lastLocationUpdate: { type: Date }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;