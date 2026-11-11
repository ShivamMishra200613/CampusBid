import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CampusBid API Server', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
