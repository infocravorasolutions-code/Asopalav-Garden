import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    radiusMeters: { type: Number, default: 100 }
}, { timestamps: true });

const Location = mongoose.model('Location', LocationSchema);
export default Location;