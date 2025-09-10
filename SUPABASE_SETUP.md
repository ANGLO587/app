# Supabase Glucose Monitoring System Setup Guide

This guide will walk you through setting up a complete glucose monitoring system with Supabase backend, real-time updates, and authentication.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Phase 1: Supabase Database Setup](#phase-1-supabase-database-setup)
3. [Phase 2: Environment Configuration](#phase-2-environment-configuration)
4. [Phase 3: Development Setup](#phase-3-development-setup)
5. [Phase 4: Sample Data](#phase-4-sample-data)
6. [Phase 5: API Testing](#phase-5-api-testing)
7. [Phase 6: Real-time WebSocket](#phase-6-real-time-websocket)
8. [Phase 7: Deployment](#phase-7-deployment)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available)
- Basic knowledge of SQL and REST APIs

## Phase 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project name: `glucose-monitoring`
5. Enter database password (save this!)
6. Select region closest to your users
7. Click "Create new project"

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to "SQL Editor"
2. Copy the contents of `database/supabase-schema.sql`
3. Paste into the SQL editor
4. Click "Run" to execute the schema

This will create:
- `profiles` table for user information
- `glucose_readings` table for glucose data
- Row Level Security (RLS) policies
- Database functions for statistics
- Triggers for automatic timestamps
- Real-time subscriptions

### 1.3 Get API Keys

1. Go to "Settings" → "API"
2. Copy the following values:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key (be careful with this!)

## Phase 2: Environment Configuration

### 2.1 Create Environment File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Supabase credentials:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Replace with your actual Supabase values
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # Optional: MongoDB URI if migrating from existing system
   MONGODB_URI=mongodb://localhost:27017/xdrip-glucose
   
   # CORS - adjust for production
   CORS_ORIGIN=*
   CORS_CREDENTIALS=true
   ```

### 2.2 Security Configuration

For production, update these values:
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-super-secure-random-string
```

## Phase 3: Development Setup

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 3.3 Verify Setup

1. Check health endpoint: `GET http://localhost:3000/health`
2. Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-01-01T12:00:00.000Z",
     "uptime": 1.234,
     "environment": "development",
     "version": "1.0.0"
   }
   ```

## Phase 4: Sample Data

### 4.1 Create Test Users

1. In Supabase dashboard, go to "Authentication" → "Users"
2. Click "Add user" → "Create new user"
3. Enter email: `patient@example.com`
4. Enter password: `testpassword123`
5. Click "Create user"
6. Copy the User ID (UUID)

### 4.2 Insert Sample Data

1. Go to Supabase "SQL Editor"
2. Open `database/sample-data.sql`
3. Replace `YOUR_USER_ID_HERE` with the actual User ID
4. Run the SQL script

## Phase 5: API Testing

### 5.1 Authentication

First, get an access token by signing in:

```bash
curl -X POST 'https://your-project-id.supabase.co/auth/v1/token?grant_type=password' \
-H "apikey: YOUR_ANON_KEY" \
-H "Content-Type: application/json" \
-d '{
  "email": "patient@example.com",
  "password": "testpassword123"
}'
```

Save the `access_token` from the response.

### 5.2 Test Endpoints

#### Get Glucose Readings
```bash
curl -X GET 'http://localhost:3000/api/readings' \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Add New Reading
```bash
curl -X POST 'http://localhost:3000/api/readings' \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "glucose": 120,
  "notes": "Test reading",
  "device": "Test Device"
}'
```

#### Get Statistics
```bash
curl -X GET 'http://localhost:3000/api/stats' \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### xDrip+ Upload (No Auth Required)
```bash
curl -X POST 'http://localhost:3000/api/xdrip' \
-H "Content-Type: application/json" \
-d '{
  "glucose": 125,
  "patient_id": "YOUR_USER_ID_HERE",
  "device": "xDrip+",
  "trend": "Stable"
}'
```

## Phase 6: Real-time WebSocket

### 6.1 WebSocket Connection

Connect to: `ws://localhost:3000/ws/glucose`

### 6.2 WebSocket Protocol

#### Authenticate
```json
{
  "type": "authenticate",
  "token": "YOUR_ACCESS_TOKEN"
}
```

#### Subscribe to Updates
```json
{
  "type": "subscribe",
  "patientId": "YOUR_USER_ID_HERE"
}
```

#### Receive Real-time Updates
```json
{
  "type": "new_reading",
  "data": {
    "id": 123,
    "glucose": 120,
    "timestamp": "2024-01-01T12:00:00Z",
    "trend": "Stable"
  }
}
```

### 6.3 Test WebSocket with JavaScript

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/glucose');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'authenticate',
    token: 'YOUR_ACCESS_TOKEN'
  }));
  
  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    patientId: 'YOUR_USER_ID_HERE'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## Phase 7: Deployment

### 7.1 Environment Variables

Set these environment variables in your deployment platform:

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-production-secret
```

### 7.2 Heroku Deployment

1. Create `Procfile`:
   ```
   web: node server.js
   ```

2. Deploy:
   ```bash
   git add .
   git commit -m "Deploy glucose monitoring system"
   heroku create your-app-name
   heroku config:set NODE_ENV=production
   heroku config:set SUPABASE_URL=your-url
   heroku config:set SUPABASE_ANON_KEY=your-key
   git push heroku main
   ```

### 7.3 Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### 7.4 Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Troubleshooting

### Common Issues

#### 1. Supabase Connection Failed
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check if your IP is allowed in Supabase settings
- Ensure the database is not paused (free tier limitation)

#### 2. Authentication Errors
- Verify JWT token is valid and not expired
- Check if user exists in auth.users table
- Ensure RLS policies are correctly configured

#### 3. WebSocket Connection Issues
- Check if WebSocket is supported by your deployment platform
- Verify CORS settings allow WebSocket connections
- Test with a simple WebSocket client first

#### 4. Database
