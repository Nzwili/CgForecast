const jwt = require('jsonwebtoken');

/**
 * Middleware: verifies JWT in Authorization header.
 * Attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  // Check cookie first, then Authorization header
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cg-forecast-secret-presentation-key-2026');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware factory: checks that the authenticated user has one of the allowed roles.
 * @param {string[]} roles
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
