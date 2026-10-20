// TODO: replace with real JWT validation
const { API_KEY } = require('../config');

/**
 * @description Express middleware that lets the request through only when its x-api-key header matches the configured API_KEY, otherwise responding 401.
 *
 * @param {import('express').Request} req - The incoming request.
 * @param {import('express').Response} res - The response, used to send 401 on failure.
 * @param {import('express').NextFunction} next - Called to continue when the key matches.
 * @returns {void}
 */
function authenticate(req, res, next) {
  if (req.headers['x-api-key'] === API_KEY) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { authenticate };
