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

function listProjects() {
  return projectQueries.findAllProjects();
}

function getProjectById(id) {
  const project = getExistingProject(id);
  return { ...project, stats: getProjectStats(id) };
}

function createProject({ name, description, owner_id }) {
  if (!isNonEmptyString(name)) throw httpError(400, 'name is required');
  const result = projectQueries.insertProject({
    name,
    description: description || null,
    ownerId: owner_id || null
  });
  return projectQueries.findProjectById(result.lastInsertRowid);
}

function updateProject(id, data) {
  const existing = getExistingProject(id);
  projectQueries.updateProject(id, {
    name: data.name !== undefined ? data.name : existing.name,
    description: data.description !== undefined ? data.description : existing.description,
    ownerId: data.owner_id !== undefined ? data.owner_id : existing.owner_id
  });
  return projectQueries.findProjectById(id);
}

function deleteProject(id) {
  const result = projectQueries.deleteProject(id);
  if (result.changes === 0) throw httpError(404, 'Project not found');
  return { deleted: true };
}

module.exports = { listProjects, getProjectById, createProject, updateProject, deleteProject };
