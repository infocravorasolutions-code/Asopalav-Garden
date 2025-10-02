import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    address: String,
    timezone: { type: String, default: 'Asia/Kolkata' },

    // Company branding and theme
    logo: { type: String }, // URL or path to logo
    logoUrl: { type: String }, // Full URL to logo
    primaryColor: { type: String, default: '#3B82F6' }, // Primary brand color
    secondaryColor: { type: String, default: '#1E40AF' }, // Secondary brand color
    accentColor: { type: String, default: '#F59E0B' }, // Accent color
    backgroundColor: { type: String, default: '#F8FAFC' }, // Background color
    textColor: { type: String, default: '#1F2937' }, // Text color
    fontFamily: { type: String, default: 'Inter' }, // Font family

    // Company details
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    industry: { type: String },
    description: { type: String },

    // Theme settings
    theme: {
        mode: { type: String, enum: ['light', 'dark'], default: 'light' },
        borderRadius: { type: String, default: '8px' },
        shadow: { type: String, default: 'sm' },
        spacing: { type: String, default: 'comfortable' }
    },

    // Company settings
    settings: {
        allowEmployeeRegistration: { type: Boolean, default: false },
        requireLocationForAttendance: { type: Boolean, default: false },
        allowMultipleShifts: { type: Boolean, default: true },
        autoStepOutHours: { type: Number, default: 8 },
        workingDays: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
        workingHours: {
            start: { type: String, default: '09:00' },
            end: { type: String, default: '18:00' }
        }
    },

    // Track who created the company
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SuperAdmin',
        required: false
    }
}, { timestamps: true });

const Company = mongoose.model('Company', CompanySchema);
export default Company;