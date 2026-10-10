# Testing Standards

How to write tests for the Taskr API.

## File naming

- Name each test file `<resource>.test.js`, all lowercase, using the plural resource name: `tests/tasks.test.js`, `tests/projects.test.js`, `tests/comments.test.js`.
- Put one file per resource in `tests/`.
- Don't follow the legacy names `userTest.js` or `test-projects.js`. They are a known problem and will be renamed.
- Files named this way match the `tests/*.test.js` pattern in `package.json`'s `testMatch`, so Jest picks them up automatically. No config change is needed.

## Tools and database

- Use **Jest** as the test runner and **supertest** to make HTTP requests against the exported Express `app`.
- Don't call `app.listen`, and don't use a real port.
- Tests run against an **in-memory SQLite database**. `DB.js` switches to `:memory:` when `NODE_ENV === 'test'`, so set `NODE_ENV` before requiring the app or the DB:

```js
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index'); // ../src/index after the refactor
const { db } = require('../DB');
const { createSchema } = require('./schema');

beforeAll(() => {
  createSchema(db);
});

beforeEach(() => {
  db.exec('DELETE FROM task_tags; DELETE FROM comments; DELETE FROM tasks; DELETE FROM projects; DELETE FROM users; DELETE FROM tags;');
  // insert only the fixture rows this file needs
});
```

- Every test must be independent. Reset the tables in `beforeEach`, and never rely on order or on data left behind by another test.
- Create the data each test needs inside the test, or in that file's `beforeEach`. Don't use `db/seed.js` or the on-disk `taskr.db`.
- For routes protected by `authenticate`, send `.set('x-api-key', 'dev-key')`.

## Coverage per endpoint

Every endpoint gets:

1. **The happy path.** A valid request returns the expected status code, and the expected body shape and values.
2. **At least two error cases**, chosen from whichever apply:
   - missing or invalid required fields → `400`
   - an invalid enum value, such as an unknown task `status` → `400`
   - a resource that doesn't exist → `404`
   - a reference to another resource that doesn't exist, such as `project_id` or `assignee_id` → `400`
   - a duplicate unique value, such as a user email or tag name → `409`
   - a missing or wrong `x-api-key` on a protected route → `401`

For error cases, assert both the status code and that `res.body.error` is defined. For writes (`POST`, `PUT`, `DELETE`), also confirm the change took effect, for example with a follow-up `GET`.

Group the tests for one endpoint in a `describe` block named after the method and path:

```js
describe('POST /tasks', () => {
  test('creates a task and returns it with a default status of active', ...);
  test('rejects a task with no title', ...);
  test('rejects a task assigned to a project that does not exist', ...);
});
```

## Test descriptions

Write test names in plain English that describe **what the endpoint does from the client's point of view**, not how it is implemented.

| Good | Bad |
|---|---|
| `marks a task as completed and records when it was completed` | `sets completed_at via UPDATE query` |
| `rejects a user whose email is already taken` | `catches UNIQUE constraint error and returns 409` |
| `returns only active tasks when filtered by status` | `adds WHERE status = ? to the SQL` |

## Running the suite

- The whole suite must run with plain `npm test` after `npm install`. There must be no seeding, env files, running server, or other manual setup.
- To run a single file, use `npx jest tests/<resource>.test.js`. To run a single test, add `-t "<description>"`.
- Don't commit tests that are skipped (`.skip`) or focused (`.only`).
