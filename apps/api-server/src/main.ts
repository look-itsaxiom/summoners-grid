import express from 'express';
import cookieParser from 'cookie-parser';
import { config } from './config/environment.js';
import { 
  securityHeaders,
  corsMiddleware,
  generalRateLimit,
  requestLogger,
  errorHandler,
  notFoundHandler,
  additionalSecurity
} from './middleware/security.js';
import authRoutes from './routes/auth.js';

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(additionalSecurity);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(generalRateLimit);

// Request logging
if (!config.isTest) {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Summoner\'s Grid API Server',
      version: '1.0.0',
      environment: config.nodeEnv,
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        docs: '/api/docs' // Future API documentation
      }
    }
  });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(config.port, config.host, () => {
  console.log(`🚀 Summoner's Grid API Server ready at http://${config.host}:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔐 JWT Expiration: ${config.jwtExpiration}`);
  console.log(`⚡ Rate Limit: ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000 / 60} minutes`);
});
