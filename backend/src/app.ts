import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import campaignRoutes from './routes/campaign.routes';
import submissionRoutes from './routes/submission.routes';

const app = express();

// ─── Security & Parsing ─────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL || true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Meme\'d Campaign Payout Tracker API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/submissions', submissionRoutes);

// ─── 404 Handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ───────────────────────────────────────
app.use(errorHandler);

export default app;

