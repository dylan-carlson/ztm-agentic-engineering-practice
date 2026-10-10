const tagQueries = require('../db/queries/tags');
const { getExistingTask } = require('./tasks');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

function isUniqueViolation(err) {
  return Boolean(err.message && err.message.includes('UNIQUE'));
}

function listTags() {
  return tagQueries.findAllTags();
}

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

function removeTagFromTask(taskId, tagId) {
  const result = tagQueries.deleteTaskTag(taskId, tagId);
  if (result.changes === 0) throw httpError(404, 'Tag not applied to this task');
  return { deleted: true };
}

module.exports = { listTags, createTag, addTagToTask, removeTagFromTask };
