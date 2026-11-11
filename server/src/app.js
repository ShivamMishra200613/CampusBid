import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config/config.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { uploadsDir } from './middleware/upload.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

const cleanOrigin = (config.clientOrigin || 'http://localhost:5173').replace(/\/+$/, '');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: [cleanOrigin, `${cleanOrigin}/`],
    credentials: true
  })
);

// Structured request logging: 'combined' in production, 'dev' in development, silent in test
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint reporting database connectivity
app.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbStatus = isDbConnected ? 'connected' : 'disconnected';

  if (!isDbConnected) {
    return res.status(503).json({
      status: 'error',
      database: dbStatus,
      service: 'CampusBid API Server',
      timestamp: new Date().toISOString()
    });
  }

  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    service: 'CampusBid API Server',
    timestamp: new Date().toISOString()
  });
});

// Root /uploads endpoint alias to support both /uploads and /api/v1/uploads
app.use('/uploads', uploadRoutes);

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
