# 🩸 xDrip+ Glucose Server

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)
/images/License.jpg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A modern, secure Node.js server built with Express and MongoDB for receiving and storing glucose readings from xDrip+ and other continuous glucose monitoring (CGM) applications.

## ✨ Features

- 🔐 **Secure API** with rate limiting, CORS, and input validation
- 📊 **Real-time glucose data** storage and retrieval
- 🏥 **xDrip+ integration** with comprehensive setup guide
- 📈 **Statistics and analytics** for glucose trends
- 🌐 **Multi-user support** with user isolation
- 🚀 **Production-ready** with comprehensive error handling
- 📱 **RESTful API** with modern JSON responses
- 🔍 **Comprehensive logging** and monitoring
- ⚡ **High performance** with optimized database queries

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- xDrip+ app on Android device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/xdrip-glucose-server.git
   cd xdrip-glucose-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:3000/health
   ```

## 📡 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/xdrip` | Receive glucose readings from xDrip+ |
| `GET` | `/api/readings` | Retrieve glucose readings with filtering |
| `GET` | `/api/latest` | Get the most recent glucose reading |
| `GET` | `/api/stats` | Get glucose statistics and analytics |
| `GET` | `/health` | Server health check |

### Example Usage

#### Send Glucose Reading (xDrip+)
```bash
curl -X POST http://localhost:3000/api/xdrip \
  -H "Content-Type: application/json" \
  -d '{
    "glucose": 120,
    "timestamp": "2023-12-07T10:30:00.000Z",
    "trend": "Stable",
    "noise": "Clean"
  }'
```

#### Get Latest Readings
```bash
curl "http://localhost:3000/api/readings?limit=10"
```

#### Get Statistics
```bash
curl "http://localhost:3000/api/stats?hours=24"
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

## 📱 xDrip+ Configuration

### Quick Setup

1. Open xDrip+ → Settings → Cloud Upload → REST API Upload
2. Enable REST API Upload
3. Set Base URL: `http://your-server:3000/api/xdrip`
4. Set Method: `POST`
5. Set Content Type: `JSON`

### Detailed Configuration

See [XDRIP_SETUP.md](XDRIP_SETUP.md) for comprehensive setup instructions, including:
- Complete configuration steps
- JSON payload format
- Troubleshooting guide
- Testing procedures

## 🗄️ Database Schema

### Glucose Reading Model

```javascript
{
  glucose: Number,        // Glucose value in mg/dL (required)
  timestamp: Date,        // Reading timestamp (default: now)
  trend: String,          // "Rising", "Falling", "Stable", "Unknown"
  noise: String,          // "Clean", "Light", "Medium", "Heavy"
  device: String,         // Source device (default: "xDrip+")
  userId: ObjectId,       // User reference for multi-user support
  metadata: {
    rawValue: Number,     // Raw sensor value
    batteryLevel: Number, // Device battery percentage
    signalStrength: Number, // Signal strength percentage
    sourceIp: String,     // Request IP address
    userAgent: String     // Request user agent
  }
}
```

### Indexes

Optimized indexes for performance:
- `timestamp` (descending)
- `userId + timestamp` (compound)
- `device + timestamp` (compound)

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | No | Generated | JWT signing secret |
| `CORS_ORIGIN` | No | `*` | Allowed CORS origins |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Rate limit per window |

### Example .env

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/glucose
JWT_SECRET=your-super-secret-jwt-key
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
heroku config:set MONGODB_URI="your-mongodb-uri"

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

```bash
# Build and run with Docker Compose
docker-compose up -d
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for various platforms.

## 📊 Monitoring & Analytics

### Health Monitoring

The server includes built-in health monitoring:

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

### Glucose Statistics

Get comprehensive glucose analytics:

```bash
curl "http://localhost:3000/api/stats?hours=24"
```

Includes:
- Average glucose levels
- Time in range percentages
- Min/max values
- Reading counts by range (low/normal/high)

## 🔐 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive data validation
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: Security headers and protections
- **Error Handling**: Secure error responses
- **Environment Isolation**: Separate configs per environment

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint
```

### Manual Testing

Test the API endpoints manually:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test xDrip+ endpoint
curl -X POST http://localhost:3000/api/xdrip \
  -H "Content-Type: application/json" \
  -d '{"glucose": 120}'

# Test readings endpoint
curl http://localhost:3000/api/readings
```

## 📚 API Documentation

### POST /api/xdrip

Accepts glucose readings from xDrip+ and other sources.

**Request Body:**
```json
{
  "glucose": 120,           // Required: glucose value (0-1000)
  "timestamp": "ISO8601",   // Optional: reading timestamp
  "trend": "Stable",        // Optional: glucose trend
  "noise": "Clean",         // Optional: signal quality
  "device": "xDrip+",       // Optional: source device
  "userId": "ObjectId"      // Optional: user identifier
}
```

**Response:**
```json
{
  "success": true,
  "message": "Glucose reading saved successfully",
  "data": {
    "id": "656f8a1b2c3d4e5f6789abcd",
    "glucose": 120,
    "timestamp": "2023-12-07T10:30:00.000Z",
    "trend": "Stable",
    "timeAgo": "Just now"
  }
}
```

### GET /api/readings

Retrieves glucose readings with optional filtering.

**Query Parameters:**
- `limit` (1-100): Number of readings to return
- `userId`: Filter by user ID
- `since`: ISO8601 date for start range
- `until`: ISO8601 date for end range

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 10 glucose readings",
  "data": [
    {
      "id": "656f8a1b2c3d4e5f6789abcd",
      "glucose": 120,
      "glucoseMmol": 6.7,
      "timestamp": "2023-12-07T10:30:00.000Z",
      "trend": "Stable",
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
    "max": 180
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style

- Use ESLint configuration provided
- Follow modern ES6+ syntax
- Write comprehensive JSDoc comments
- Include error handling for all async operations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Setup Guide](XDRIP_SETUP.md)
- 🚀 [Deployment Guide](DEPLOYMENT.md)
- 🐛 [Issue Tracker](https://github.com/yourusername/xdrip-glucose-server/issues)
- 💬 [Discussions](https://github.com/yourusername/xdrip-glucose-server/discussions)

## 🙏 Acknowledgments

- [xDrip+](https://github.com/NightscoutFoundation/xDrip) team for the amazing CGM app
- [Nightscout](https://nightscout.github.io/) community for diabetes tech innovation
- Express.js and MongoDB communities for excellent documentation

## 📈 Roadmap

- [ ] WebSocket support for real-time updates
- [ ] Advanced analytics and trend analysis
- [ ] Integration with other CGM apps
- [ ] Mobile app for data visualization
- [ ] Alert system for critical glucose levels
- [ ] Data export functionality
- [ ] Multi-language support

---

**Made with ❤️ for the diabetes community**

*This server helps people with diabetes better manage their glucose data by providing a reliable, secure backend for xDrip+ and other CGM applications.*