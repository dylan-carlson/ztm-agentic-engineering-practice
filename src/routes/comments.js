const express = require('express');
const commentService = require('../services/comments');

// Mounted at /tasks/:id/comments, so :id comes from the parent path.
const taskCommentsRouter = express.Router({ mergeParams: true });

taskCommentsRouter.get('/', (req, res, next) => {
  try {
    res.json(commentService.listCommentsForTask(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

taskCommentsRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(commentService.createComment(parseInt(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

module.exports = { taskCommentsRouter };
