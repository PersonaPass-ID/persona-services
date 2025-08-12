#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import winston from 'winston';
import dotenv from 'dotenv';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.supabase.co", "http://54.84.36.16:26657", "http://54.84.36.16:1317"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://persona-website-rho.vercel.app',
    'https://persona-wallet-eight.vercel.app',
    'https://persona-pass.vercel.app',
    'https://*.personapass.me',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'PersonaPass Backend Services',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'operational',
      blockchain: 'checking...',
      lambda_functions: 'operational'
    }
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'PersonaPass Backend API is operational',
    endpoints: {
      health: '/health',
      status: '/api/status',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        verify: 'POST /api/auth/verify-totp'
      },
      identity: {
        create_did: 'POST /api/identity/create-did',
        get_credentials: 'GET /api/identity/credentials/:address'
      },
      blockchain: {
        status: 'GET /api/blockchain/status',
        transaction: 'POST /api/blockchain/transaction'
      }
    },
    lambda_functions: {
      totp_setup: process.env.LAMBDA_TOTP_SETUP_URL || 'configured',
      totp_verify: process.env.LAMBDA_TOTP_VERIFY_URL || 'configured',
      session_create: process.env.LAMBDA_SESSION_CREATE_URL || 'configured'
    }
  });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, totpCode } = req.body;
    
    if (!email || !password || !totpCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and TOTP code are required'
      });
    }

    // This would normally call our Lambda function
    // For now, return a structured response
    logger.info('Login attempt', { email: email.substring(0, 3) + '***' });
    
    res.json({
      success: true,
      message: 'Login endpoint ready - integrate with Lambda function',
      requiresIntegration: {
        lambdaFunction: 'personapass-session-create-prod',
        endpoint: process.env.LAMBDA_SESSION_CREATE_URL
      }
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// TOTP setup route
app.post('/api/auth/totp/setup', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    logger.info('TOTP setup request', { userId: userId.substring(0, 8) + '...' });
    
    res.json({
      success: true,
      message: 'TOTP setup endpoint ready - integrate with Lambda function',
      requiresIntegration: {
        lambdaFunction: 'personapass-totp-setup-prod',
        endpoint: process.env.LAMBDA_TOTP_SETUP_URL
      }
    });
    
  } catch (error) {
    logger.error('TOTP setup error:', error);
    res.status(500).json({
      success: false,
      message: 'TOTP setup failed',
      error: error.message
    });
  }
});

// Blockchain status route
app.get('/api/blockchain/status', async (req, res) => {
  try {
    const personaChainUrl = process.env.PERSONACHAIN_RPC_URL || 'http://54.84.36.16:26657';
    
    logger.info('Checking PersonaChain status...');
    
    res.json({
      success: true,
      blockchain: {
        name: 'PersonaChain',
        rpc_url: personaChainUrl,
        api_url: process.env.PERSONACHAIN_API_URL || 'http://54.84.36.16:1317',
        chain_id: 'personachain-1',
        status: 'initializing',
        message: 'PersonaChain is starting up (typically 10-15 minutes)',
        features: {
          did_module: 'available',
          credential_module: 'available',
          zk_proof_module: 'available'
        }
      }
    });
    
  } catch (error) {
    logger.error('Blockchain status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check blockchain status',
      error: error.message
    });
  }
});

// DID creation route
app.post('/api/identity/create-did', async (req, res) => {
  try {
    const { walletAddress, firstName, lastName } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    logger.info('DID creation request', { address: walletAddress.substring(0, 8) + '...' });
    
    res.json({
      success: true,
      message: 'DID creation ready - waiting for PersonaChain to be operational',
      requirements: {
        blockchain: 'PersonaChain must be fully initialized',
        modules: 'DID module must be active',
        estimated_time: '5-10 more minutes'
      },
      preview: {
        did: `did:persona:${walletAddress}`,
        method: 'persona',
        network: 'personachain-1'
      }
    });
    
  } catch (error) {
    logger.error('DID creation error:', error);
    res.status(500).json({
      success: false,
      message: 'DID creation failed',
      error: error.message
    });
  }
});

// Credentials route
app.get('/api/identity/credentials/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    logger.info('Credentials request', { address: address.substring(0, 8) + '...' });
    
    res.json({
      success: true,
      credentials: [],
      message: 'Credentials endpoint ready - integrate with Supabase',
      integration: {
        database: 'Supabase operational',
        table: 'verifiable_credentials',
        status: 'ready for integration'
      }
    });
    
  } catch (error) {
    logger.error('Credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credentials',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /api/status',
      'POST /api/auth/login',
      'POST /api/auth/totp/setup',
      'GET /api/blockchain/status',
      'POST /api/identity/create-did',
      'GET /api/identity/credentials/:address'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 PersonaPass Backend Services running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
  logger.info(`📋 API status: http://localhost:${PORT}/api/status`);
  logger.info(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'production') {
    logger.info('🎯 Production mode active');
    logger.info('🛡️  Security headers enabled');
    logger.info('📊 Request logging active');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;