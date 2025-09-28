import mongoose from 'mongoose';

const employeeRouteSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  attendanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    required: true
  },
  routePoints: [{
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
      default: 'Location not available'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    accuracy: {
      type: Number,
      default: null
    },
  }],
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    default: null
  },
  totalDistance: {
    type: Number,
    default: 0 // in meters
  },
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
employeeRouteSchema.index({ employeeId: 1, attendanceId: 1 });
employeeRouteSchema.index({ startTime: -1 });
employeeRouteSchema.index({ isActive: 1, status: 1 });
employeeRouteSchema.index({ 'routePoints.timestamp': -1 });

// Virtual for route duration
employeeRouteSchema.virtual('duration').get(function () {
  if (!this.endTime) return null;
  return this.endTime - this.startTime;
});

// Virtual for formatted route
employeeRouteSchema.virtual('formattedRoute').get(function () {
  return this.routePoints.map(point => ({
    lat: point.latitude,
    lng: point.longitude,
    address: point.address,
    timestamp: point.timestamp,
  }));
});

// Instance method to add a route point
employeeRouteSchema.methods.addRoutePoint = function (latitude, longitude, address, accuracy) {
  this.routePoints.push({
    latitude,
    longitude,
    address: address || 'Location not available',
    timestamp: new Date(),
    accuracy
  });

  // Update total distance if we have more than one point
  if (this.routePoints.length > 1) {
    const lastPoint = this.routePoints[this.routePoints.length - 2];
    const currentPoint = this.routePoints[this.routePoints.length - 1];

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      lastPoint.latitude, lastPoint.longitude,
      currentPoint.latitude, currentPoint.longitude
    );

    this.totalDistance += distance;
  }

  return this.save();
};

// Instance method to calculate distance between two points
employeeRouteSchema.methods.calculateDistance = function (lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Instance method to end the route
employeeRouteSchema.methods.endRoute = function () {
  this.endTime = new Date();
  this.isActive = false;
  this.status = 'completed';
  return this.save();
};

// Static method to find active routes for an employee
employeeRouteSchema.statics.findActiveRoute = function (employeeId, attendanceId) {
  return this.findOne({
    employeeId,
    attendanceId,
    isActive: true,
    status: 'active'
  });
};


// Static method to get route statistics
employeeRouteSchema.statics.getRouteStats = function (employeeId, startTime, endTime) {
  return this.aggregate([
    {
      $match: {
        employeeId: new mongoose.Types.ObjectId(employeeId),
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    },
    {
      $group: {
        _id: null,
        totalRoutes: { $sum: 1 },
        totalDistance: { $sum: '$totalDistance' },
        totalDuration: { $sum: { $subtract: ['$endTime', '$startTime'] } },
        avgDistance: { $avg: '$totalDistance' },
        avgDuration: { $avg: { $subtract: ['$endTime', '$startTime'] } }
      }
    }
  ]);
};

const EmployeeRoute = mongoose.model('EmployeeRoute', employeeRouteSchema);

export default EmployeeRoute;



