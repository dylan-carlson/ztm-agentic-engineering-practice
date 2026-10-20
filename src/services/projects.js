const projectQueries = require('../db/queries/projects');
const taskQueries = require('../db/queries/tasks');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');

function getExistingProject(id) {
  const project = projectQueries.findProjectById(id);
  if (!project) throw httpError(404, 'Project not found');
  return project;
}

function getProjectStats(projectId) {
  const stats = { total: 0, active: 0, completed: 0, archived: 0 };
  for (const row of taskQueries.countTasksByStatusForProject(projectId)) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}

/**
 * @description Lists all projects, newest first.
 *
 * @returns {Object[]} Project rows.
 */
function listProjects() {
  return projectQueries.findAllProjects();
}

/**
 * @description Fetches a project with task counts by status attached as stats, throwing 404 if it does not exist.
 *
 * @param {number|string} id - ID of the project.
 * @returns {Object} The project row plus stats: { total, active, completed, archived }.
 */
function getProjectById(id) {
  const project = getExistingProject(id);
  return { ...project, stats: getProjectStats(id) };
}

/**
 * @description Validates and creates a project, throwing 400 if name is missing.
 *
 * @param {Object} data - Request body.
 * @param {string} data.name - Project name.
 * @param {string} [data.description] - Optional description.
 * @param {number|string} [data.owner_id] - Optional owning user ID.
 * @returns {Object} The created project row.
 */
function createProject({ name, description, owner_id }) {
  if (!isNonEmptyString(name)) throw httpError(400, 'name is required');
  const result = projectQueries.insertProject({
    name,
    description: description || null,
    ownerId: owner_id || null
  });
  return projectQueries.findProjectById(result.lastInsertRowid);
}

/**
 * @description Updates the fields present in data and keeps the rest, throwing 404 if the project does not exist.
 *
 * @param {number|string} id - ID of the project.
 * @param {Object} data - Request body with any of name, description and owner_id.
 * @returns {Object} The updated project row.
 */
function updateProject(id, data) {
  const existing = getExistingProject(id);
  projectQueries.updateProject(id, {
    name: data.name !== undefined ? data.name : existing.name,
    description: data.description !== undefined ? data.description : existing.description,
    ownerId: data.owner_id !== undefined ? data.owner_id : existing.owner_id
  });
  return projectQueries.findProjectById(id);
}

/**
 * @description Deletes a project, throwing 404 if it does not exist.
 *
 * @param {number|string} id - ID of the project.
 * @returns {{ deleted: true }}
 */
function deleteProject(id) {
  const result = projectQueries.deleteProject(id);
  if (result.changes === 0) throw httpError(404, 'Project not found');
  return { deleted: true };
}

module.exports = { listProjects, getProjectById, createProject, updateProject, deleteProject };
