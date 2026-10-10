const commentQueries = require('../db/queries/comments');
const userQueries = require('../db/queries/users');
const { getExistingTask } = require('./tasks');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

function listCommentsForTask(taskId) {
  getExistingTask(taskId);
  return commentQueries.findCommentsByTaskId(taskId);
}

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
