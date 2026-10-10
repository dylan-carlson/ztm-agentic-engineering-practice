process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');

describe('GET /health', () => {
  test('reports that the API is up, with a timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});

describe('GET /', () => {
  test('describes the API', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Taskr API', version: '1.0.0', docs: '/health' });
  });
});

describe('POST /webhooks/task-update', () => {
  test('acknowledges the webhook payload', async () => {
    const res = await request(app).post('/webhooks/task-update').send({ task_id: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});

describe('unknown routes', () => {
  test('returns 404 for a path that does not exist', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
});
