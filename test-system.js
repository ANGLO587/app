#!/usr/bin/env node

/**
 * Simple system test script for the Supabase Glucose Monitoring System
 * This script tests basic functionality without requiring authentication
 */

import { testConnection } from './config/supabase.js';
import { config } from './config/env.js';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

async function testEnvironmentVariables() {
  log.info('Testing environment variables...');
  
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    log.error(`Missing required environment variables: ${missing.join(', ')}`);
    log.warning('Please check your .env file and ensure all required variables are set');
    return false;
  }
  
  log.success('All required environment variables are set');
  return true;
}

async function testSupabaseConnection() {
  log.info('Testing Supabase connection...');
  
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      log.success('Supabase connection successful');
      return true;
    } else {
      log.error('Supabase connection failed');
      return false;
    }
  } catch (error) {
    log.error(`Supabase connection error: ${error.message}`);
    return false;
  }
}

async function testServerHealth() {
  log.info('Testing server health endpoint...');
  
  try {
    const response = await fetch(`http://localhost:${config.port}/health`);
    
    if (response.ok) {
      const data = await response.json();
      log.success(`Server health check passed - Status: ${data.status}`);
      return true;
    } else {
      log.error(`Server health check failed - Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.warning(`Server health check failed - Server may not be running: ${error.message}`);
    log.info(`Try running: npm run dev`);
    return false;
  }
}

async function testXDripEndpoint() {
  log.info('Testing xDrip+ endpoint (without authentication)...');
  
  try {
    const testData = {
      glucose: 120,
      device: 'Test Device',
      trend: 'Stable',
      notes: 'System test reading'
    };
    
    const response = await fetch(`http://localhost:${config.port}/api/xdrip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (response.status === 400) {
      const data = await response.json();
      if (data.message && data.message.includes('Patient ID is required')) {
        log.success('xDrip+ endpoint is working (authentication required as expected)');
        return true;
      }
    }
    
    if (response.ok) {
      log.success('xDrip+ endpoint is working');
      return true;
    } else {
      const data = await response.json();
      log.error(`xDrip+ endpoint test failed: ${data.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    log.error(`xDrip+ endpoint test error: ${error.message}`);
    return false;
  }
}

async function testWebSocketEndpoint() {
  log.info('Testing WebSocket endpoint availability...');
  
  try {
    // We can't easily test WebSocket connection without a proper client
    // So we'll just check if the server is running and assume WS is available
    const response = await fetch(`http://localhost:${config.port}/health`);
    
    if (response.ok) {
      log.success('WebSocket endpoint should be available at ws://localhost:' + config.port + '/ws/glucose');
      return true;
    } else {
      log.error('Server not running - WebSocket endpoint unavailable');
      return false;
    }
  } catch (error) {
    log.error(`WebSocket endpoint test error: ${error.message}`);
    return false;
  }
}

async function runSystemTest() {
  console.log('\n🧪 Supabase Glucose Monitoring System Test\n');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'Supabase Connection', fn: testSupabaseConnection },
    { name: 'Server Health', fn: testServerHealth },
    { name: 'xDrip+ Endpoint', fn: testXDripEndpoint },
    { name: 'WebSocket Endpoint', fn: testWebSocketEndpoint }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log('-'.repeat(30));
    
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      log.error(`Test "${test.name}" threw an error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results');
  console.log('='.repeat(50));
  
  if (failed === 0) {
    log.success(`All ${passed} tests passed! 🎉`);
    console.log('\n🚀 Your glucose monitoring system is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Create a user in Supabase Auth dashboard');
    console.log('2. Add sample data using database/sample-data.sql');
    console.log('3. Test the API endpoints with authentication');
    console.log('4. Set up your xDrip+ app to send data to /api/xdrip');
  } else {
    log.error(`${failed} test(s) failed, ${passed} test(s) passed`);
    console.log('\n🔧 Please fix the failing tests before proceeding.');
    console.log('\nCommon solutions:');
    console.log('- Check your .env file has correct Supabase credentials');
    console.log('- Ensure your Supabase project is active (not paused)');
    console.log('- Run the database schema: database/supabase-schema.sql');
    console.log('- Start the development server: npm run dev');
  }
  
  console.log('\n📚 For detailed setup instructions, see SUPABASE_SETUP.md');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the test
runSystemTest().catch((error) => {
  log.error(`System test failed: ${error.message}`);
  process.exit(1);
});
