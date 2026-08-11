import express from 'express';
import { createHealthRouter } from './routes/health.routes.js';
import { createLeadsRouter } from './routes/leads.routes.js';

export function createApp({ leadRepository } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(createHealthRouter());
  if (leadRepository) app.use(createLeadsRouter({ leadRepository }));
  return app;
}
