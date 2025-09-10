import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env.js';
import { testConnection } from './config/supabase.js';
import glucoseRoutes from './routes/glucose.js';
import realtimeService from './services/realtime.js';
import { authErrorHandler } from './middleware/auth.js';

const app = express();

// Trust proxy for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.node_env !== 'test') {
  app.use(morgan(config.node_env === 'production' ? 'combined' : 'dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rate_limit.max_requests, // limit each IP to max_requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Serve static files
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.node_env,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api', glucoseRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'xDrip+ Glucose Server API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      xdrip_upload: '/api/xdrip',
      readings: '/api/readings'
    },
    documentation: 'See README.md for setup instructions'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: ['/health', '/api/xdrip', '/api/readings']
  });
});

// Authentication error handler
app.use(authErrorHandler);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Supabase/PostgreSQL errors
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Foreign Key Violation',
      message: 'Referenced record does not exist'
    });
  }
  
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this data already exists'
    });
  }
  
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Check Constraint Violation',
      message: 'Data does not meet validation requirements'
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: config.node_env === 'production' ? 'Internal Server Error' : err.name,
    message: config.node_env === 'production' ? 'Something went wrong' : err.message,
    ...(config.node_env !== 'production' && { stack: err.stack })
  });
});

// Supabase connection test
const connectSupabase = async () => {
  try {
    // Check if Supabase is configured
    if (!config.supabase.url || config.supabase.url === 'https://your-project-id.supabase.co') {
      console.log('⚠️  Supabase not configured - running in demo mode');
      console.log('📚 To set up Supabase, see: SUPABASE_SETUP.md');
      return false;
    }

    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('⚠️  Supabase connection failed - running in demo mode');
      console.log('📚 Check your .env file and see: SUPABASE_SETUP.md');
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.log('⚠️  Supabase connection failed - running in demo mode');
    console.log('📚 Check your .env file and see: SUPABASE_SETUP.md');
    console.log(`   Error: ${error.message}`);
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Test Supabase connection (non-blocking)
    const supabaseConnected = await connectSupabase();
    
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📊 Environment: ${config.node_env}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
      console.log(`📡 xDrip+ endpoint: http://localhost:${config.port}/api/xdrip`);
      
      if (supabaseConnected) {
        console.log(`🔄 WebSocket endpoint: ws://localhost:${config.port}/ws/glucose`);
        console.log(`🔐 Authentication: Enabled`);
      } else {
        console.log(`⚠️  WebSocket endpoint: Disabled (Supabase not configured)`);
        console.log(`⚠️  Authentication: Disabled (Supabase not configured)`);
        console.log(`📚 To enable full features, configure Supabase - see SUPABASE_SETUP.md`);
      }
    });
    
    // Initialize real-time WebSocket service only if Supabase is connected
    if (supabaseConnected) {
      realtimeService.initialize(server);
    }
    
    // Graceful shutdown
    const shutdown = () => {
      console.log('Shutting down gracefully...');
      if (supabaseConnected) {
        realtimeService.shutdown();
      }
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if this file is run directly
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const currentFile = resolve(process.argv[1]);
const thisFile = resolve(__filename);

if (currentFile === thisFile) {
  startServer();
}

export default app;
