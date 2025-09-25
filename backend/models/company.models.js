const mongoose = require('mongoose');
const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: String,
    timezone: { type: String, default: 'Asia/Kolkata' },
}, { timestamps: true });
module.exports = mongoose.model('Company', CompanySchema);