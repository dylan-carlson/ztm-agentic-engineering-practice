# API Conventions: Adding a New Endpoint

How to add a new endpoint to the Taskr API. These conventions describe the post-refactor `src/` layout. Follow them for all new routes, even while legacy code still lives in the root-level `routes.js`.

## 1. Create a dedicated route file in `src/routes/`

- Each resource gets its own file. Never add routes to the legacy `routes.js`.
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
    const comment = commentService.getCommentById(parseInt(req.params.id));
    if (!comment) {
      return next({ status: 404, message: 'Comment not found' });
    }
    res.json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = { commentsRouter };
```

## 2. Put business logic in `src/services/`

- Each route handler calls a corresponding function in `src/services/<resource>.js`. That service function owns the business logic and database access.
- Handlers stay thin: read input from `req`, call the service, then either send the response or call `next` with an error.
- Handlers must not contain SQL, business rules, or side effects such as sending email.

```js
// src/services/comments.js
const { db } = require('../db');

function getCommentById(id) {
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

module.exports = { getCommentById };
```

## 3. Pass errors to `next`

- Never send error responses directly with `res.status(...).json(...)`.
- Pass errors to Express's `next` as an object with a `status` code and a `message`:

  ```js
  return next({ status: 400, message: 'body is required' });
  ```

- When a service throws, catch the error and forward it with `next(err)`. A service that knows the right status should throw an error that carries `status` and `message`.
- The central error handler reads `err.status` and `err.message` and produces the `{ error: message }` response, falling back to 500.

## 4. Register the router in `src/index.js`

Mount every router in `src/index.js` with `app.use`, passing the resource path and the imported router:

```js
const { commentsRouter } = require('./routes/comments');

app.use('/comments', commentsRouter);
```

- Don't define routes inline in `src/index.js`.
- **Nested resources:** for paths like `/tasks/:id/comments`, create the router with `express.Router({ mergeParams: true })` and mount it at the full nested path, e.g. `app.use('/tasks/:id/comments', taskCommentsRouter)`.

## Checklist

1. `src/routes/<resources>.js` exports a named `<resources>Router`, and its paths are relative to the mount point.
2. Each handler calls a function in `src/services/<resources>.js` and contains no business logic.
3. Errors go through `next({ status, message })`, never `res.status().json()`.
4. The router is registered in `src/index.js` with `app.use('/<resources>', <resources>Router)`.
5. Tests are in `tests/<resources>.test.js`, using supertest against the exported `app`.
