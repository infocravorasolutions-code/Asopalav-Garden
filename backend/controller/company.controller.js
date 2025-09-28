import Company from '../models/company.models.js';
import User from '../models/employee.models.js';

/**
 * Get company by ID
 */
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('❌ [getCompanyById] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company details',
      error: error.message
    });
  }
};

/**
 * Get company details by code
 */
export const getCompanyByCode = async (req, res) => {
  try {
    const { companyCode } = req.params;

    const company = await Company.findOne({ code: companyCode });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('❌ [getCompanyByCode] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company details',
      error: error.message
    });
  }
};

/**
 * Update company theme
 */
export const updateCompanyTheme = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      fontFamily,
      logo,
      logoUrl,
      theme
    } = req.body;

    const updateData = {};
    
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;
    if (accentColor) updateData.accentColor = accentColor;
    if (backgroundColor) updateData.backgroundColor = backgroundColor;
    if (textColor) updateData.textColor = textColor;
    if (fontFamily) updateData.fontFamily = fontFamily;
    if (logo) updateData.logo = logo;
    if (logoUrl) updateData.logoUrl = logoUrl;
    if (theme) updateData.theme = theme;

    const company = await Company.findByIdAndUpdate(
      companyId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company theme updated successfully',
      data: company
    });

  } catch (error) {
    console.error('❌ [updateCompanyTheme] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company theme',
      error: error.message
    });
  }
};

/**
 * Update company details
 */
export const updateCompanyDetails = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      name,
      address,
      phone,
      email,
      website,
      industry,
      description,
      timezone,
      settings
    } = req.body;

    const updateData = {};
    
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (website) updateData.website = website;
    if (industry) updateData.industry = industry;
    if (description) updateData.description = description;
    if (timezone) updateData.timezone = timezone;
    if (settings) updateData.settings = settings;

    const company = await Company.findByIdAndUpdate(
      companyId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company details updated successfully',
      data: company
    });

  } catch (error) {
    console.error('❌ [updateCompanyDetails] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company details',
      error: error.message
    });
  }
};

/**
 * Get company statistics
 */
export const getCompanyStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Get total employees
    const totalEmployees = await User.countDocuments({ 
      companyId, 
      role: { $in: ['employee', 'manager'] } 
    });

    // Get total managers
    const totalManagers = await User.countDocuments({ 
      companyId, 
      role: 'manager' 
    });

    // Get total admins
    const totalAdmins = await User.countDocuments({ 
      companyId, 
      role: { $in: ['admin', 'system'] } 
    });

    // Get active users (logged in within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      companyId,
      lastLogin: { $gte: twentyFourHoursAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalManagers,
        totalAdmins,
        activeUsers,
        totalUsers: totalEmployees + totalManagers + totalAdmins
      }
    });

  } catch (error) {
    console.error('❌ [getCompanyStats] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching company statistics',
      error: error.message
    });
  }
};

/**
 * Create new company
 */
export const createCompany = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      phone,
      email,
      website,
      industry,
      description,
      timezone,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      fontFamily,
      logo,
      logoUrl,
      theme,
      settings
    } = req.body;

    // Check if company code already exists
    const existingCompany = await Company.findOne({ code });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company code already exists'
      });
    }

    const companyData = {
      name,
      code,
      address,
      phone,
      email,
      website,
      industry,
      description,
      timezone: timezone || 'Asia/Kolkata',
      primaryColor: primaryColor || '#3B82F6',
      secondaryColor: secondaryColor || '#1E40AF',
      accentColor: accentColor || '#F59E0B',
      backgroundColor: backgroundColor || '#F8FAFC',
      textColor: textColor || '#1F2937',
      fontFamily: fontFamily || 'Inter',
      logo,
      logoUrl,
      theme: theme || {
        mode: 'light',
        borderRadius: '8px',
        shadow: 'sm',
        spacing: 'comfortable'
      },
      settings: settings || {
        allowEmployeeRegistration: false,
        requireLocationForAttendance: false,
        allowMultipleShifts: true,
        autoStepOutHours: 8,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        workingHours: {
          start: '09:00',
          end: '18:00'
        }
      }
    };

    const company = new Company(companyData);
    await company.save();

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });

  } catch (error) {
    console.error('❌ [createCompany] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company',
      error: error.message
    });
  }
};

/**
 * Get all companies (admin only)
 */
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({})
      .select('-__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: companies,
      count: companies.length
    });

  } catch (error) {
    console.error('❌ [getAllCompanies] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message
    });
  }
};

/**
 * Delete company
 */
export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company has users
    const userCount = await User.countDocuments({ companyId });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete company with existing users'
      });
    }

    const company = await Company.findByIdAndDelete(companyId);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('❌ [deleteCompany] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting company',
      error: error.message
    });
  }
};