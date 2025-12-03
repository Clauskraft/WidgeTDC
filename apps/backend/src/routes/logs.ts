import { Router } from 'express';
import { logStream, LogLevel } from '../services/logging/logStream.js';

const router = Router();

router.get('/', (req, res) => {
  const limitParam = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined;
  const levelParam = typeof req.query.level === 'string' ? (req.query.level.toLowerCase() as LogLevel) : undefined;
  const source = typeof req.query.source === 'string' ? req.query.source : undefined;

  const allowedLevels: LogLevel[] = ['info', 'warn', 'error', 'debug'];
  const level = levelParam && allowedLevels.includes(levelParam) ? levelParam : undefined;
  const limit = Number.isFinite(limitParam) ? (limitParam as number) : 100;

  const entries = logStream.getRecent({ limit, level, source });
  res.json({ entries, count: entries.length });
});

router.get('/sources', (_req, res) => {
  res.json({ sources: logStream.getSources() });
});

export default router;
