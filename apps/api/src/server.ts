import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { config } from './config.js';
import { authRouter } from './routes/auth.routes.js';
import { devicesRouter } from './routes/devices.routes.js';
import { keysRouter } from './routes/keys.routes.js';
import { conversationsRouter } from './routes/conversations.routes.js';
import { messagesRouter } from './routes/messages.routes.js';
import { securityRouter } from './routes/security.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { wsGateway } from './websocket/ws_gateway.js';

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow all during local dev or match configured origins
      callback(null, true);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));

  // Health Check
  app.get('/health', (req, res) => {
    res.json({ status: 'HEALTHY', timestamp: new Date().toISOString(), service: 'SecureChat Core API' });
  });

  // REST Routers (Support /api/v1/*, /api/*, and root /* endpoints)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/auth', authRouter);
  app.use('/auth', authRouter);

  app.use('/api/v1/devices', devicesRouter);
  app.use('/api/devices', devicesRouter);
  app.use('/devices', devicesRouter);

  app.use('/api/v1/keys', keysRouter);
  app.use('/api/keys', keysRouter);
  app.use('/keys', keysRouter);

  app.use('/api/v1/conversations', conversationsRouter);
  app.use('/api/conversations', conversationsRouter);
  app.use('/conversations', conversationsRouter);

  app.use('/api/v1/messages', messagesRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/messages', messagesRouter);

  app.use('/api/v1/security', securityRouter);
  app.use('/api/security', securityRouter);
  app.use('/security', securityRouter);

  app.use('/api/v1/ai', aiRouter);
  app.use('/api/ai', aiRouter);
  app.use('/ai', aiRouter);

  app.use('/api/v1/admin', adminRouter);
  app.use('/api/admin', adminRouter);
  app.use('/admin', adminRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });

  // Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err?.message });
  });

  const httpServer = http.createServer(app);

  // Attach WebSocket Gateway
  wsGateway.init(httpServer);

  return { app, httpServer };
}
