import { Router } from 'express';
import { z } from 'zod';
import {
  getFeedOverview,
  executeSecuritySearch,
  securityTemplates,
  securityHistory,
  securityActivity,
} from './securityService.js';
import { registerActivityStream } from './activityStream.js';
import { setActivityAcknowledged } from './securityRepository.js';
import {
  getWidgetPermissions,
  checkWidgetAccess,
  setWidgetPermission,
  setPlatformDefault
} from './securityRepository.js';

export const securityRouter = Router();

securityRouter.get('/feeds', async (_req, res) => {
  const overview = await getFeedOverview();
  res.json(overview);
});

securityRouter.get('/search/templates', (_req, res) => {
  res.json({ templates: securityTemplates.list() });
});

securityRouter.get('/search/history', (req, res) => {
  const limit = Number(req.query.limit ?? 6);
  res.json({ history: securityHistory.list(limit) });
});

const searchSchema = z.object({
  query: z.string().optional().default(''),
  severity: z.string().optional().default('all'),
  timeframe: z.string().optional().default('24h'),
  sources: z.array(z.string()).optional().default([]),
});

securityRouter.post('/search/query', async (req, res) => {
  const parsed = searchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const payload = await executeSecuritySearch(parsed.data);
  res.json(payload);
});

securityRouter.get('/activity', (req, res) => {
  const severity = typeof req.query.severity === 'string' ? req.query.severity : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  res.json({
    events: securityActivity.list(severity, category, limit),
  });
});

securityRouter.post('/activity/:id/ack', (req, res) => {
  const acknowledged = typeof req.body?.acknowledged === 'boolean' ? req.body.acknowledged : true;
  const updated = setActivityAcknowledged(req.params.id, acknowledged);
  if (!updated) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(updated);
});

securityRouter.get('/activity/stream', (req, res) => {
  registerActivityStream(res, {
    severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
  });
});

const registryEventSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  category: z.union([z.literal('ingestion'), z.literal('alert'), z.literal('automation'), z.literal('audit')]),
  severity: z.union([z.literal('low'), z.literal('medium'), z.literal('high'), z.literal('critical')]),
  source: z.string(),
  rule: z.string().optional(),
  channel: z.union([z.literal('SSE'), z.literal('Webhook'), z.literal('Job')]).optional(),
  payload: z.record(z.any()).optional(),
  createdAt: z.string().optional(),
  acknowledged: z.boolean().optional(),
});

securityRouter.post('/activity/registry', (req, res) => {
  const parsed = registryEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid registry event', details: parsed.error.flatten() });
  }
  const event = securityActivity.publish({
    id: parsed.data.id ?? `evt-${Date.now()}`,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    severity: parsed.data.severity,
    source: parsed.data.source,
    rule: parsed.data.rule,
    channel: parsed.data.channel ?? 'SSE',
    payload: parsed.data.payload,
    createdAt: parsed.data.createdAt ?? new Date().toISOString(),
    acknowledged: parsed.data.acknowledged ?? false,
  });
  res.status(201).json(event);
});

// Get permissions for a widget
securityRouter.get('/permissions/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const permissions = await getWidgetPermissions(widgetId);
    res.json(permissions);
  } catch (_error) {
    res.status(500).json({ error: 'Could not fetch permissions' });
  }
});

// Set widget permission (override)
securityRouter.put('/permissions/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const { resourceType, accessLevel, override = true } = req.body;
    await setWidgetPermission(widgetId, resourceType, accessLevel, override);
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: 'Could not set permission' });
  }
});

// Check access
securityRouter.post('/check-access', async (req, res) => {
  try {
    const { widgetId, resourceType, requiredLevel } = req.body;
    const hasAccess = await checkWidgetAccess(widgetId, resourceType, requiredLevel);
    res.json({ hasAccess });
  } catch (_error) {
    res.status(500).json({ error: 'Could not check access' });
  }
});

// Set platform default
securityRouter.post('/platform-defaults', async (req, res) => {
  try {
    const { resourceType, accessLevel } = req.body;
    await setPlatformDefault(resourceType, accessLevel);
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: 'Could not set platform default' });
  }
});

