import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

import { isProduction, runtimeConfig } from './config/runtimeConfig.js';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import tenancyRoutes from './routes/tenancyRoutes.js';
import rentChargeRoutes from './routes/rentChargeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { csrfProtection } from './middleware/csrfMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;

// 1. Security Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing with credentials
app.use(cors({
  origin: runtimeConfig.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
}));

// 3. Body & Cookie Parsing
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// 4. CSRF Protection for state-changing requests
app.use(csrfProtection);

// 5. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      app: 'IKTIS API',
      timestamp: new Date().toISOString(),
    },
  });
});

// 6. Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenancies', tenancyRoutes);
app.use('/api/rent-charges', rentChargeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// 7. Centralized Error Handler
app.use(errorHandler);

// Auto-start server only for local development. Vercel runs the exported Express app as a serverless function.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
const shouldListenLocally = isMain && process.env.VERCEL !== '1';

if (shouldListenLocally) {
  app.listen(PORT, () => {
    console.log(`[IKTIS Backend] Server running on http://localhost:${PORT}`);
  });
}

export default app;
