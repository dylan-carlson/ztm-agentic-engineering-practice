const userQueries = require('../db/queries/users');
const { sendWelcomeEmail } = require('./notifications');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString, validateEmail } = require('../utils/validation');

function listUsers() {
  return userQueries.findAllUsers();
}

function getUserById(id) {
  const user = userQueries.findUserById(id);
  if (!user) throw httpError(404, 'User not found');
  return user;
}

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

function updateUser(id, data) {
  const existing = getUserById(id);
  const name = data.name !== undefined ? data.name : existing.name;
  const email = data.email !== undefined ? data.email : existing.email;
  // A duplicate email surfaces as a 500 with the raw UNIQUE message (pre-refactor behavior).
  userQueries.updateUser(id, name, email);
  return userQueries.findUserById(id);
}

function deleteUser(id) {
  const result = userQueries.deleteUser(id);
  if (result.changes === 0) throw httpError(404, 'User not found');
  return { deleted: true };
}

module.exports = { listUsers, getUserById, createUser, updateUser, deleteUser };
