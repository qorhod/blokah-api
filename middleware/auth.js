const jwt = require('jsonwebtoken');
const invalidTokens = []; // يمكنك استبدالها بقاعدة بيانات أو Redis لإدارة القائمة السوداء

/**
 * Middleware للتحقق من التوكن
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    console.log('Access denied: No Authorization header');
    return res.status(401).json({ message: 'Access denied: Missing Authorization header' });
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    console.log('Access denied: Token not provided');
    return res.status(401).json({ message: 'Access denied: Token not provided' });
  }

  // التحقق من التوكن في القائمة السوداء
  if (invalidTokens.includes(accessToken)) {
    console.log('Access denied: Token is invalid (blacklisted)');
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }

  try {
    const verified = jwt.verify(accessToken, process.env.JWT_SECRET); // فك التشفير
    req.user = verified; // إضافة المستخدم إلى الطلب
    console.log('Token verified, user:', req.user);
    next(); // الانتقال إلى الدالة التالية
  } catch (error) {
    console.error('Invalid token:', accessToken, error.message);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Middleware للتحقق من صلاحيات الدور
 */
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.accountType)) {
      console.log('Access forbidden: insufficient privileges for role', req.user.accountType);
      return res.status(403).json({ message: 'Access forbidden: insufficient privileges' });
    }
    next();
  };
};

/**
 * إضافة توكن إلى القائمة السوداء
 */
const addToBlacklist = (token) => {
  if (!invalidTokens.includes(token)) {
    invalidTokens.push(token);
    console.log('Token added to blacklist:', token);
  }
};

module.exports = { authenticateToken, authorizeRole, addToBlacklist };
