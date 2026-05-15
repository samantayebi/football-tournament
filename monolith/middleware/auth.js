const jwt    = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    logger.warn('unauthorized request', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    logger.warn('unauthorized request', { ip: req.ip });
    res.status(401).json({ error: 'Invalid token' });
  }
};
