const mongoose = require('mongoose');
const LocationSchema = new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    radiusMeters: { type: Number, default: 100 }
}, { timestamps: true });
module.exports = mongoose.model('Location', LocationSchema);