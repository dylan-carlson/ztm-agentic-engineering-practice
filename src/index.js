const express = require('express');
const { PORT } = require('./config');
const { requestLogger } = require('./middleware/request-logger');
const { errorHandler } = require('./middleware/error-handler');
const { rootRouter } = require('./routes/root');
const { healthRouter } = require('./routes/health');
const { webhooksRouter } = require('./routes/webhooks');
const { usersRouter } = require('./routes/users');
const { projectsRouter } = require('./routes/projects');
const { tasksRouter } = require('./routes/tasks');
const { taskCommentsRouter } = require('./routes/comments');
const { tagsRouter, taskTagsRouter } = require('./routes/tags');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use('/', rootRouter);
app.use('/health', healthRouter);
app.use('/webhooks', webhooksRouter);
app.use('/users', usersRouter);
app.use('/projects', projectsRouter);
app.use('/tasks/:id/comments', taskCommentsRouter);
app.use('/tasks/:id/tags', taskTagsRouter);
app.use('/tasks', tasksRouter);
app.use('/tags', tagsRouter);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Taskr API running on port ${PORT}`);
  });
}

module.exports = app;
