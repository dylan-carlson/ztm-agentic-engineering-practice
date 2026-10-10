const express = require('express');
const projectService = require('../services/projects');
const { authenticate } = require('../middleware/authenticate');

const projectsRouter = express.Router();

projectsRouter.get('/', (req, res, next) => {
  try {
    res.json(projectService.listProjects());
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(projectService.createProject(req.body));
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id', (req, res, next) => {
  try {
    res.json(projectService.getProjectById(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

projectsRouter.put('/:id', (req, res, next) => {
  try {
    res.json(projectService.updateProject(parseInt(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

projectsRouter.delete('/:id', authenticate, (req, res, next) => {
  try {
    res.json(projectService.deleteProject(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

module.exports = { projectsRouter };
