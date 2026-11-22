const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'yourfindjob-enterprise-secret-key-2026';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }
}

// Optional auth for public routes that can personalize if logged in
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {
      // ignore invalid token for optional auth
    }
  }
  next();
}

function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    const role = (req.user?.role || '').toLowerCase();
    if (role === 'admin' || role === 'super admin') {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.',
    });
  });
}

module.exports = {
  JWT_SECRET,
  authenticate,
  optionalAuth,
  requireAdmin,
};
