// Services throw these; the central error handler turns them into { error } responses.
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { httpError };
