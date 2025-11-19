// MCP API Gateway - Integrated from template
import express, { type Request, type RequestHandler, type Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { mcpRouter } from '../mcpRouter.js';

const app = express();
const server = app.listen(3001);
const wss = new WebSocketServer({ server });

type AuthedRequest = Request & { org_id?: string };

// Auth middleware (multi-tenant)
const authMiddleware: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      org_id: string;
      user_id: string;
    };
    (req as AuthedRequest).org_id = decoded.org_id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.use('/api/mcp', authMiddleware, mcpRouter);

type TenantWebSocket = WebSocket & { orgId?: string };

// WebSocket for events (universal comm)
wss.on('connection', (ws: TenantWebSocket, req: IncomingMessage) => {
  const url = req.url ?? '';
  const orgIdMatch = url.match(/org=([^&]+)/);
  ws.orgId = orgIdMatch ? decodeURIComponent(orgIdMatch[1]) : undefined;

  ws.on('message', data => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'event') {
      // Broadcast to widgets in org
      wss.clients.forEach(client => {
        const tenantClient = client as TenantWebSocket;
        if (tenantClient.orgId === ws.orgId && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    }
  });
});

// Notification route (for Epic 18)
app.post('/api/notifications/push', authMiddleware, async (req: Request, res: Response) => {
  const { subscription, payload } = req.body as {
    subscription?: unknown;
    payload?: unknown;
  };

  if (!subscription || !payload) {
    return res.status(400).json({ error: 'subscription and payload are required' });
  }

  // TODO: Use web-push to send
  // TODO: Integrate with aulaPoller
  res.json({ success: true });
});

export { app, wss };
