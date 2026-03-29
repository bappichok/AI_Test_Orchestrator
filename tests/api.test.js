import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import generateRouter from '../api/routes/generate.js';

// Setup Mock Express App
const app = express();
app.use(express.json());
app.use('/api/generate', generateRouter);

describe('Backend API Routes', () => {

  describe('POST /api/generate/test-cases', () => {
    it('should return 400 if story is missing', async () => {
      const res = await request(app)
        .post('/api/generate/test-cases')
        .send({ settings: { llmProvider: 'openai' } });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing story details');
    });

    it('should return 400 if no usable text is found in story', async () => {
      const res = await request(app)
        .post('/api/generate/test-cases')
        .send({ story: { id: 'TEST-1' } });
        
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Story does not contain description or acceptance criteria.');
    });
  });

  describe('POST /api/generate/analytics', () => {
    it('should return 400 if testCases array is missing', async () => {
      const res = await request(app)
        .post('/api/generate/analytics')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('testCases array required');
    });
  });

  describe('POST /api/generate/automation-code', () => {
    it('should return 400 if testCase or framework is missing', async () => {
      const res = await request(app)
        .post('/api/generate/automation-code')
        .send({ testCase: { id: 'TC-01' } }); // missing framework
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('testCase and framework are required');
    });
  });
});
