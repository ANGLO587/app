import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * Validates that required environment variables are set
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not set
 * @param {boolean} required - Whether the variable is required
 * @returns {string} The environment variable value
 */
const getEnvVar = (key, defaultValue = '', required = false) => {
  const value = process.env[key] || defaultValue;
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value;
};

/**
 * Converts string to number with validation
 * @param {string} value - String value to convert
 * @param {number} defaultValue - Default number if conversion fails
 * @returns {number} Converted number
 */
const toNumber = (value, defaultValue) => {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Converts string to boolean
 * @param {string} value - String value to convert
 * @param {boolean} defaultValue - Default boolean value
 * @returns {boolean} Converted boolean
 */
const toBoolean = (value, defaultValue) => {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true';
};

// Environment configuration
export const config = {
  // Server configuration
  node_env: getEnvVar('NODE_ENV', 'development'),
  port: toNumber(getEnvVar('PORT', '3000'), 3000),
  
  // MongoDB configuration
  mongodb: {
    uri: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017/xdrip-glucose', true),
    options: {
      maxPoolSize: toNumber(getEnvVar('DB_MAX_POOL_SIZE', '10'), 10),
      serverSelectionTimeoutMS: toNumber(getEnvVar('DB_SERVER_SELECTION_TIMEOUT', '5000'), 5000),
      socketTimeoutMS: toNumber(getEnvVar('DB_SOCKET_TIMEOUT', '45000'), 45000),
    }
  },
  
  // CORS configuration
  cors: {
    origin: getEnvVar('CORS_ORIGIN', '*'),
    credentials: toBoolean(getEnvVar('CORS_CREDENTIALS', 'true'), true)
  },
  
  // Rate limiting configuration
  rate_limit: {
    window_ms: toNumber(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 900000), // 15 minutes
    max_requests: toNumber(getEnvVar('RATE_LIMIT_MAX_REQUESTS', '100'), 100)
  },
  
  // Security configuration
  security: {
    jwt_secret: getEnvVar('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
    bcrypt_rounds: toNumber(getEnvVar('BCRYPT_ROUNDS', '12'), 12)
  },
  
  // Logging configuration
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    format: getEnvVar('LOG_FORMAT', 'combined')
  },
  
  // API configuration
  api: {
    version: getEnvVar('API_VERSION', 'v1'),
    prefix: getEnvVar('API_PREFIX', '/api')
  }
};

// Validate critical configuration
const validateConfig = () => {
  const errors = [];
  
  // Check MongoDB URI format
  if (!config.mongodb.uri.startsWith('mongodb://') && !config.mongodb.uri.startsWith('mongodb+srv://')) {
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  }
  
  // Check port range
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  
  // Check environment
  const validEnvs = ['development', 'test', 'production'];
  if (!validEnvs.includes(config.node_env)) {
    errors.push(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
};

// Run validation
validateConfig();

// Log configuration in development
if (config.node_env === 'development') {
  console.log('📋 Configuration loaded:');
  console.log(`  Environment: ${config.node_env}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  MongoDB: ${config.mongodb.uri.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`  CORS Origin: ${config.cors.origin}`);
}

export default config;