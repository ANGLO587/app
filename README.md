# 🩸 Supabase Glucose Monitoring System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A modern, secure Node.js server built with Express and Supabase for receiving and storing glucose readings from xDrip+ and other continuous glucose monitoring (CGM) applications. Features real-time updates, authentication, and comprehensive analytics.

## ✨ Features

- 🔐 **Supabase Authentication** with JWT tokens and Row Level Security
- 📊 **Real-time glucose data** with WebSocket updates
- 🏥 **xDrip+ integration** with comprehensive setup guide
- 📈 **Advanced statistics** and analytics with PostgreSQL functions
- 🌐 **Multi-user support** with secure data isolation
- 🚀 **Production-ready** with comprehensive error handling
- 📱 **RESTful API** with modern JSON responses
- 🔍 **Comprehensive logging** and monitoring
- ⚡ **High performance** with optimized PostgreSQL queries
- 🔄 **Real-time WebSocket** updates for live glucose monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- xDrip+ app on Android device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/supabase-glucose-server.git
   cd supabase-glucose-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `database/supabase-schema.sql`
   - Get your project URL and API keys

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

6. **Test the system**
   ```bash
   npm run test:system
   ```

## 📚 Complete Setup Guide

For detailed setup instructions, see **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** which includes:

- Step-by-step Supabase project creation
- Database schema setup
- Authentication configuration
- Sample data insertion
- API testing examples
- WebSocket setup
- Deployment instructions

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/api/xdrip` | Optional | Receive glucose readings from xDrip+ |
| `POST` | `/api/readings` | ✅ | Add new glucose reading |
| `GET` | `/api/readings` | ✅ | Retrieve glucose readings with filtering |
| `GET` | `/api/readings/latest` | ✅ | Get the most recent glucose reading |
| `GET` | `/api/stats/:patient_id?` | ✅ | Get glucose statistics and analytics |
| `GET` | `/health` | No | Server health check |

### WebSocket Endpoint

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| `WebSocket` | `/ws/glucose` | Real-time glucose updates |

### Example Usage

#### Authentication
First, get an access token from Supabase:
```bash
curl -X POST 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

#### Send Glucose Reading (xDrip+)
```bash
curl -X POST http://localhost:3000/api/xdrip \
  -H "Content-Type: application/json" \
  -d '{
    "glucose": 120,
    "patient_id": "user-uuid-here",
    "timestamp": "2023-12-07T10:30:00.000Z",
    "trend": "Stable",
    "noise": "Clean"
  }'
```

#### Get Latest Readings (Authenticated)
```bash
curl "http://localhost:3000/api/readings?limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get Statistics
```bash
curl "http://localhost:3000/api/stats?hours=24" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "stats": { /* optional statistics */ }
}
```

## 🔄 Real-time WebSocket Updates

Connect to `ws://localhost:3000/ws/glucose` for real-time glucose updates:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/glucose');

// Authenticate
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'YOUR_ACCESS_TOKEN'
}));

// Subscribe to updates
ws.send(JSON.stringify({
  type: 'subscribe',
  patientId: 'YOUR_USER_ID'
}));

// Receive real-time updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'new_reading') {
    console.log('New glucose reading:', message.data);
  }
};
```

## 📱 xDrip+ Configuration

### Quick Setup

1. Open xDrip+ → Settings → Cloud Upload → REST API Upload
2. Enable REST API Upload
3. Set Base URL: `http://your-server:3000/api/xdrip`
4. Set Method: `POST`
5. Set Content Type: `JSON`

### Detailed Configuration

See [XDRIP_SETUP.md](XDRIP_SETUP.md) for comprehensive setup instructions.

## 🗄️ Database Schema

### Supabase Tables

#### profiles
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT CHECK (role IN ('patient', 'family_member', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### glucose_readings
```sql
CREATE TABLE glucose_readings (
  id BIGSERIAL PRIMARY KEY,
  patient_id UUID REFERENCES profiles(id),
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 1000),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  device TEXT DEFAULT 'xDrip+',
  trend TEXT CHECK (trend IN ('Rising', 'Falling', 'Stable', 'Unknown')),
  noise TEXT CHECK (noise IN ('Clean', 'Light', 'Medium', 'Heavy')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Security Features

- **Row Level Security (RLS)** enabled on all tables
- **JWT Authentication** with Supabase Auth
- **User isolation** - users can only access their own data
- **Real-time subscriptions** with proper authorization

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `SUPABASE_URL` | Yes | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | - | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | - | Supabase service role key |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Rate limit per window |

### Example .env

```bash
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX_REQUESTS=200
```

## 🚀 Deployment

### Heroku

```bash
# Create Heroku app
heroku create your-glucose-server

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL="your-supabase-url"
heroku config:set SUPABASE_ANON_KEY="your-anon-key"

# Deploy
git push heroku main
```

### Railway

```bash
# Deploy to Railway
railway login
railway init
railway up
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed deployment instructions.

## 📊 Monitoring & Analytics

### Health Monitoring

```bash
curl http://localhost:3000/health
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

### Advanced Statistics

Get comprehensive glucose analytics using PostgreSQL functions:

```bash
curl "http://localhost:3000/api/stats?hours=24" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Includes:
- Average glucose levels
- Time in range percentages (70-180 mg/dL)
- Min/max values
- Reading counts and trends

## 🔐 Security Features

- **Supabase Authentication** with JWT tokens
- **Row Level Security** for data isolation
- **Rate Limiting** to prevent API abuse
- **Input Validation** with express-validator
- **CORS Protection** with configurable policies
- **Helmet Security** headers and protections
- **Environment Isolation** with separate configs

## 🧪 Testing

```bash
# Run system tests
npm run test:system

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

### System Test

The system test verifies:
- Environment variables are set
- Supabase connection works
- Server health endpoint responds
- API endpoints are accessible
- WebSocket endpoint is available

## 📚 API Documentation

### POST /api/xdrip

Accepts glucose readings from xDrip+ and other sources.

**Request Body:**
```json
{
  "glucose": 120,           // Required: glucose value (0-1000)
  "patient_id": "uuid",     // Optional: patient UUID (uses auth if not provided)
  "timestamp": "ISO8601",   // Optional: reading timestamp
  "trend": "Stable",        // Optional: glucose trend
  "noise": "Clean",         // Optional: signal quality
  "device": "xDrip+",       // Optional: source device
  "notes": "After meal"     // Optional: reading notes
}
```

**Response:**
```json
{
  "success": true,
  "message": "Glucose reading saved successfully",
  "data": {
    "id": 123,
    "glucose": 120,
    "glucoseMmol": 6.7,
    "timestamp": "2023-12-07T10:30:00.000Z",
    "trend": "Stable",
    "timeAgo": "Just now",
    "isHigh": false,
    "isLow": false,
    "isInRange": true
  }
}
```

### GET /api/readings

Retrieves glucose readings with optional filtering (requires authentication).

**Query Parameters:**
- `limit` (1-100): Number of readings to return
- `since`: ISO8601 date for start range
- `until`: ISO8601 date for end range

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 10 glucose readings",
  "data": [
    {
      "id": 123,
      "glucose": 120,
      "glucoseMmol": 6.7,
      "timestamp": "2023-12-07T10:30:00.000Z",
      "trend": "Stable",
      "device": "xDrip+",
      "notes": "After meal",
      "timeAgo": "5 minutes ago",
      "isHigh": false,
      "isLow": false,
      "isInRange": true
    }
  ],
  "stats": {
    "count": 10,
    "average": 125.5,
    "min": 85,
    "max": 180,
    "range": {
      "low": 1,
      "normal": 8,
      "high": 1
    }
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Set up Supabase project and configure `.env`
4. Make your changes
5. Add tests for new functionality
6. Run `npm run test:system` to verify
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Complete Setup Guide](SUPABASE_SETUP.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/supabase-glucose-server/issues)
- 💬 [Discussions](https://github.com/yourusername/supabase-glucose-server/discussions)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) for the amazing backend-as-a-service platform
- [xDrip+](https://github.com/NightscoutFoundation/xDrip) team for the CGM app
- [Nightscout](https://nightscout.github.io/) community for diabetes tech innovation
- Express.js and Node.js communities for excellent documentation

## 📈 Roadmap

- [x] Supabase integration with PostgreSQL
- [x] Real-time WebSocket updates
- [x] Advanced analytics with SQL functions
- [x] JWT authentication and RLS
- [ ] Mobile app for data visualization
- [ ] Advanced alert system
- [ ] Data export functionality
- [ ] Integration with other CGM apps
- [ ] Multi-language support

---

**Made with ❤️ for the diabetes community**

*This server helps people with diabetes better manage their glucose data by providing a reliable, secure backend with real-time updates, powered by Supabase and modern web technologies.*
