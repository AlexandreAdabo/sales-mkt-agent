import express from 'express';
import { createHealthRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(createHealthRouter());
  return app;
}
