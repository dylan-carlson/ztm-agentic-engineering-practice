# API Conventions: Adding a New Endpoint

How to add a new endpoint to the Taskr API. Requests flow `src/routes/` → `src/services/` → `src/db/queries/`, and each layer only calls the one below it.

## 1. Create a dedicated route file in `src/routes/`

- Each resource gets its own file.
- Name the file after the resource, in **lowercase plural**: `src/routes/tasks.js`, `src/routes/projects.js`, `src/routes/comments.js`.
- Export a **named** Express router, `<resource>Router`. Don't use a default export.
- Define paths **relative to the mount point** (`/`, `/:id`), not with the resource prefix.

```js
// src/routes/comments.js
const express = require('express');
const commentService = require('../services/comments');

const commentsRouter = express.Router();

commentsRouter.get('/:id', (req, res, next) => {
  try {
    res.json(commentService.getCommentById(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

module.exports = { commentsRouter };
```

## 2. Put business logic in `src/services/`

- Each route handler calls a corresponding function in `src/services/<resource>.js`. That service function owns validation, existence checks, business rules, and side effects (e.g. `services/notifications.js` for email).
- Handlers stay thin: read input from `req`, call the service, then either send the response or call `next` with an error.
- Handlers must not contain SQL, business rules, or side effects such as sending email.
- Services never touch `db` directly. They call `src/db/queries/<resource>.js`.
- Services throw `httpError(status, message)` from `src/utils/http-error.js` for expected failures (404, 400, 409). Use `isNonEmptyString` / `validateEmail` from `src/utils/validation.js` and `paginate` from `src/utils/pagination.js` rather than reimplementing them.

```js
// src/services/comments.js
const commentQueries = require('../db/queries/comments');
const { httpError } = require('../utils/http-error');

function getCommentById(id) {
  const comment = commentQueries.findCommentById(id);
  if (!comment) throw httpError(404, 'Comment not found');
  return comment;
}

module.exports = { getCommentById };
```

## 3. Put SQL in `src/db/queries/`

- One function per SQL statement, named `find…`, `insert…`, `update…`, `delete…`. Return rows or the `run` result.
- No validation, no HTTP status codes, no calls to services.

```js
// src/db/queries/comments.js
const { db } = require('..');

function findCommentById(id) {
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

module.exports = { findCommentById };
```

## 4. Pass errors to `next`

- Never send error responses directly with `res.status(...).json(...)`.
- Pass errors to Express's `next` as an object with a `status` code and a `message`:

  ```js
  return next({ status: 400, message: 'body is required' });
  ```

- When a service throws, catch the error and forward it with `next(err)`. A service that knows the right status should throw an error that carries `status` and `message`.
- The central error handler reads `err.status` and `err.message` and produces the `{ error: message }` response, falling back to 500.

## 5. Register the router in `src/index.js`

Mount every router in `src/index.js` with `app.use`, passing the resource path and the imported router:

```js
const { commentsRouter } = require('./routes/comments');

app.use('/comments', commentsRouter);
```

- Don't define routes inline in `src/index.js`.
- **Nested resources:** for paths like `/tasks/:id/comments`, create the router with `express.Router({ mergeParams: true })` and mount it at the full nested path, e.g. `app.use('/tasks/:id/comments', taskCommentsRouter)`.

## Checklist

1. `src/routes/<resources>.js` exports a named `<resources>Router`, and its paths are relative to the mount point.
2. Each handler calls a function in `src/services/<resources>.js` and contains no business logic. Services call `src/db/queries/<resources>.js` and contain no SQL.
3. Errors go through `next({ status, message })`, never `res.status().json()`.
4. The router is registered in `src/index.js` with `app.use('/<resources>', <resources>Router)`.
5. Tests are in `tests/<resources>.test.js`, using supertest against the exported `app`.
