const userQueries = require('../db/queries/users');
const { sendWelcomeEmail } = require('./notifications');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString, validateEmail } = require('../utils/validation');

/**
 * @description Lists all users, newest first.
 *
 * @returns {Object[]} User rows.
 */
function listUsers() {
  return userQueries.findAllUsers();
}

/**
 * @description Fetches a user, throwing 404 if it does not exist.
 *
 * @param {number|string} id - ID of the user.
 * @returns {Object} The user row.
 */
function getUserById(id) {
  const user = userQueries.findUserById(id);
  if (!user) throw httpError(404, 'User not found');
  return user;
}

/**
 * @description Validates and creates a user, then sends a welcome email, throwing 400 for a missing or invalid field and 409 for a duplicate email.
 *
 * @param {Object} data - Request body.
 * @param {string} data.name - User name.
 * @param {string} data.email - User email address.
 * @returns {Promise<Object>} The created user row.
 */
async function createUser({ name, email }) {
  if (!isNonEmptyString(name)) throw httpError(400, 'name is required');
  if (!isNonEmptyString(email)) throw httpError(400, 'email is required');
  if (!validateEmail(email)) throw httpError(400, 'Invalid email address');

  let result;
  try {
    result = userQueries.insertUser(name, email);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      throw httpError(409, 'email already exists');
    }
    throw err;
  }
  const user = userQueries.findUserById(result.lastInsertRowid);
  await sendWelcomeEmail(user);
  return user;
}

/**
 * @description Updates the name and email present in data and keeps the rest, throwing 404 if the user does not exist.
 *
 * @param {number|string} id - ID of the user.
 * @param {Object} data - Request body with any of name and email.
 * @returns {Object} The updated user row.
 */
function updateUser(id, data) {
  const existing = getUserById(id);
  const name = data.name !== undefined ? data.name : existing.name;
  const email = data.email !== undefined ? data.email : existing.email;
  // A duplicate email surfaces as a 500 with the raw UNIQUE message (pre-refactor behavior).
  userQueries.updateUser(id, name, email);
  return userQueries.findUserById(id);
}

/**
 * @description Deletes a user, throwing 404 if it does not exist.
 *
 * @param {number|string} id - ID of the user.
 * @returns {{ deleted: true }}
 */
function deleteUser(id) {
  const result = userQueries.deleteUser(id);
  if (result.changes === 0) throw httpError(404, 'User not found');
  return { deleted: true };
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
