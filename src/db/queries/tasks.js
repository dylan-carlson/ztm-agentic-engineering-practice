const { db } = require('..');

/**
 * @description Fetches a page of tasks, newest first, filtered by any of status, project and assignee.
 *
 * @param {Object} filters - Filter and paging options.
 * @param {string} [filters.status] - Only tasks with this status.
 * @param {number} [filters.projectId] - Only tasks in this project.
 * @param {number} [filters.assigneeId] - Only tasks assigned to this user.
 * @param {number} filters.limit - Maximum number of rows to return.
 * @param {number} filters.offset - Number of rows to skip.
 * @returns {Object[]} Task rows.
 */
function findTasks({ status, projectId, assigneeId, limit, offset }) {
  let query = 'SELECT * FROM tasks';
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (projectId) {
    conditions.push('project_id = ?');
    params.push(projectId);
  }
  if (assigneeId) {
    conditions.push('assignee_id = ?');
    params.push(assigneeId);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(params);
}

/**
 * @description Fetches a single task by ID.
 *
 * @param {number|string|bigint} id - ID of the task.
 * @returns {Object|undefined} The task row, or undefined if none matches.
 */
function findTaskById(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/**
 * @description Inserts a task with the default status.
 *
 * @param {Object} task - Column values for the new task.
 * @param {string} task.title - Task title.
 * @param {string|null} task.description - Optional description.
 * @param {number|null} task.projectId - Optional project ID.
 * @param {number|null} task.assigneeId - Optional assignee user ID.
 * @param {string|null} task.dueDate - Optional due date.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function insertTask({ title, description, projectId, assigneeId, dueDate }) {
  return db.prepare(
    'INSERT INTO tasks (title, description, project_id, assignee_id, due_date) VALUES (?, ?, ?, ?, ?)'
  ).run(title, description, projectId, assigneeId, dueDate);
}

/**
 * @description Overwrites every editable column of a task.
 *
 * @param {number|string} id - ID of the task to update.
 * @param {Object} task - New column values.
 * @param {string} task.title - Task title.
 * @param {string|null} task.description - Description.
 * @param {string} task.status - One of VALID_TASK_STATUSES.
 * @param {number|string|null} task.projectId - Project ID.
 * @param {number|string|null} task.assigneeId - Assignee user ID.
 * @param {string|null} task.dueDate - Due date.
 * @param {string|null} task.completedAt - Completion timestamp, or null.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The better-sqlite3 run result.
 */
function updateTask(id, { title, description, status, projectId, assigneeId, dueDate, completedAt }) {
  return db.prepare(
    'UPDATE tasks SET title=?, description=?, status=?, project_id=?, assignee_id=?, due_date=?, completed_at=? WHERE id=?'
  ).run(title, description, status, projectId, assigneeId, dueDate, completedAt, id);
}

/**
 * @description Deletes a task by ID.
 *
 * @param {number|string} id - ID of the task to delete.
 * @returns {{ changes: number, lastInsertRowid: number|bigint }} The run result; changes is 0 if no task matched.
 */
function deleteTask(id) {
  return db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

/**
 * @description Counts a project's tasks grouped by status.
 *
 * @param {number|string} projectId - ID of the project.
 * @returns {{ status: string, count: number }[]} One row per status that has at least one task.
 */
function countTasksByStatusForProject(projectId) {
  return db.prepare(
    'SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status'
  ).all(projectId);
}

module.exports = {
  findTasks,
  findTaskById,
  insertTask,
  updateTask,
  deleteTask,
  countTasksByStatusForProject
};
