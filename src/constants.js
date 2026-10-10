// Must match the CHECK constraint on tasks.status in src/db/schema.js
const VALID_TASK_STATUSES = ['active', 'completed', 'archived'];

module.exports = { VALID_TASK_STATUSES };
