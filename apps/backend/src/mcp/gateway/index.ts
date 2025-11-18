// MCP API Gateway - Integrated from template
import express, { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IncomingMessage } from 'http';
import { mcpRouter } from '../router';  // Existing - assume router exists

const app = express();
const server = app.listen(3001, () => console.log('MCP Gateway listening on port 3001'));
const wss = new WebSocketServer({ server });

// Auth middleware (multi-tenant)
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { org_id: string, user_id: string };
    (req as any).org_id = decoded.org_id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.use('/api/mcp', authMiddleware, mcpRouter);

// WebSocket for events (universal comm)
wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const org_id = req.url?.split('org=')[1] || 'default';  // Tenant-specific
  (ws as any).org_id = org_id;
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'event') {
      // Broadcast to widgets in org
      wss.clients.forEach((client: WebSocket) => {
        if ((client as any).org_id === org_id && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    }
  });
});

// Notification route (for Epic 18)
app.post('/api/notifications/push', authMiddleware, async (req: Request, res: Response) => {
  const { subscription, payload } = req.body;
  // Use web-push to send
  // Integrate with aulaPoller
  res.json({ success: true });
});

export { app, wss };
