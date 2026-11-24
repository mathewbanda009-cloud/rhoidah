const express = require('express');
const cors = require('cors');
const { readConfig } = require('./config');
const recordsRouter = require('./routes/records');
const renderGuide = require('./views/guide');

function createApp({ database = require('./db').database, config = {}, logger = console } = {}) {
  const settings = { ...readConfig(), ...config };
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: settings.clientOrigins }));
  app.use(express.json({ limit: '16kb' }));

  app.get('/', (req, res) => {
    const apiBaseUrl = settings.apiBaseUrl.replace(/\/+$/, '') || `${req.protocol}://${req.get('host')}`;
    res.status(200).type('html').send(renderGuide({ ...settings, apiBaseUrl }));
  });
  app.get('/health', async (req, res) => {
    try {
      await database.execute('SELECT id FROM records LIMIT 1');
      res.status(200).json({ status: 'ok', database: 'ok' });
    } catch (error) {
      logger.error('Database health check failed:', error);
      res.status(503).json({ message: 'Database is unavailable.' });
    }
  });
  app.use('/api/records', recordsRouter(database));
  app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Malformed JSON. Send a valid JSON object.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(400).json({ message: 'Request body is too large (maximum 16 KB).' });
    }
    if (['charset.unsupported', 'encoding.unsupported', 'request.aborted', 'request.size.invalid'].includes(error.type)) {
      return res.status(400).json({ message: 'Invalid request body. Send UTF-8 JSON with a supported content encoding.' });
    }
    if (error.status === 400) return res.status(400).json({ message: error.message });
    logger.error('Unexpected request failure:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  });
  return app;
}

module.exports = { createApp };
