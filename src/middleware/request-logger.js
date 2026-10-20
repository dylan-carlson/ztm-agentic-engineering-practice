/**
 * @description Express middleware that logs a timestamp, the HTTP method and the URL of each request.
 *
 * @param {import('express').Request} req - The incoming request.
 * @param {import('express').Response} res - The response (unused).
 * @param {import('express').NextFunction} next - Called to continue to the next handler.
 * @returns {void}
 */
function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

module.exports = { requestLogger };
