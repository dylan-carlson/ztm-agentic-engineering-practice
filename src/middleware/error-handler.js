// Express identifies error middleware by its four-argument signature, so `next` must stay.
/**
 * @description Express error middleware that sends err.status (default 500) and err.message as { error }, logging the stack for 5xx errors.
 *
 * @param {Error & { status?: number }} err - The error forwarded with next(err).
 * @param {import('express').Request} req - The request that failed.
 * @param {import('express').Response} res - The response the error is written to.
 * @param {import('express').NextFunction} next - Unused, but required for Express to treat this as error middleware.
 * @returns {void}
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err.stack || err);
  }
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
