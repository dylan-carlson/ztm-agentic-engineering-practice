const express = require('express');
const userService = require('../services/users');
const { authenticate } = require('../middleware/authenticate');

const usersRouter = express.Router();

usersRouter.get('/', (req, res, next) => {
  try {
    res.json(userService.listUsers());
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/', async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

usersRouter.get('/:id', (req, res, next) => {
  try {
    res.json(userService.getUserById(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

usersRouter.put('/:id', (req, res, next) => {
  try {
    res.json(userService.updateUser(parseInt(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

usersRouter.delete('/:id', authenticate, (req, res, next) => {
  try {
    res.json(userService.deleteUser(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

module.exports = { usersRouter };
