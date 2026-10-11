/**
 * Creates an Error carrying an HTTP status code. Services throw these; the
 * central error handler turns them into { error } responses.
 *
 * @param {number} status - HTTP status code to respond with (e.g. 400, 404).
 * @param {string} message - Error message sent to the client as `error`.
 * @returns {Error & { status: number }} An Error with a `status` property set.
 */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { httpError };
