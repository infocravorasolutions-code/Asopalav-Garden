import mongoose from 'mongoose';

const SiteSchema = new mongoose.Schema({
    companyId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company', 
        required: true 
    },
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String,
        trim: true
    },
    address: { 
        type: String, 
        required: true,
        trim: true
    },
    coordinates: {
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
        }
    },
    radius: { 
        type: Number, 
        default: 100, // in meters
        min: 10,
        max: 1000
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    siteCode: { 
        type: String, 
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    siteType: {
        type: String,
        enum: ['garden', 'park', 'construction', 'maintenance', 'other'],
        default: 'garden'
    },
    assignedEmployees: [{
        employeeId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Employee' 
        },
        assignedDate: { 
            type: Date, 
            default: Date.now 
        },
        assignedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Admin' 
        },
        isActive: { 
            type: Boolean, 
            default: true 
        }
    }],
    
    // Site points as subdocuments
    points: [{
        name: { 
            type: String, 
            required: true,
            trim: true
        },
        description: { 
            type: String,
            trim: true
        },
        pointCode: { 
            type: String, 
            required: true,
            trim: true,
            uppercase: true
        },
        coordinates: {
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
            }
        },
        address: { 
            type: String,
            trim: true
        },
        radius: { 
            type: Number, 
            default: 50, // in meters
            min: 5,
            max: 500
        },
        pointType: {
            type: String,
            enum: ['checkpoint', 'work_area', 'storage', 'entrance', 'exit', 'break_area', 'other'],
            default: 'checkpoint'
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
        isRequired: { 
            type: Boolean, 
            default: false 
        },
        order: { 
            type: Number, 
            default: 0 
        },
        createdBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Admin', 
            required: true 
        },
        lastModifiedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Admin' 
        }
    }],
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin', 
        required: true 
    },
    lastModifiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Admin' 
    }
}, { 
    timestamps: true 
});

// Indexes for better performance
SiteSchema.index({ companyId: 1, isActive: 1 });
SiteSchema.index({ companyId: 1, siteCode: 1 }, { unique: true }); // Unique site code per company
SiteSchema.index({ 'assignedEmployees.employeeId': 1 });
SiteSchema.index({ coordinates: '2dsphere' }); // For geospatial queries

// Virtual for assigned employees count
SiteSchema.virtual('assignedEmployeesCount').get(function() {
    return this.assignedEmployees.filter(emp => emp.isActive).length;
});

// Method to assign employee to site
SiteSchema.methods.assignEmployee = function(employeeId, assignedBy) {
    // Check if employee is already assigned
    const existingAssignment = this.assignedEmployees.find(
        emp => emp.employeeId.toString() === employeeId.toString() && emp.isActive
    );
    
    if (existingAssignment) {
        throw new Error('Employee is already assigned to this site');
    }
    
    this.assignedEmployees.push({
        employeeId,
        assignedBy,
        assignedDate: new Date(),
        isActive: true
    });
    
    return this.save();
};

// Method to unassign employee from site
SiteSchema.methods.unassignEmployee = function(employeeId) {
    const assignment = this.assignedEmployees.find(
        emp => emp.employeeId.toString() === employeeId.toString() && emp.isActive
    );
    
    if (!assignment) {
        throw new Error('Employee is not assigned to this site');
    }
    
    assignment.isActive = false;
    return this.save();
};

// Method to get active assigned employees
SiteSchema.methods.getActiveAssignedEmployees = function() {
    return this.assignedEmployees.filter(emp => emp.isActive);
};

// Method to add point to site
SiteSchema.methods.addPoint = function(pointData, createdBy) {
    // Check if point code already exists in this site
    const existingPoint = this.points.find(p => p.pointCode === pointData.pointCode && p.isActive);
    if (existingPoint) {
        throw new Error('Point code already exists in this site');
    }
    
    const newPoint = {
        ...pointData,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    this.points.push(newPoint);
    return this.save();
};

// Method to update point in site
SiteSchema.methods.updatePoint = function(pointId, updateData, lastModifiedBy) {
    const point = this.points.id(pointId);
    if (!point) {
        throw new Error('Point not found');
    }
    
    // Check if point code is being updated and if it's unique
    if (updateData.pointCode && updateData.pointCode !== point.pointCode) {
        const existingPoint = this.points.find(p => 
            p.pointCode === updateData.pointCode && 
            p.isActive && 
            p._id.toString() !== pointId
        );
        if (existingPoint) {
            throw new Error('Point code already exists in this site');
        }
    }
    
    Object.assign(point, updateData);
    point.lastModifiedBy = lastModifiedBy;
    point.updatedAt = new Date();
    
    return this.save();
};

// Method to delete point from site (soft delete)
SiteSchema.methods.deletePoint = function(pointId) {
    const point = this.points.id(pointId);
    if (!point) {
        throw new Error('Point not found');
    }
    
    point.isActive = false;
    point.updatedAt = new Date();
    
    return this.save();
};

// Method to get active points
SiteSchema.methods.getActivePoints = function() {
    return this.points.filter(point => point.isActive).sort((a, b) => a.order - b.order);
};

// Method to reorder points
SiteSchema.methods.reorderPoints = function(pointOrders) {
    pointOrders.forEach(({ pointId, order }) => {
        const point = this.points.id(pointId);
        if (point) {
            point.order = order;
            point.updatedAt = new Date();
        }
    });
    
    return this.save();
};

// Static method to find sites near coordinates within a company
SiteSchema.statics.findNearbySites = function(latitude, longitude, companyId, maxDistance = 1000) {
    return this.find({
        coordinates: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        },
        companyId,
        isActive: true
    });
};

// Static method to get sites by company
SiteSchema.statics.getSitesByCompany = function(companyId) {
    return this.find({ companyId, isActive: true })
        .populate('assignedEmployees.employeeId', 'name empCode designation')
        .populate('assignedEmployees.assignedBy', 'name email')
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .sort({ createdAt: -1 });
};

// Static method to get site with assigned employees
SiteSchema.statics.getSiteWithEmployees = function(siteId) {
    return this.findById(siteId)
        .populate('assignedEmployees.employeeId', 'name empCode designation email mobile')
        .populate('assignedEmployees.assignedBy', 'name email')
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email');
};

const Site = mongoose.model('Site', SiteSchema);
export default Site;
