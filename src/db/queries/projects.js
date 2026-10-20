const { db } = require('..');

/**
 * @description Fetches all projects, newest first.
 *
 * @returns {Object[]} Project rows.
 */
function findAllProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

/**
 * @description Fetches a single project by ID.
 *
 * @param {number|string|bigint} id - ID of the project.
 * @returns {Object|undefined} The project row, or undefined if none matches.
 */
function findProjectById(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

/**
 * @description Inserts a project.
 *
 * @param {Object} project - Column values for the new project.
 * @param {string} project.name - Project name.
 * @param {string|null} project.description - Optional description.
 * @param {number|string|null} project.ownerId - Optional owning user ID.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function insertProject({ name, description, ownerId }) {
  return db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description, ownerId);
}

/**
 * @description Overwrites a project's name, description and owner.
 *
 * @param {number|string} id - ID of the project to update.
 * @param {Object} project - New column values.
 * @param {string} project.name - Project name.
 * @param {string|null} project.description - Description.
 * @param {number|string|null} project.ownerId - Owning user ID.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function updateProject(id, { name, description, ownerId }) {
  return db.prepare(
    'UPDATE projects SET name = ?, description = ?, owner_id = ? WHERE id = ?'
  ).run(name, description, ownerId, id);
}

/**
 * @description Deletes a project by ID.
 *
 * @param {number|string} id - ID of the project to delete.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The run result; changes is 0 if no project matched.
 */
function deleteProject(id) {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

module.exports = { findAllProjects, findProjectById, insertProject, updateProject, deleteProject };
