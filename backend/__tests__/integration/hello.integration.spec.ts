import express from 'express';
import request from 'supertest';

const app = express();
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

describe('Integration: /api/health', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
}); 