const { db } = require('..');

/**
 * @description Fetches all tags, sorted by name.
 *
 * @returns {Object[]} Tag rows.
 */
function findAllTags() {
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
}

/**
 * @description Fetches a single tag by ID.
 *
 * @param {number|bigint} id - ID of the tag.
 * @returns {Object|undefined} The tag row, or undefined if none matches.
 */
function findTagById(id) {
  return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
}

/**
 * @description Inserts a tag, throwing a SQLite UNIQUE error if the name already exists.
 *
 * @param {string} name - Tag name.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function insertTag(name) {
  return db.prepare('INSERT INTO tags (name) VALUES (?)').run(name);
}

/**
 * @description Fetches all tags applied to a task.
 *
 * @param {number|string} taskId - ID of the task.
 * @returns {Object[]} Tag rows.
 */
function findTagsByTaskId(taskId) {
  return db.prepare(
    'SELECT t.* FROM tags t JOIN task_tags tt ON tt.tag_id = t.id WHERE tt.task_id = ?'
  ).all(taskId);
}

/**
 * @description Applies a tag to a task, throwing a SQLite UNIQUE error if it is already applied.
 *
 * @param {number|string} taskId - ID of the task.
 * @param {number} tagId - ID of the tag.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function insertTaskTag(taskId, tagId) {
  return db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)').run(taskId, tagId);
}

/**
 * @description Removes a tag from a task.
 *
 * @param {number|string} taskId - ID of the task.
 * @param {number|string} tagId - ID of the tag.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The run result; changes is 0 if the tag was not applied.
 */
function deleteTaskTag(taskId, tagId) {
  return db.prepare('DELETE FROM task_tags WHERE task_id = ? AND tag_id = ?').run(taskId, tagId);
}

module.exports = {
  findAllTags,
  findTagById,
  insertTag,
  findTagsByTaskId,
  insertTaskTag,
  deleteTaskTag
};
