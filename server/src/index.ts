import express from 'express';
import cors from 'cors';
import path from 'path';
import { getDb } from './db/init';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import projectsRoutes from './routes/projects';
import chaptersRoutes from './routes/chapters';
import aiRoutes from './routes/ai';
import stylesRoutes from './routes/styles';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database
getDb();
console.log('Database initialized');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/projects', authMiddleware, projectsRoutes);
app.use('/api/chapters', authMiddleware, chaptersRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/styles', authMiddleware, stylesRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`NovelAgent server running on http://localhost:${PORT}`);
});
