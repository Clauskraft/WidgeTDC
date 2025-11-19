import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { closeDatabase } from '../src/database/index.js';

const app = createApp();

describe('SC Command API', () => {
  afterAll(() => {
    closeDatabase();
  });

  it('integration: analyzes uploaded code and reports findings', async () => {
    const codeSample = `
      const query = "SELECT * FROM users WHERE id = " + userId;
      console.log("debug info");
      document.body.innerHTML = userInput;
      const value: any = {};
    `;

    const res = await request(app)
      .post('/api/commands/sc/analyze')
      .attach('file', Buffer.from(codeSample), 'sample.ts');

    expect(res.status).toBe(200);
    expect(res.body.summary.totalFiles).toBe(1);
    expect(res.body.findings.length).toBeGreaterThanOrEqual(1);
    expect(res.body.findings.map((finding: any) => finding.category)).toContain('Security - SQL Injection');
  });

  it('integration: returns persona feedback for specification panel', async () => {
    const specDoc = `
      # Platform Spec
      - Requires OAuth authentication
      - Database failover must be described
    `;

    const res = await request(app)
      .post('/api/commands/sc/spec-panel')
      .field('personas', JSON.stringify(['architecture', 'security']))
      .attach('file', Buffer.from(specDoc), 'spec.md');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.personas)).toBe(true);
    expect(res.body.personas).toHaveLength(2);
    expect(typeof res.body.summary).toBe('string');
  });

  it('smoke: health endpoint responds with ok status', async () => {
    const res = await request(app).get('/api/commands/sc/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.endpoints).toContain('/spec-panel');
  });
});
