const http = require('node:http');
const { once } = require('node:events');
require('./config');

async function startServer({ database, logger = console } = {}) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer from 0 to 65535.');
  let app;
  let stopped = false;
  let closing;
  const server = http.createServer((req, res) => {
    if (app) return app(req, res);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Server is starting. Please retry shortly.' }));
  });

  function close() {
    if (closing) return closing;
    stopped = true;
    app = undefined;
    closing = (async () => {
      try {
        if (server.listening) {
          await new Promise((resolve, reject) => {
            const timer = setTimeout(() => server.closeAllConnections(), 5000);
            timer.unref();
            server.close(error => {
              clearTimeout(timer);
              if (error) reject(error); else resolve();
            });
            server.closeIdleConnections();
          });
        }
      } finally {
        try { if (database) await database.close(); }
        finally {
          process.removeListener('SIGINT', shutdown);
          process.removeListener('SIGTERM', shutdown);
          process.removeListener('message', onMessage);
          process.removeListener('disconnect', shutdown);
          if (process.connected) process.disconnect();
        }
      }
    })();
    return closing;
  }
  function shutdown() {
    close().catch(error => { logger.error('Shutdown failed:', error); process.exitCode = 1; });
  }
  function onMessage(message) {
    if (message?.type === 'shutdown') shutdown();
  }
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  if (typeof process.send === 'function') {
    process.on('message', onMessage);
    process.once('disconnect', shutdown);
  }

  try {
    server.listen(port, '0.0.0.0');
    await once(server, 'listening');
    database ??= require('./db').database;
    await database.initialize();
    if (stopped) throw new Error('Server stopped during initialization.');
    app = require('./app').createApp({ database, logger });
    const actualPort = server.address().port;
    logger.log(`Server listening on port ${actualPort}`);
    if (process.connected) process.send({ type: 'ready', port: actualPort }, () => {});
    return { app, server, close };
  } catch (error) {
    await close();
    throw error;
  }
}

if (require.main === module) {
  startServer().catch(error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${process.env.PORT || 3000} is already in use. Stop the other server or choose another PORT.`);
    } else console.error('Server startup failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
