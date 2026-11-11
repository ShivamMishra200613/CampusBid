import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/config.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { uploadsDir } from './middleware/upload.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CampusBid API Server', timestamp: new Date().toISOString() });
});

// Root /uploads endpoint alias to support both /uploads and /api/v1/uploads
app.use('/uploads', uploadRoutes);

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
