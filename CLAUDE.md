# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Taskr is a task-management REST API: Node.js, Express 5, SQLite via `better-sqlite3` (synchronous), and Jest + supertest. It's a deliberately messy starter codebase for agentic-engineering practice, so expect inconsistent naming, misplaced helpers, and TODO comments pointing at intended refactors.

## Context files

Read the relevant file before starting these kinds of tasks:

- `.claude/context/api-conventions.md`: read for any task involving API routes or endpoints.
- `.claude/context/testing-standards.md`: read for any task involving tests or test coverage.

## Intentional structural problems

This codebase has known, intentional structural problems that a future refactor will fix. Understand the current state so you can work within it, but don't copy these patterns into new code or treat them as house style:

- **Monolithic `routes.js`:** every resource lives in one file.
- **No service or repository layer:** SQL is written inline in route handlers, and query helpers are scattered across `DB.js`, `get-tasks.js`, `projectHelpers.js` and `UserController.js`.
- **Inconsistent layering:** only users go through a controller.
- **Duplicated validation and pagination:** both are written inline per handler, even though shared helpers exist (`utils.js`, `misc/constants.js#paginate`).
- **Misplaced helpers:** `formatError` and `paginate` sit in `constants.js`, and query functions sit in `DB.js`.
- **The `routes.js` ↔ `projectHelpers.js` circular dependency.**
- **Mixed file naming:** `DB.js`, `UserController.js`, `get-tasks.js`, `projectHelpers.js`, plus three different test-file naming styles.
- **Side effects inside controllers:** the welcome email is sent from `UserController.createUser`.
- **Dead code:** `misc/oldRoutes.js` and `misc/temp.js`.
- **Hand-synced schema:** the schema is duplicated between `db/seed.js` and `tests/schema.js`.

When adding or changing code:
- Don't make these problems worse. Don't add new inline SQL to route handlers if a helper already exists or you can add one cleanly, don't add new circular requires, and don't add more dead code or misplaced helpers.
- Prefer existing shared helpers (`isNonEmptyString`, `validateEmail`) over re-implementing logic inline.
- Keep changes scoped to the task. Don't start the large refactor (splitting `routes.js`, adding a repository layer, renaming files) unless asked, but point out where a change runs into one of these problems.
- If you change the schema, update both `db/seed.js` and `tests/schema.js`.

## Never do these things

- **Never add new route logic to `routes.js`.** It is already too large. Any new routes belong in a dedicated route file, mounted from `index.js`.
- **Never add new utility functions to `utils.js`** without first checking whether they belong in a more specific module.
- **Never import from files in the `misc/` directory.** That code is dead and scheduled for removal.
  - Known exception: `misc/constants.js` is still imported by `index.js` (`PORT`) and `routes.js` (`VALID_TASK_STATUSES`). Leave those existing imports alone.
  - If new code needs one of those values, move it out of `misc/` into a proper module instead of adding a new import from `misc/`.

## Commands

```bash
npm install
npm run db:seed          # create schema in taskr.db and insert sample data (no-op if users already exist)
npm run db:reset         # delete taskr.db and re-seed
npm run dev              # node --watch, port 3000 (GET /health to check)
npm start
npm test                 # all tests
npm run test:watch
npx jest tests/tasks.test.js                 # one file
npx jest tests/tasks.test.js -t "creates a task"   # one test by name
```

No linter or formatter is configured.

Env vars: `PORT` (default 3000), `DB_PATH` (default `taskr.db`), `API_KEY` (default `dev-key`), `NODE_ENV=test` (switches the DB to `:memory:`).

## Architecture

- `index.js` builds the Express app, mounts a couple of routes inline (`/`, `/webhooks/task-update`), then mounts `routes.js` and the error handler. It exports `app` and only calls `listen` when run directly, which lets tests import it via supertest.
- `routes.js` is one router holding every resource (users, projects, tasks, comments, tags). Most handlers run SQL directly against `db` with inline validation and send their own error responses. There is no service or repository layer.
- **Users are the exception:** `/users` handlers delegate to `UserController.js`. Its functions throw `Error`s with a `.status` property, and the route maps that to the response. `createUser` also sends a stubbed welcome email (`sendEmail.js` only logs).
- Task listing/detail queries live in `get-tasks.js`. `getTaskById` attaches `tags` and `comments`. Project stats come from `projectHelpers.js`.
- **Circular dependency:** `routes.js` lazily `require`s `projectHelpers.js` inside a handler, and `projectHelpers.formatProjectSummary` lazily requires `routes.js` for `getTasksForProject`. Keep those requires lazy, or break the cycle, if you touch either file.
- `DB.js` opens the single shared `db` connection (WAL, `foreign_keys = ON`). It picks `:memory:` when `NODE_ENV === 'test'`, so `NODE_ENV` must be set before `DB.js` is first required.
- Auth (`auth.js`) is a placeholder `x-api-key` header check, applied only to `DELETE /users/:id` and `DELETE /projects/:id`.
- `misc/constants.js` holds `VALID_TASK_STATUSES` (`active`/`completed`/`archived`), page-size limits, and a `paginate` helper that `routes.js` doesn't use (it recomputes pagination inline). `misc/oldRoutes.js` and `misc/temp.js` are dead code and are not required anywhere.

## Database schema

There are no migrations. The schema is defined twice and the two copies must be kept in sync by hand:
- `db/seed.js`, for the real DB
- `tests/schema.js` (`createSchema`), for the in-memory test DB

`tasks.status` has a CHECK constraint matching `VALID_TASK_STATUSES`. `PUT /tasks/:id` sets `completed_at` when status changes to `completed` and clears it when status leaves `completed`.

## Tests

- Name test files `<resource>.test.js` (e.g. `tests/tasks.test.js`, `tests/comments.test.js`).
  - The current mix (`tasks.test.js`, `userTest.js`, `test-projects.js`) is a known problem that will be standardized. Don't copy the other two styles.
  - Jest only runs files on the explicit `testMatch` list in `package.json`. `tests/*.test.js` is on that list, so files named this way run automatically.
- Each test file sets `process.env.NODE_ENV = 'test'` before requiring `../index`, calls `createSchema(db)` in `beforeAll`, and wipes and reinserts fixture rows in `beforeEach`.
- Authenticated routes need `.set('x-api-key', 'dev-key')`.
