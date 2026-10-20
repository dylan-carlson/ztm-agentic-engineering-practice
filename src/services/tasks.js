const taskQueries = require('../db/queries/tasks');
const projectQueries = require('../db/queries/projects');
const userQueries = require('../db/queries/users');
const tagQueries = require('../db/queries/tags');
const commentQueries = require('../db/queries/comments');
const { VALID_TASK_STATUSES } = require('../constants');
const { httpError } = require('../utils/http-error');
const { isNonEmptyString } = require('../utils/validation');
const { paginate } = require('../utils/pagination');

function assertValidStatus(status) {
  if (status && !VALID_TASK_STATUSES.includes(status)) {
    throw httpError(400, `status must be one of: ${VALID_TASK_STATUSES.join(', ')}`);
  }
}

/**
 * @description Lists a page of tasks filtered by status, project and assignee, throwing 400 for an invalid status.
 *
 * @param {Object} query - Request query string.
 * @param {string} [query.status] - Only tasks with this status.
 * @param {string} [query.project_id] - Only tasks in this project.
 * @param {string} [query.assignee_id] - Only tasks assigned to this user.
 * @param {string} [query.page] - 1-based page number.
 * @param {string} [query.page_size] - Rows per page.
 * @returns {Object[]} Task rows.
 */
function listTasks({ status, project_id, assignee_id, page, page_size }) {
  assertValidStatus(status);
  const { limit, offset } = paginate(page, page_size);
  return taskQueries.findTasks({
    status: status || undefined,
    projectId: project_id ? parseInt(project_id) : undefined,
    assigneeId: assignee_id ? parseInt(assignee_id) : undefined,
    limit,
    offset
  });
}

/**
 * @description Fetches a task or throws 404, and is shared with the comments and tags services for their existence checks.
 *
 * @param {number|string} id - ID of the task.
 * @returns {Object} The task row.
 */
function getExistingTask(id) {
  const task = taskQueries.findTaskById(id);
  if (!task) throw httpError(404, 'Task not found');
  return task;
}

/**
 * @description Fetches a task with its tags and comments attached, throwing 404 if it does not exist.
 *
 * @param {number|string} id - ID of the task.
 * @returns {Object} The task row plus tags and comments arrays.
 */
function getTaskById(id) {
  const task = getExistingTask(id);
  task.tags = tagQueries.findTagsByTaskId(id);
  task.comments = commentQueries.findCommentsByTaskId(id);
  return task;
}

/**
 * @description Validates and creates a task, throwing 400 for a missing title or an unknown project or assignee.
 *
 * @param {Object} data - Request body.
 * @param {string} data.title - Task title.
 * @param {string} [data.description] - Optional description.
 * @param {number|string} [data.project_id] - Optional project ID.
 * @param {number|string} [data.assignee_id] - Optional assignee user ID.
 * @param {string} [data.due_date] - Optional due date.
 * @returns {Object} The created task row.
 */
function createTask({ title, description, project_id, assignee_id, due_date }) {
  if (!isNonEmptyString(title)) throw httpError(400, 'title is required');
  if (project_id && !projectQueries.findProjectById(parseInt(project_id))) {
    throw httpError(400, 'project not found');
  }
  if (assignee_id && !userQueries.findUserById(parseInt(assignee_id))) {
    throw httpError(400, 'assignee not found');
  }
  const result = taskQueries.insertTask({
    title,
    description: description || null,
    projectId: project_id ? parseInt(project_id) : null,
    assigneeId: assignee_id ? parseInt(assignee_id) : null,
    dueDate: due_date || null
  });
  return taskQueries.findTaskById(result.lastInsertRowid);
}

// Sets completed_at when a task becomes completed, keeps it while it stays
// completed, and clears it when the task leaves completed.
function resolveCompletedAt(existing, newStatus) {
  if (newStatus !== 'completed') return null;
  if (existing.status !== 'completed') return new Date().toISOString();
  return existing.completed_at;
}

/**
 * @description Updates the fields present in data, keeps the rest and resolves completed_at from the status change, throwing 404 or 400 as needed.
 *
 * @param {number|string} id - ID of the task.
 * @param {Object} data - Request body with any of title, description, status, project_id, assignee_id and due_date.
 * @returns {Object} The updated task row.
 */
function updateTask(id, data) {
  const existing = getExistingTask(id);
  assertValidStatus(data.status);

  const pick = (field) => (data[field] !== undefined ? data[field] : existing[field]);
  const status = pick('status');

  taskQueries.updateTask(id, {
    title: pick('title'),
    description: pick('description'),
    status,
    projectId: pick('project_id'),
    assigneeId: pick('assignee_id'),
    dueDate: pick('due_date'),
    completedAt: resolveCompletedAt(existing, status)
  });
  return taskQueries.findTaskById(id);
}

/**
 * @description Deletes a task, throwing 404 if it does not exist.
 *
 * @param {number|string} id - ID of the task.
 * @returns {{ deleted: true }}
 */
function deleteTask(id) {
  const result = taskQueries.deleteTask(id);
  if (result.changes === 0) throw httpError(404, 'Task not found');
  return { deleted: true };
}

module.exports = { listTasks, getExistingTask, getTaskById, createTask, updateTask, deleteTask };
