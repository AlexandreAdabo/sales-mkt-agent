import { Router } from 'express';

export function createHealthRouter() {
  const router = Router();

  router.get('/health', (_request, response) => {
    response.json({
      status: 'ok',
      service: 'sales-mkt-agent',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
