# Deployment Guide

This guide covers deploying your xDrip+ Glucose Server to various cloud platforms.

## 🚀 Heroku Deployment

### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Git repository initialized
- Heroku account

### Step 1: Prepare Your App

1. Ensure your `package.json` includes the start script:
   ```json
   {
     "scripts": {
       "start": "node server.js"
     }
   }
   ```

2. Create a `Procfile` in your root directory:
   ```
   web: node server.js
   ```

### Step 2: Create Heroku App

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-glucose-server

# Add MongoDB Atlas add-on (optional)
heroku addons:create mongolab:sandbox
```

### Step 3: Set Environment Variables

```bash
# Set production environment
heroku config:set NODE_ENV=production

# Set MongoDB URI (if not using Heroku add-on)
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/glucose?retryWrites=true&w=majority"

# Set other environment variables
heroku config:set JWT_SECRET="your-super-secret-production-jwt-key"
heroku config:set CORS_ORIGIN="https://your-frontend-domain.com"
heroku config:set RATE_LIMIT_MAX_REQUESTS=200
```

### Step 4: Deploy

```bash
# Add Heroku remote
git remote add heroku https://git.heroku.com/your-glucose-server.git

# Deploy
git add .
git commit -m "Initial deployment"
git push heroku main

# Open your app
heroku open
```

### Step 5: Monitor

```bash
# View logs
heroku logs --tail

# Check app status
heroku ps:scale web=1
```

## 🚄 Railway Deployment

### Prerequisites
- [Railway CLI](https://docs.railway.app/develop/cli) installed
- Railway account

### Step 1: Initialize Railway Project

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Link to existing project (optional)
railway link
```

### Step 2: Set Environment Variables

Create a `.env.production` file or set via Railway dashboard:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/glucose
JWT_SECRET=your-super-secret-production-jwt-key
CORS_ORIGIN=https://your-frontend-domain.com
PORT=3000
```

### Step 3: Deploy

```bash
# Deploy to Railway
railway up

# Check deployment status
railway status
```

## 🐳 Docker Deployment

### Dockerfile

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "server.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/glucose
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=glucose
    restart: unless-stopped

volumes:
  mongo_data:
```

### Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## ☁️ MongoDB Atlas Setup

### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new account or sign in
3. Create a new cluster (M0 Sandbox is free)

### Step 2: Configure Network Access

1. Go to **Network Access** in the sidebar
2. Click **Add IP Address**
3. Add `0.0.0.0/0` for development (restrict in production)

### Step 3: Create Database User

1. Go to **Database Access** in the sidebar
2. Click **Add New Database User**
3. Create a user with read/write permissions

### Step 4: Get Connection String

1. Go to **Clusters** and click **Connect**
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your user's password

Example connection string:
```
mongodb+srv://username:password@cluster0.abcde.mongodb.net/glucose?retryWrites=true&w=majority
```

## 🔧 Environment Configuration

### Production Environment Variables

```bash
# Required
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# Optional with defaults
PORT=3000
CORS_ORIGIN=*
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
LOG_LEVEL=info
```

### Security Checklist

- [ ] Use strong, unique JWT secret
- [ ] Restrict CORS origins in production
- [ ] Use HTTPS in production
- [ ] Set up proper MongoDB authentication
- [ ] Configure rate limiting appropriately
- [ ] Set up monitoring and logging
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB connection encryption

## 📊 Monitoring and Logging

### Health Check Endpoint

Your server includes a health check at `/health`:

```bash
curl https://your-app.herokuapp.com/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### Logging

The server uses Morgan for HTTP request logging. In production, it uses the 'combined' format.

### Error Tracking

Consider integrating error tracking services:

1. **Sentry**: Add to environment variables
   ```bash
   SENTRY_DSN=your-sentry-dsn
   ```

2. **LogRocket**: For frontend error tracking

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "your-glucose-server"
        heroku_email: "your-email@example.com"
```

## 🔍 Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check for syntax errors

2. **Database Connection Issues**
   - Verify MongoDB URI format
   - Check network access settings in MongoDB Atlas
   - Ensure database user has correct permissions

3. **Environment Variable Issues**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure sensitive data is not in source code

### Performance Optimization

1. **Enable Compression**: Already included in server.js
2. **Use CDN**: For static assets if any
3. **Database Indexing**: Already configured in Mongoose schema
4. **Caching**: Consider Redis for frequently accessed data
5. **Load Balancing**: Use multiple dynos/instances for high traffic