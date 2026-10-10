const express = require('express');
const taskService = require('../services/tasks');

const tasksRouter = express.Router();

tasksRouter.get('/', (req, res, next) => {
  try {
    res.json(taskService.listTasks(req.query));
  } catch (err) {
    next(err);
  }
});

tasksRouter.post('/', (req, res, next) => {
  try {
    res.status(201).json(taskService.createTask(req.body));
  } catch (err) {
    next(err);
  }
});

tasksRouter.get('/:id', (req, res, next) => {
  try {
    res.json(taskService.getTaskById(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

tasksRouter.put('/:id', (req, res, next) => {
  try {
    res.json(taskService.updateTask(parseInt(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete('/:id', (req, res, next) => {
  try {
    res.json(taskService.deleteTask(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

module.exports = { tasksRouter };
