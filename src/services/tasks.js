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

// Throws 404 if the task doesn't exist. Shared with the comments and tags services.
function getExistingTask(id) {
  const task = taskQueries.findTaskById(id);
  if (!task) throw httpError(404, 'Task not found');
  return task;
}

function getTaskById(id) {
  const task = getExistingTask(id);
  task.tags = tagQueries.findTagsByTaskId(id);
  task.comments = commentQueries.findCommentsByTaskId(id);
  return task;
}

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

function deleteTask(id) {
  const result = taskQueries.deleteTask(id);
  if (result.changes === 0) throw httpError(404, 'Task not found');
  return { deleted: true };
}

module.exports = { listTasks, getExistingTask, getTaskById, createTask, updateTask, deleteTask };
