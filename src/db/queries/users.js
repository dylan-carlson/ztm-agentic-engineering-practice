const { db } = require('..');

/**
 * @description Fetches all users, newest first.
 *
 * @returns {Object[]} User rows.
 */
function findAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
}

/**
 * @description Fetches a single user by ID.
 *
 * @param {number|string|bigint} id - ID of the user.
 * @returns {Object|undefined} The user row, or undefined if none matches.
 */
function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

/**
 * @description Inserts a user, throwing a SQLite UNIQUE error if the email already exists.
 *
 * @param {string} name - User name.
 * @param {string} email - User email address.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function insertUser(name, email) {
  return db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(name, email);
}

/**
 * @description Overwrites a user's name and email.
 *
 * @param {number|string} id - ID of the user to update.
 * @param {string} name - New name.
 * @param {string} email - New email address.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function updateUser(id, name, email) {
  return db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id);
}

/**
 * @description Deletes a user by ID.
 *
 * @param {number|string} id - ID of the user to delete.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The run result; changes is 0 if no user matched.
 */
function deleteUser(id) {
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

module.exports = { findAllUsers, findUserById, insertUser, updateUser, deleteUser };
