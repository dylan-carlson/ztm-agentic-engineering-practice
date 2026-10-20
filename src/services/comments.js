const commentQueries = require('../db/queries/comments');
const userQueries = require('../db/queries/users');
const { getExistingTask } = require('./tasks');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

/**
 * @description Lists a task's comments, throwing 404 if the task does not exist.
 *
 * @param {number|string} taskId - ID of the task.
 * @returns {Object[]} Comment rows with a user_name field.
 */
function listCommentsForTask(taskId) {
  getExistingTask(taskId);
  return commentQueries.findCommentsByTaskId(taskId);
}

/**
 * @description Validates and adds a comment to a task, throwing 404 for a missing task and 400 for a missing body, user_id or user.
 *
 * @param {number|string} taskId - ID of the task.
 * @param {Object} data - Request body.
 * @param {number|string} data.user_id - ID of the commenting user.
 * @param {string} data.body - Comment text.
 * @returns {Object} The created comment row with user_name.
 */
function createComment(taskId, { user_id, body }) {
  getExistingTask(taskId);
  if (!isNonEmptyString(body)) throw httpError(400, 'body is required');
  if (!user_id) throw httpError(400, 'user_id is required');
  const userId = parseInt(user_id);
  if (!userQueries.findUserById(userId)) throw httpError(400, 'user not found');

  const result = commentQueries.insertComment(taskId, userId, body);
  return commentQueries.findCommentById(result.lastInsertRowid);
}

module.exports = { listCommentsForTask, createComment };
