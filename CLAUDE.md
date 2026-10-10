# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Taskr is a task-management REST API: Node.js, Express 5, SQLite via `better-sqlite3` (synchronous), and Jest + supertest. It started as a deliberately messy codebase for agentic-engineering practice and has been refactored into a layered `src/` architecture.

## Context files

Read the relevant file before starting these kinds of tasks:

- `.claude/context/api-conventions.md`: read for any task involving API routes or endpoints.
- `.claude/context/testing-standards.md`: read for any task involving tests or test coverage.

## Rules

- **Keep the layering:** routes call services, services call queries. Routes contain no SQL or business rules; services contain no SQL; queries contain no validation or HTTP status codes.
- **One file per resource per layer**, named in lowercase plural kebab-case (`src/routes/tasks.js`, `src/services/tasks.js`, `src/db/queries/tasks.js`). New routes get their own router, mounted in `src/index.js`. Don't define routes inline in `src/index.js`.
- **Errors:** services throw `httpError(status, message)` (`src/utils/http-error.js`); route handlers forward with `next(err)`. Never send error responses with `res.status().json()` from a handler.
- **Reuse shared helpers** instead of reimplementing them: `isNonEmptyString` and `validateEmail` (`src/utils/validation.js`), `paginate` (`src/utils/pagination.js`), `VALID_TASK_STATUSES` (`src/constants.js`), env config (`src/config.js`).
- **Don't add to `src/utils/`** without first checking whether the function belongs in a more specific module (a service, a query file, or middleware).
- **Side effects such as email** go through `src/services/notifications.js`, called from a service, never from a route or query.
- **Schema changes** go in `src/db/schema.js` only. It is the single source used by both the seed script and the test suite.

## Commands

```bash
npm install
npm run db:seed          # create schema in taskr.db and insert sample data (no-op if users already exist)
npm run db:reset         # delete taskr.db and re-seed
npm run dev              # node --watch src/index.js, port 3000 (GET /health to check)
npm start
npm test                 # all tests
npm run test:watch
npx jest tests/tasks.test.js                 # one file
npx jest tests/tasks.test.js -t "creates a task"   # one test by name
```

No linter or formatter is configured.

Env vars (read in `src/config.js`): `PORT` (default 3000), `DB_PATH` (default `taskr.db`), `API_KEY` (default `dev-key`). `NODE_ENV=test` switches the DB to `:memory:`.

## Architecture

```
src/
  index.js          builds the app, mounts routers + error handler; exports app, listens only when run directly
  config.js         env-derived settings
  constants.js      VALID_TASK_STATUSES (must match the CHECK constraint in schema.js)
  routes/           thin Express routers: users, projects, tasks, comments, tags, health, root, webhooks
  services/         business logic per resource, plus email.js (stub) and notifications.js
  db/
    index.js        the single shared better-sqlite3 connection (WAL, foreign_keys = ON)
    schema.js       createSchema(db)
    seed.js         sample data for local dev
    queries/        one function per SQL statement, per resource
  middleware/       authenticate, request-logger, error-handler
  utils/            validation, pagination, http-error
```

- **Request flow:** `routes/<resource>.js` → `services/<resource>.js` → `db/queries/<resource>.js`. Services may call other services (e.g. comments and tags use `tasks.getExistingTask` for the 404 check).
- **Nested routers:** `/tasks/:id/comments` and `/tasks/:id/tags` use `express.Router({ mergeParams: true })` and are mounted before `/tasks` in `src/index.js`.
- **Error handling:** `middleware/error-handler.js` turns `err.status`/`err.message` into `{ error }`, defaulting to 500. It logs stack traces only for 5xx.
- `db/index.js` picks `:memory:` when `NODE_ENV === 'test'`, so `NODE_ENV` must be set before it is first required.
- `GET /tasks/:id` attaches `tags` and `comments`. `GET /projects/:id` attaches `stats` (task counts by status).
- `PUT /tasks/:id` sets `completed_at` when status changes to `completed`, keeps it while it stays `completed`, and clears it when status leaves `completed` (`services/tasks.js#resolveCompletedAt`).

## Known gaps

These are still placeholders or quirks. Don't treat them as patterns to copy:

- **Auth** (`middleware/authenticate.js`) is a placeholder `x-api-key` check, applied only to `DELETE /users/:id` and `DELETE /projects/:id`.
- **Email** (`services/email.js`) only logs. The welcome email is sent from `services/users.createUser` via `services/notifications.js`.
- **Webhook** `POST /webhooks/task-update` only logs its payload.
- **`PUT /users/:id` with a duplicate email** returns 500 with the raw SQLite UNIQUE message, unlike `POST /users`, which returns 409.
- **There are no migrations.** `createSchema` uses `CREATE TABLE IF NOT EXISTS`, so schema changes to an existing `taskr.db` need `npm run db:reset`.
- **`tests/users.test.js` and `tests/projects.test.js`** still group tests under a single `describe` instead of one per endpoint, as testing-standards.md asks.

## Database schema

The schema is defined once, in `src/db/schema.js`. `tasks.status` has a CHECK constraint matching `VALID_TASK_STATUSES`.

## Tests

- Name test files `tests/<resource>.test.js`. Jest's `testMatch` is `**/tests/*.test.js`.
- Each test file sets `process.env.NODE_ENV = 'test'` before requiring `../src/index`, calls `createSchema(db)` from `../src/db/schema` in `beforeAll`, and wipes and reinserts fixture rows in `beforeEach`.
- Authenticated routes need `.set('x-api-key', 'dev-key')`.
