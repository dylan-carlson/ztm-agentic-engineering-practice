const { db } = require('..');

function findProjectById(id) {
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

module.exports = { findProjectById };
