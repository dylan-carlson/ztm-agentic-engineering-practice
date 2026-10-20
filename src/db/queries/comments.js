const { db } = require('..');

/**
 * @description Fetches all comments on a task, oldest first, each with its author's name as user_name.
 *
 * @param {number|string} taskId - ID of the task.
 * @returns {Object[]} Comment rows with a user_name field.
 */
function findCommentsByTaskId(taskId) {
  return db.prepare(
    'SELECT c.*, u.name as user_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at ASC'
  ).all(taskId);
}

/**
 * @description Fetches a single comment by ID, with its author's name as user_name.
 *
 * @param {number|bigint} id - ID of the comment.
 * @returns {Object|undefined} The comment row, or undefined if none matches.
 */
function findCommentById(id) {
  return db.prepare(
    'SELECT c.*, u.name as user_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?'
  ).get(id);
}

/**
 * @description Inserts a comment on a task.
 *
 * @param {number|string} taskId - ID of the task being commented on.
 * @param {number} userId - ID of the commenting user.
 * @param {string} body - Comment text.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function insertComment(taskId, userId, body) {
  return db.prepare(
    'INSERT INTO comments (task_id, user_id, body) VALUES (?, ?, ?)'
  ).run(taskId, userId, body);
}

module.exports = { findCommentsByTaskId, findCommentById, insertComment };
