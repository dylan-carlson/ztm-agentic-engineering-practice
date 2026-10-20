const tagQueries = require('../db/queries/tags');
const { getExistingTask } = require('./tasks');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

function isUniqueViolation(err) {
  return Boolean(err.message && err.message.includes('UNIQUE'));
}

/**
 * @description Lists all tags, sorted by name.
 *
 * @returns {Object[]} Tag rows.
 */
function listTags() {
  return tagQueries.findAllTags();
}

/**
 * @description Creates a tag with a lowercased, trimmed name, throwing 400 if name is missing and 409 if it already exists.
 *
 * @param {Object} data - Request body.
 * @param {string} data.name - Tag name.
 * @returns {Object} The created tag row.
 */
function createTag({ name }) {
  if (!isNonEmptyString(name)) throw httpError(400, 'name is required');
  let result;
  try {
    result = tagQueries.insertTag(name.toLowerCase().trim());
  } catch (err) {
    if (isUniqueViolation(err)) throw httpError(409, 'tag already exists');
    throw err;
  }
  return tagQueries.findTagById(result.lastInsertRowid);
}

/**
 * @description Applies a tag to a task, throwing 404 for a missing task or tag, 400 for a missing tag_id and 409 if already applied.
 *
 * @param {number|string} taskId - ID of the task.
 * @param {Object} data - Request body.
 * @param {number|string} data.tag_id - ID of the tag to apply.
 * @returns {{ task_id: number|string, tag_id: number }} The task/tag pair that was linked.
 */
function addTagToTask(taskId, { tag_id }) {
  getExistingTask(taskId);
  if (!tag_id) throw httpError(400, 'tag_id is required');
  const tagId = parseInt(tag_id);
  if (!tagQueries.findTagById(tagId)) throw httpError(404, 'Tag not found');

  try {
    tagQueries.insertTaskTag(taskId, tagId);
  } catch (err) {
    if (isUniqueViolation(err)) throw httpError(409, 'tag already applied to this task');
    throw err;
  }
  return { task_id: taskId, tag_id: tagId };
}

/**
 * @description Removes a tag from a task, throwing 404 if the tag was not applied.
 *
 * @param {number|string} taskId - ID of the task.
 * @param {number|string} tagId - ID of the tag.
 * @returns {{ deleted: true }}
 */
function removeTagFromTask(taskId, tagId) {
  const result = tagQueries.deleteTaskTag(taskId, tagId);
  if (result.changes === 0) throw httpError(404, 'Tag not applied to this task');
  return { deleted: true };
}

module.exports = { listTags, createTag, addTagToTask, removeTagFromTask };
