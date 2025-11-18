// MCP API Gateway - Integrated from template
import express from 'express';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';  // For auth
import { mcpRouter } from '../router';  // Existing

const app = express();
const server = app.listen(3001);
const wss = new WebSocketServer({ server });

// Auth middleware (multi-tenant)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { org_id: string, user_id: string };
    req.org_id = decoded.org_id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes
app.use('/api/mcp', authMiddleware, mcpRouter);

// WebSocket for events (universal comm)
wss.on('connection', (ws, req) => {
  const org_id = req.url.split('org=')[1];  // Tenant-specific
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'event') {
      // Broadcast to widgets in org
      wss.clients.forEach(client => {
        if (client.org_id === org_id && client.readyState === 1) {
          client.send(JSON.stringify(msg));
        }
      });
    }
  });
});

// Notification route (for Epic 18)
app.post('/api/notifications/push', authMiddleware, async (req, res) => {
  const { subscription, payload } = req.body;
  // Use web-push to send
  // Integrate with aulaPoller
  res.json({ success: true });
});

export { app, wss };
