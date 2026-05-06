const ApiError = require('../utils/ApiError');

/**
 * Check if user has required role
 * @param {...String} roles - Allowed roles (e.g., 'admin', 'moderator')
 * 
 * Usage:
 * router.get('/admin', protect, checkRole('admin'), handler);
 * router.get('/mod', protect, checkRole('admin', 'moderator'), handler);
 */
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userRole = req.user.role;
    const allowedRoles = roles.flat();

    if (!allowedRoles.includes(userRole)) {
      return next(new ApiError(
        403,
        `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
      ));
    }

    next();
  };
};

module.exports = checkRole;
