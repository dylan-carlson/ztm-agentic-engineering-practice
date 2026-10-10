const express = require('express');
const tagService = require('../services/tags');

const tagsRouter = express.Router();

tagsRouter.get('/', (req, res, next) => {
  try {
    res.json(tagService.listTags());
  } catch (err) {
    next(err);
  }
});

tagsRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(tagService.createTag(req.body));
  } catch (err) {
    next(err);
  }
});

// Mounted at /tasks/:id/tags, so :id comes from the parent path.
const taskTagsRouter = express.Router({ mergeParams: true });

taskTagsRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(tagService.addTagToTask(parseInt(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

taskTagsRouter.delete('/:tagId', (req, res, next) => {
  try {
    res.json(tagService.removeTagFromTask(parseInt(req.params.id), parseInt(req.params.tagId)));
  } catch (err) {
    next(err);
  }
});

module.exports = { tagsRouter, taskTagsRouter };
