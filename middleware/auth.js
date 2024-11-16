
// لاتاكد من التوكن 

const jwt = require('jsonwebtoken');
const invalidTokens = [];

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    console.log('Access denied: No auth header');
    return res.status(401).json({ message: 'Access denied' });
  }

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken) {
    console.log('Access denied: No token provided');
    return res.status(401).json({ message: 'Access denied' });
  }

  if (invalidTokens.includes(accessToken)) {
    console.log('Access denied: Token is invalid');
    return res.status(401).json({ message: 'Token is invalid' });
  }

  try {
    const verified = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = verified;
    console.log('Token verified, user:', req.user);
    next();
  } catch (error) {
    console.log('Invalid token');
    res.status(400).json({ message: 'Invalid token' });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.accountType)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient privileges' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole, invalidTokens };
