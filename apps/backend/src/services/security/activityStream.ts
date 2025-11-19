import EventEmitter from 'eventemitter3';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { getSecurityIntegrationConfig } from '../../config/securityConfig.js';
import {
  persistActivityEvent,
  listActivityEvents,
} from './securityRepository.js';
import type { EventCategory, SecurityActivityEvent, ThreatLevel } from './securityTypes.js';

type ActivityEvents = {
  event: [SecurityActivityEvent];
};

const emitter = new EventEmitter<ActivityEvents>();
const clients = new Map<string, Response>();
const heartbeatInterval = getSecurityIntegrationConfig().registry.streamHeartbeatMs;

setInterval(() => {
  for (const res of clients.values()) {
    res.write(`event: security-heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }
}, heartbeatInterval);

interface SseOptions {
  severity?: string;
  category?: string;
}

export function registerActivityStream(res: Response, options: SseOptions = {}): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = randomUUID();
  clients.set(clientId, res);

  // Send initial payload
  const recent = listActivityEvents({
    severity: options.severity && options.severity !== 'all' ? options.severity : undefined,
    category: options.category && options.category !== 'all' ? options.category : undefined,
    limit: 25,
  });
  res.write(`event: security-bootstrap\ndata: ${JSON.stringify(recent)}\n\n`);

  const handler = (event: SecurityActivityEvent) => {
    const matchesSeverity = !options.severity || options.severity === 'all' || event.severity === options.severity;
    const matchesCategory = !options.category || options.category === 'all' || event.category === options.category;
    if (matchesSeverity && matchesCategory) {
      res.write(`event: security-activity\ndata: ${JSON.stringify(event)}\n\n`);
    }
  };

  emitter.on('event', handler);

  res.on('close', () => {
    emitter.off('event', handler);
    clients.delete(clientId);
  });
}

interface RegistryEventPayload {
  id?: string;
  title: string;
  description: string;
  category: EventCategory;
  severity: ThreatLevel;
  source: string;
  rule?: string;
  channel?: 'SSE' | 'Webhook' | 'Job';
  payload?: Record<string, unknown>;
  createdAt?: string;
  acknowledged?: boolean;
}

export function ingestRegistryEvent(payload: RegistryEventPayload): SecurityActivityEvent {
  const event: SecurityActivityEvent = {
    id: payload.id ?? `evt-${Date.now()}`,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    severity: payload.severity,
    source: payload.source,
    rule: payload.rule,
    channel: payload.channel ?? 'SSE',
    payload: payload.payload,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    acknowledged: payload.acknowledged ?? false,
  };

  persistActivityEvent(event);
  emitter.emit('event', event);
  return event;
}

