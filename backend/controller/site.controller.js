import Site from '../models/site.models.js';
import Employee from '../models/employee.models.js';
import Company from '../models/company.models.js';

/**
 * Create a new site
 */
export const createSite = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      latitude,
      longitude,
      radius,
      siteCode,
      siteType,
      points
    } = req.body;

    const companyId = req.user.companyId;
    const createdBy = req.user.id || req.user._id;

    console.log('🏗️ [createSite] Request:', {
      name,
      siteCode,
      companyId,
      createdBy,
      pointsCount: points?.length || 0
    });

    // Validate required fields
    if (!name || !address || !latitude || !longitude || !siteCode) {
      return res.status(400).json({
        success: false,
        message: "Name, address, coordinates, and site code are required"
      });
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided"
      });
    }

    // Check if site code already exists within the same company
    const existingSite = await Site.findOne({ siteCode, companyId });
    if (existingSite) {
      return res.status(400).json({
        success: false,
        message: "Site code already exists in your company"
      });
    }

    // Process points to remove temporary IDs and ensure proper structure
    let processedPoints = [];
    if (points && points.length > 0) {
      try {
        console.log('📍 [createSite] Processing points:', points);
        processedPoints = points.map(point => {
          const { _id, ...pointData } = point; // Remove temporary ID
          return {
            ...pointData,
            createdBy: pointData.createdBy ? pointData.createdBy : createdBy, // Use existing createdBy or current user
            lastModifiedBy: pointData.lastModifiedBy ? pointData.lastModifiedBy : createdBy
          };
        });
        console.log('📍 [createSite] Processed points:', processedPoints);
      } catch (error) {
        console.error('❌ [createSite] Error processing points:', error);
        return res.status(400).json({
          success: false,
          message: "Error processing points data",
          error: error.message
        });
      }
    }

    // Create new site
    const site = new Site({
      companyId,
      name,
      description,
      address,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      radius: radius || 100,
      siteCode: siteCode.toUpperCase(),
      siteType: siteType || 'garden',
      createdBy,
      assignedEmployees: [],
      points: processedPoints // Include processed points
    });

    await site.save();

    console.log('✅ [createSite] Site created successfully:', site._id);

    res.status(201).json({
      success: true,
      message: "Site created successfully",
      data: {
        _id: site._id,
        name: site.name,
        siteCode: site.siteCode,
        address: site.address,
        coordinates: site.coordinates,
        radius: site.radius,
        siteType: site.siteType,
        isActive: site.isActive,
        createdAt: site.createdAt
      }
    });

  } catch (error) {
    console.error('❌ [createSite] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error creating site",
      error: error.message
    });
  }
};

/**
 * Get all sites for a company
 */
export const getAllSites = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { page = 1, limit = 10, search = '', siteType = '' } = req.query;

    console.log('📋 [getAllSites] Request:', {
      companyId,
      page,
      limit,
      search,
      siteType
    });

    // Build query
    let query = { companyId, isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { siteCode: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (siteType) {
      query.siteType = siteType;
    }

    // Get sites with pagination
    const sites = await Site.find(query)
      .populate('assignedEmployees.employeeId', 'name empCode designation')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSites = await Site.countDocuments(query);

    const formattedSites = sites.map(site => ({
      _id: site._id,
      name: site.name,
      description: site.description,
      siteCode: site.siteCode,
      address: site.address,
      coordinates: site.coordinates,
      radius: site.radius,
      siteType: site.siteType,
      isActive: site.isActive,
      points: site.points || [], // Include points in the response
      assignedEmployeesCount: site.assignedEmployeesCount,
      assignedEmployees: site.assignedEmployees.filter(emp => emp.isActive).map(emp => ({
        employeeId: emp.employeeId._id,
        employeeName: emp.employeeId.name,
        employeeCode: emp.employeeId.empCode,
        designation: emp.employeeId.designation,
        assignedDate: emp.assignedDate
      })),
      createdBy: site.createdBy,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedSites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSites / limit),
        totalSites,
        hasNext: page < Math.ceil(totalSites / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ [getAllSites] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching sites",
      error: error.message
    });
  }
};

/**
 * Get site by ID
 */
export const getSiteById = async (req, res) => {
  try {
    const { siteId } = req.params;
    const companyId = req.user.companyId;

    console.log('🔍 [getSiteById] Request:', { siteId, companyId });

    const site = await Site.getSiteWithEmployees(siteId);

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Check if site belongs to the company
    if (site.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const formattedSite = {
      _id: site._id,
      name: site.name,
      description: site.description,
      siteCode: site.siteCode,
      address: site.address,
      coordinates: site.coordinates,
      radius: site.radius,
      siteType: site.siteType,
      isActive: site.isActive,
      points: site.points || [], // Include points in the response
      assignedEmployees: site.getActiveAssignedEmployees().map(emp => ({
        _id: emp._id,
        employeeId: emp.employeeId._id,
        employeeName: emp.employeeId.name,
        employeeCode: emp.employeeId.empCode,
        designation: emp.employeeId.designation,
        email: emp.employeeId.email,
        mobile: emp.employeeId.mobile,
        assignedDate: emp.assignedDate,
        assignedBy: emp.assignedBy
      })),
      createdBy: site.createdBy,
      lastModifiedBy: site.lastModifiedBy,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt
    };

    res.status(200).json({
      success: true,
      data: formattedSite
    });

  } catch (error) {
    console.error('❌ [getSiteById] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching site",
      error: error.message
    });
  }
};

/**
 * Update site
 */
export const updateSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const companyId = req.user.companyId;
    const lastModifiedBy = req.user.id || req.user._id;
    const updateData = req.body;

    console.log('✏️ [updateSite] Request:', { 
      siteId, 
      companyId, 
      updateData,
      pointsCount: updateData.points?.length || 0
    });

    // Remove fields that shouldn't be updated directly
    delete updateData.companyId;
    delete updateData.createdBy;
    delete updateData.assignedEmployees;

    // Validate coordinates if provided
    if (updateData.latitude && updateData.longitude) {
      if (isNaN(updateData.latitude) || isNaN(updateData.longitude) ||
        updateData.latitude < -90 || updateData.latitude > 90 ||
        updateData.longitude < -180 || updateData.longitude > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates provided"
        });
      }
      updateData.coordinates = {
        latitude: parseFloat(updateData.latitude),
        longitude: parseFloat(updateData.longitude)
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    // Check if site code is being updated and if it's unique within the company
    if (updateData.siteCode) {
      const existingSite = await Site.findOne({ 
        siteCode: updateData.siteCode,
        companyId,
        _id: { $ne: siteId }
      });
      if (existingSite) {
        return res.status(400).json({
          success: false,
          message: "Site code already exists in your company"
        });
      }
      updateData.siteCode = updateData.siteCode.toUpperCase();
    }

    // Process points if provided
    if (updateData.points) {
      try {
        console.log('📍 [updateSite] Processing points:', updateData.points);
        const processedPoints = updateData.points.map(point => {
          const { _id, ...pointData } = point; // Remove temporary ID
          return {
            ...pointData,
            createdBy: pointData.createdBy ? pointData.createdBy : lastModifiedBy, // Use existing createdBy or current user
            lastModifiedBy: lastModifiedBy
          };
        });
        updateData.points = processedPoints;
        console.log('📍 [updateSite] Processed points:', processedPoints);
      } catch (error) {
        console.error('❌ [updateSite] Error processing points:', error);
        return res.status(400).json({
          success: false,
          message: "Error processing points data",
          error: error.message
        });
      }
    }

    updateData.lastModifiedBy = lastModifiedBy;

    try {
      const site = await Site.findOneAndUpdate(
        { _id: siteId, companyId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!site) {
        return res.status(404).json({
          success: false,
          message: "Site not found"
        });
      }

      console.log('✅ [updateSite] Site updated successfully');

      res.status(200).json({
        success: true,
        message: "Site updated successfully",
        data: {
          _id: site._id,
          name: site.name,
          siteCode: site.siteCode,
          address: site.address,
          coordinates: site.coordinates,
          radius: site.radius,
          siteType: site.siteType,
          isActive: site.isActive,
          points: site.points || [], // Include points in the response
          updatedAt: site.updatedAt
        }
      });
    } catch (dbError) {
      console.error('❌ [updateSite] Database error:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while updating site",
        error: dbError.message
      });
    }

  } catch (error) {
    console.error('❌ [updateSite] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error updating site",
      error: error.message
    });
  }
};

/**
 * Delete site (soft delete)
 */
export const deleteSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const companyId = req.user.companyId;

    console.log('🗑️ [deleteSite] Request:', { siteId, companyId });

    const site = await Site.findOneAndUpdate(
      { _id: siteId, companyId },
      { isActive: false },
      { new: true }
    );

    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    console.log('✅ [deleteSite] Site deleted successfully');

    res.status(200).json({
      success: true,
      message: "Site deleted successfully"
    });

  } catch (error) {
    console.error('❌ [deleteSite] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error deleting site",
      error: error.message
    });
  }
};

/**
 * Assign employee to site
 */
export const assignEmployeeToSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { employeeId, pointIds = [] } = req.body; // Optional point assignments
    const companyId = req.user.companyId;
    const assignedBy = req.user.id || req.user._id;

    console.log('👤 [assignEmployeeToSite] Request:', { siteId, employeeId, pointIds, companyId });

    // Validate required fields
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    // Check if site exists and belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Check if employee exists and belongs to company
    const employee = await Employee.findOne({ _id: employeeId, companyId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Assign employee to site
    await site.assignEmployee(employeeId, assignedBy);

    // Prepare point assignments if provided
    let assignedPoints = [];
    if (pointIds.length > 0) {
      const sitePoints = site.getActivePoints();
      assignedPoints = pointIds.map(pointId => {
        const point = sitePoints.find(p => p._id.toString() === pointId);
        if (point) {
          return {
            pointId: point._id,
            pointName: point.name,
            pointCode: point.pointCode,
            isRequired: point.isRequired,
            assignedBy
          };
        }
        return null;
      }).filter(Boolean);
    }

    // Update employee's assigned site and points information
    await Employee.findByIdAndUpdate(employeeId, {
      assignedSiteId: siteId,
      assignedSiteName: site.name,
      assignedSiteCode: site.siteCode,
      assignedPoints
    });

    // Get updated site with employee details
    const updatedSite = await Site.getSiteWithEmployees(siteId);

    console.log('✅ [assignEmployeeToSite] Employee assigned successfully');

    res.status(200).json({
      success: true,
      message: "Employee assigned to site successfully",
      data: {
        siteId: site._id,
        siteName: site.name,
        employeeId: employee._id,
        employeeName: employee.name,
        employeeCode: employee.empCode,
        assignedPoints: assignedPoints.length,
        assignedDate: new Date()
      }
    });

  } catch (error) {
    console.error('❌ [assignEmployeeToSite] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error assigning employee to site",
      error: error.message
    });
  }
};

/**
 * Unassign employee from site
 */
export const unassignEmployeeFromSite = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { employeeId } = req.body;
    const companyId = req.user.companyId;

    console.log('👤 [unassignEmployeeFromSite] Request:', { siteId, employeeId, companyId });

    // Validate required fields
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required"
      });
    }

    // Check if site exists and belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Unassign employee from site
    await site.unassignEmployee(employeeId);

    // Clear employee's assigned site information
    await Employee.findByIdAndUpdate(employeeId, {
      assignedSiteId: null,
      assignedSiteName: null,
      assignedSiteCode: null
    });

    console.log('✅ [unassignEmployeeFromSite] Employee unassigned successfully');

    res.status(200).json({
      success: true,
      message: "Employee unassigned from site successfully"
    });

  } catch (error) {
    console.error('❌ [unassignEmployeeFromSite] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error unassigning employee from site",
      error: error.message
    });
  }
};

/**
 * Get employees available for assignment
 */
export const getAvailableEmployees = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { search = '' } = req.query;

    console.log('👥 [getAvailableEmployees] Request:', { companyId, search });

    // Build query
    let query = { companyId, active: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { empCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await Employee.find(query)
      .select('name empCode designation email mobile')
      .sort({ name: 1 });

    const formattedEmployees = employees.map(emp => ({
      _id: emp._id,
      name: emp.name,
      empCode: emp.empCode,
      designation: emp.designation,
      email: emp.email,
      mobile: emp.mobile
    }));

    res.status(200).json({
      success: true,
      data: formattedEmployees,
      count: formattedEmployees.length
    });

  } catch (error) {
    console.error('❌ [getAvailableEmployees] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching available employees",
      error: error.message
    });
  }
};

/**
 * Get sites near coordinates
 */
export const getNearbySites = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 1000 } = req.query;
    const companyId = req.user.companyId;

    console.log('📍 [getNearbySites] Request:', { latitude, longitude, maxDistance, companyId });

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    const sites = await Site.findNearbySites(
      parseFloat(latitude),
      parseFloat(longitude),
      companyId,
      parseInt(maxDistance)
    );

    const formattedSites = sites.map(site => ({
      _id: site._id,
      name: site.name,
      siteCode: site.siteCode,
      address: site.address,
      coordinates: site.coordinates,
      radius: site.radius,
      siteType: site.siteType,
      assignedEmployeesCount: site.assignedEmployeesCount
    }));

    res.status(200).json({
      success: true,
      data: formattedSites,
      count: formattedSites.length
    });

  } catch (error) {
    console.error('❌ [getNearbySites] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching nearby sites",
      error: error.message
    });
  }
};

/**
 * Get site statistics
 */
export const getSiteStatistics = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    console.log('📊 [getSiteStatistics] Request:', { companyId });

    const totalSites = await Site.countDocuments({ companyId, isActive: true });
    const sitesWithEmployees = await Site.countDocuments({
      companyId,
      isActive: true,
      'assignedEmployees.0': { $exists: true }
    });
    const totalAssignedEmployees = await Site.aggregate([
      { $match: { companyId, isActive: true } },
      { $unwind: '$assignedEmployees' },
      { $match: { 'assignedEmployees.isActive': true } },
      { $count: 'total' }
    ]);

    const siteTypeStats = await Site.aggregate([
      { $match: { companyId, isActive: true } },
      { $group: { _id: '$siteType', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalSites,
        sitesWithEmployees,
        totalAssignedEmployees: totalAssignedEmployees[0]?.total || 0,
        siteTypeStats: siteTypeStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('❌ [getSiteStatistics] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching site statistics",
      error: error.message
    });
  }
};

// ==================== SITE POINTS MANAGEMENT ====================

/**
 * Create a new site point
 */
export const createSitePoint = async (req, res) => {
  try {
    const { siteId } = req.params;
    const {
      name,
      description,
      latitude,
      longitude,
      address,
      radius,
      pointCode,
      pointType,
      isRequired,
      order
    } = req.body;

    const companyId = req.user.companyId;
    const createdBy = req.user.id || req.user._id;

    console.log('📍 [createSitePoint] Request:', {
      siteId,
      name,
      pointCode,
      companyId,
      createdBy
    });

    // Validate required fields
    if (!name || !latitude || !longitude || !pointCode) {
      return res.status(400).json({
        success: false,
        message: "Name, coordinates, and point code are required"
      });
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided"
      });
    }

    // Find site and check if it belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Prepare point data
    const pointData = {
      name,
      description,
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      address: address || '',
      radius: radius || 50,
      pointCode: pointCode.toUpperCase(),
      pointType: pointType || 'checkpoint',
      isRequired: isRequired || false,
      order: order || 0
    };

    // Add point to site
    await site.addPoint(pointData, createdBy);

    console.log('✅ [createSitePoint] Point created successfully');

    res.status(201).json({
      success: true,
      message: "Site point created successfully",
      data: {
        siteId: site._id,
        pointData
      }
    });

  } catch (error) {
    console.error('❌ [createSitePoint] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating site point",
      error: error.message
    });
  }
};

/**
 * Get all points for a site
 */
export const getSitePoints = async (req, res) => {
  try {
    const { siteId } = req.params;
    const companyId = req.user.companyId;

    console.log('📍 [getSitePoints] Request:', { siteId, companyId });

    // Find site and check if it belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    const points = site.getActivePoints();

    const formattedPoints = points.map(point => ({
      _id: point._id,
      siteId: site._id,
      name: point.name,
      description: point.description,
      pointCode: point.pointCode,
      coordinates: point.coordinates,
      radius: point.radius,
      pointType: point.pointType,
      isRequired: point.isRequired,
      order: point.order,
      isActive: point.isActive,
      createdBy: point.createdBy,
      lastModifiedBy: point.lastModifiedBy,
      createdAt: point.createdAt,
      updatedAt: point.updatedAt
    }));

    res.status(200).json({
      success: true,
      data: formattedPoints,
      count: formattedPoints.length
    });

  } catch (error) {
    console.error('❌ [getSitePoints] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching site points",
      error: error.message
    });
  }
};

/**
 * Update site point
 */
export const updateSitePoint = async (req, res) => {
  try {
    const { siteId, pointId } = req.params;
    const companyId = req.user.companyId;
    const lastModifiedBy = req.user.id || req.user._id;
    const updateData = req.body;

    console.log('📍 [updateSitePoint] Request:', { siteId, pointId, companyId, updateData });

    // Find site and check if it belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Validate coordinates if provided
    if (updateData.latitude && updateData.longitude) {
      if (isNaN(updateData.latitude) || isNaN(updateData.longitude) ||
        updateData.latitude < -90 || updateData.latitude > 90 ||
        updateData.longitude < -180 || updateData.longitude > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates provided"
        });
      }
      updateData.coordinates = {
        latitude: parseFloat(updateData.latitude),
        longitude: parseFloat(updateData.longitude)
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    if (updateData.pointCode) {
      updateData.pointCode = updateData.pointCode.toUpperCase();
    }

    // Update point in site
    await site.updatePoint(pointId, updateData, lastModifiedBy);

    console.log('✅ [updateSitePoint] Point updated successfully');

    res.status(200).json({
      success: true,
      message: "Site point updated successfully"
    });

  } catch (error) {
    console.error('❌ [updateSitePoint] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating site point",
      error: error.message
    });
  }
};

/**
 * Delete site point
 */
export const deleteSitePoint = async (req, res) => {
  try {
    const { siteId, pointId } = req.params;
    const companyId = req.user.companyId;

    console.log('📍 [deleteSitePoint] Request:', { siteId, pointId, companyId });

    // Find site and check if it belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Delete point from site
    await site.deletePoint(pointId);

    console.log('✅ [deleteSitePoint] Point deleted successfully');

    res.status(200).json({
      success: true,
      message: "Site point deleted successfully"
    });

  } catch (error) {
    console.error('❌ [deleteSitePoint] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting site point",
      error: error.message
    });
  }
};

/**
 * Reorder points within a site
 */
export const reorderSitePoints = async (req, res) => {
  try {
    const { siteId } = req.params;
    const { pointOrders } = req.body; // Array of { pointId, order }
    const companyId = req.user.companyId;

    console.log('📍 [reorderSitePoints] Request:', { siteId, pointOrders, companyId });

    if (!Array.isArray(pointOrders)) {
      return res.status(400).json({
        success: false,
        message: "Point orders must be an array"
      });
    }

    // Find site and check if it belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Reorder points
    await site.reorderPoints(pointOrders);

    console.log('✅ [reorderSitePoints] Points reordered successfully');

    res.status(200).json({
      success: true,
      message: "Points reordered successfully"
    });

  } catch (error) {
    console.error('❌ [reorderSitePoints] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error reordering points",
      error: error.message
    });
  }
};

/**
 * Get point statistics for a site
 */
export const getSitePointStatistics = async (req, res) => {
  try {
    const { siteId } = req.params;
    const companyId = req.user.companyId;

    console.log('📍 [getSitePointStatistics] Request:', { siteId, companyId });

    // Find site and check if it belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    const points = site.getActivePoints();
    const totalPoints = points.length;
    const requiredPoints = points.filter(p => p.isRequired).length;
    const optionalPoints = totalPoints - requiredPoints;

    const pointTypeStats = points.reduce((acc, point) => {
      acc[point.pointType] = (acc[point.pointType] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        totalPoints,
        requiredPoints,
        optionalPoints,
        pointTypeStats
      }
    });

  } catch (error) {
    console.error('❌ [getSitePointStatistics] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching point statistics",
      error: error.message
    });
  }
};

/**
 * Assign specific points to employee
 */
export const assignPointsToEmployee = async (req, res) => {
  try {
    const { siteId, employeeId } = req.params;
    const { pointIds } = req.body;
    const companyId = req.user.companyId;
    const assignedBy = req.user.id || req.user._id;

    console.log('📍 [assignPointsToEmployee] Request:', { siteId, employeeId, pointIds, companyId });

    if (!pointIds || !Array.isArray(pointIds)) {
      return res.status(400).json({
        success: false,
        message: "Point IDs array is required"
      });
    }

    // Find site and check if it belongs to company
    const site = await Site.findOne({ _id: siteId, companyId });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found"
      });
    }

    // Check if employee exists and belongs to company
    const employee = await Employee.findOne({ _id: employeeId, companyId });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check if employee is assigned to this site
    if (employee.assignedSiteId?.toString() !== siteId) {
      return res.status(400).json({
        success: false,
        message: "Employee is not assigned to this site"
      });
    }

    // Get site points and validate point IDs
    const sitePoints = site.getActivePoints();
    const validPoints = pointIds.map(pointId => {
      const point = sitePoints.find(p => p._id.toString() === pointId);
      if (point) {
        return {
          pointId: point._id,
          pointName: point.name,
          pointCode: point.pointCode,
          isRequired: point.isRequired,
          assignedBy,
          assignedDate: new Date()
        };
      }
      return null;
    }).filter(Boolean);

    // Update employee's assigned points
    await Employee.findByIdAndUpdate(employeeId, {
      assignedPoints: validPoints
    });

    console.log('✅ [assignPointsToEmployee] Points assigned successfully');

    res.status(200).json({
      success: true,
      message: "Points assigned to employee successfully",
      data: {
        employeeId: employee._id,
        employeeName: employee.name,
        siteId: site._id,
        siteName: site.name,
        assignedPoints: validPoints.length,
        points: validPoints.map(p => ({
          pointId: p.pointId,
          pointName: p.pointName,
          pointCode: p.pointCode,
          isRequired: p.isRequired
        }))
      }
    });

  } catch (error) {
    console.error('❌ [assignPointsToEmployee] Error:', error);
    res.status(500).json({
      success: false,
      message: "Error assigning points to employee",
      error: error.message
    });
  }
};
