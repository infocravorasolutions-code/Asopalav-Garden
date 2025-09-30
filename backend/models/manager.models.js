import { model, Schema, Types, mongoose } from "mongoose";


const managerSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    default: "manager"
  },
  resetPasswordToken: {
    type: String,
    default: undefined
  },
  resetPasswordExpiry: {
    type: Date,
    default: undefined
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin"
  },
  // Manual location fields instead of location reference
  locationName: {
    type: String,
    default: "Office"
  },
  locationAddress: {
    type: String,
    default: ""
  },
  locationLatitude: {
    type: Number,
    default: 0
  },
  locationLongitude: {
    type: Number,
    default: 0
  },
  locationRadius: {
    type: Number,
    default: 100 // in meters
  },
  isActive: {
    type: Boolean,
    default: false
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  otp: String,
  otpExpires: Date,
},
  {
    timestamps: true
  });

const Manager = model('Manager', managerSchema);
export default Manager;
