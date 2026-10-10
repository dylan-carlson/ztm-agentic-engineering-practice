const { db } = require('..');

function findAllProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
}

function findProjectById(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

function insertProject({ name, description, ownerId }) {
  return db.prepare(
    'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)'
  ).run(name, description, ownerId);
}

function updateProject(id, { name, description, ownerId }) {
  return db.prepare(
    'UPDATE projects SET name = ?, description = ?, owner_id = ? WHERE id = ?'
  ).run(name, description, ownerId, id);
}

function deleteProject(id) {
  return db.prepare('DELETE FROM projects WHERE id = ?').run(id);
}

module.exports = { findAllProjects, findProjectById, insertProject, updateProject, deleteProject };
