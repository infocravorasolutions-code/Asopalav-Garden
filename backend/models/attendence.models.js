import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
    shift: { type: String, enum: ['morning', 'evening', 'night'], default: 'morning' },
    status: { type: String, enum: ['present', 'absent', 'late', 'half-day'], default: 'present' },
    totalTime: { type: Number }, // in minutes
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