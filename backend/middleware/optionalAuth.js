// Optional auth middleware - doesn't fail if no token, just sets req.user if token exists
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return next(); // No token, continue without auth
    }

    const token = authHeader.replace('Bearer ', '').replace('bearer ', '');
    if (!token) {
      return next(); // No token, continue without auth
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded.user;
      next();
    } catch (err) {
      // Invalid token, continue without auth
      next();
    }
  } catch (err) {
    // Error reading headers, continue without auth
    next();
  }
};
