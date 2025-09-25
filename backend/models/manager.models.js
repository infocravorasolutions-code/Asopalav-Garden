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
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin"
  },
  location: {
    type: Types.ObjectId,
    ref: "Location",
    required: true
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
