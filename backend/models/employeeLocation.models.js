import mongoose from 'mongoose';

const employeeLocationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeCode: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  address: {
    type: String,
    required: true,
    default: 'Location not available'
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    default: null
  },
  status: {
    type: String,
    enum: ['working', 'offline', 'tracking'],
    default: 'tracking'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  accuracy: {
    type: Number,
    default: null
  },
  lastCronUpdate: {
    type: Date,
    default: null
  },
  deviceInfo: {
    type: {
      deviceId: { type: String },
      platform: { type: String },
      userAgent: { type: String },
      appVersion: { type: String }
    },
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
employeeLocationSchema.index({ employeeId: 1, timestamp: -1 });
employeeLocationSchema.index({ isOnline: 1, status: 1 });
employeeLocationSchema.index({ latitude: 1, longitude: 1, timestamp: -1 });
employeeLocationSchema.index({ lastSeen: -1 });
employeeLocationSchema.index({ employeeCode: 1 });
employeeLocationSchema.index({ status: 1, timestamp: -1 });

// Virtual for formatted location
employeeLocationSchema.virtual('formattedLocation').get(function () {
  return {
    latitude: this.latitude,
    longitude: this.longitude,
    address: this.address,
    accuracy: this.accuracy
  };
});


// Instance method to check if location is fresh (within last 15 minutes)
employeeLocationSchema.methods.isFresh = function () {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return this.lastSeen > fifteenMinutesAgo;
};

// Instance method to get status with freshness
employeeLocationSchema.methods.getCurrentStatus = function () {
  if (!this.isOnline) return 'offline';
  if (!this.isFresh()) return 'offline';
  return this.status;
};

// Static method to find online employees
employeeLocationSchema.statics.findOnline = function () {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  return this.find({
    isOnline: true,
    lastSeen: { $gte: fifteenMinutesAgo },
    status: { $in: ['working', 'tracking'] }
  }).populate('employeeId', 'name empCode designation email');
};


// Pre-save middleware to update timestamps
employeeLocationSchema.pre('save', function (next) {
  if (this.isModified('latitude') || this.isModified('longitude')) {
    this.timestamp = new Date();
    this.lastSeen = new Date();
  }
  next();
});

// Pre-save middleware to validate coordinates
employeeLocationSchema.pre('save', function (next) {
  if (this.latitude !== null && this.latitude !== undefined && (this.latitude < -90 || this.latitude > 90)) {
    return next(new Error('Invalid latitude: must be between -90 and 90'));
  }
  if (this.longitude !== null && this.longitude !== undefined && (this.longitude < -180 || this.longitude > 180)) {
    return next(new Error('Invalid longitude: must be between -180 and 180'));
  }
  next();
});

const EmployeeLocation = mongoose.model('EmployeeLocation', employeeLocationSchema);

export default EmployeeLocation;
