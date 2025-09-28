/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Required role: ' + roles.join(' or ')
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is readonly admin
 */
export const checkReadOnlyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // If user is readonly admin, restrict certain operations
  if (req.user.role === 'readonly') {
    // Block write operations for readonly admins
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (writeMethods.includes(req.method)) {
      return res.status(403).json({
        success: false,
        message: 'Read-only admin cannot perform write operations'
      });
    }
  }

  next();
};

/**
 * Middleware to check if user can access company data
 */
export const requireCompanyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Superadmin can access all companies
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Other users can only access their company data
  const requestedCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

  if (requestedCompanyId && requestedCompanyId !== req.user.companyId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your company data'
    });
  }

  next();
};

/**
 * Middleware to check if user can manage employees
 */
export const canManageEmployees = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Readonly admins cannot manage employees
  if (req.user.role === 'readonly') {
    return res.status(403).json({
      success: false,
      message: 'Read-only admin cannot manage employees'
    });
  }

  // Only superadmin and managers can manage employees
  if (!['superadmin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to manage employees'
    });
  }

  next();
};

/**
 * Middleware to check if user can manage managers
 */
export const canManageManagers = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Readonly admins cannot manage managers
  if (req.user.role === 'readonly') {
    return res.status(403).json({
      success: false,
      message: 'Read-only admin cannot manage managers'
    });
  }

  // Only superadmin and admin can manage managers
  if (!['superadmin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to manage managers'
    });
  }

  next();
};

/**
 * Middleware to check if user can view reports
 */
export const canViewReports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // All authenticated users can view reports
  next();
};

/**
 * Middleware to check if user can export data
 */
export const canExportData = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Readonly admins cannot export data
  if (req.user.role === 'readonly') {
    return res.status(403).json({
      success: false,
      message: 'Read-only admin cannot export data'
    });
  }

  // Only superadmin, admin, and managers can export data
  if (!['superadmin', 'admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to export data'
    });
  }

  next();
};
