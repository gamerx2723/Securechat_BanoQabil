import { createServer } from './server.js';
import { config } from './config.js';

const { httpServer } = createServer();

httpServer.listen(config.port, () => {
  console.log(`
=====================================================
🛡️  SECURECHAT CORE API & WEBSOCKET GATEWAY RUNNING
=====================================================
- Port: ${config.port}
- REST Gateway: http://localhost:${config.port}/api/v1
- WebSocket:    ws://localhost:${config.port}/ws/v1
- AI Service:   ${config.aiServiceUrl}
- Health Check: http://localhost:${config.port}/health
=====================================================
`);
});
