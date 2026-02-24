import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import driveRoutes from './routes/drive.js';
import transferRoutes from './routes/transfer.js';
import adminRoutes from './routes/admin.js';
import { initDb } from './services/db.js';
import { generalLimiter, authLimiter } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.use(generalLimiter);
app.use('/auth', authLimiter, authRoutes);
app.use('/drive', driveRoutes);
app.use('/transfer', transferRoutes);
app.use('/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

initDb();
app.listen(PORT, () => {
  console.log(`DriveMigrate backend running on http://localhost:${PORT}`);
});
