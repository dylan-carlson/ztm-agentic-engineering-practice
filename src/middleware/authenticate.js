// TODO: replace with real JWT validation
const { API_KEY } = require('../config');

function authenticate(req, res, next) {
  if (req.headers['x-api-key'] === API_KEY) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { authenticate };
