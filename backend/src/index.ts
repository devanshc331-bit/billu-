import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { connectDB, prisma } from './storage/database.js';
import { SchedulerService } from './scheduler/scheduler.service.js';
import apiRouter from './api/router.js';
import { logger } from './logging/logger.js';

const app = express();

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

app.use(express.json());

// Main API Router
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

async function bootstrap() {
  // 1. Connect to SQLite
  await connectDB();

  // 2. Start Scheduler
  SchedulerService.start();

  // 3. Listen on PORT
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Smart Inbox Triage API running at http://localhost:${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...');
    SchedulerService.stop();
    server.close(async () => {
      logger.info('Express server closed.');
      await prisma.$disconnect();
      logger.info('Database disconnected. Exit.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal error during startup bootstrap:', err);
  process.exit(1);
});
