# xDrip+ Configuration Guide

This guide will help you configure xDrip+ to send glucose readings to your Node.js server.

## 📋 Prerequisites

- xDrip+ app installed on your Android device
- Your Node.js server running and accessible
- Network connectivity between your device and server

## 🔧 Server Configuration

### 1. REST API Endpoint

Your server provides the following endpoint for xDrip+ uploads:

```
POST http://your-server-domain.com/api/xdrip
```

**Local Development:**
```
POST http://localhost:3000/api/xdrip
```

**Production Example:**
```
POST https://myglucoseserver.herokuapp.com/api/xdrip
```

### 2. Required Headers

xDrip+ should send the following headers:

```http
Content-Type: application/json
Accept: application/json
```

### 3. JSON Payload Structure

xDrip+ should send data in the following JSON format:

```json
{
  "glucose": 120,
  "timestamp": "2023-12-07T10:30:00.000Z",
  "trend": "Stable",
  "noise": "Clean",
  "device": "xDrip+",
  "rawValue": 118.5,
  "batteryLevel": 85,
  "signalStrength": 92
}
```

#### Required Fields:
- `glucose` (number): Glucose value in mg/dL (0-1000)

#### Optional Fields:
- `timestamp` (string): ISO 8601 formatted timestamp (defaults to current time)
- `trend` (string): One of "Rising", "Falling", "Stable", "Unknown" (defaults to "Unknown")
- `noise` (string): One of "Clean", "Light", "Medium", "Heavy" (defaults to "Clean")
- `device` (string): Device identifier (defaults to "xDrip+")
- `rawValue` (number): Raw sensor value if different from glucose
- `batteryLevel` (number): Battery percentage (0-100)
- `signalStrength` (number): Signal strength percentage (0-100)
- `userId` (string): MongoDB ObjectId for multi-user support

## 📱 xDrip+ Setup Instructions

### Step 1: Open xDrip+ Settings

1. Open the xDrip+ app on your Android device
2. Tap the hamburger menu (☰) in the top-left corner
3. Select **Settings**

### Step 2: Navigate to Cloud Upload Settings

1. In Settings, scroll down and tap **Cloud Upload**
2. Tap **REST API Upload**

### Step 3: Configure REST API Upload

1. **Enable REST API Upload**: Toggle this ON
2. **Base URL**: Enter your server's base URL
   ```
   http://your-server-domain.com/api/xdrip
   ```
   
   For local development:
   ```
   http://192.168.1.100:3000/api/xdrip
   ```
   
   > 💡 **Note**: Use your computer's local IP address, not `localhost` when testing locally

3. **HTTP Method**: Select **POST**

4. **Content Type**: Select **JSON**

### Step 4: Configure Upload Format

In the **Format** section, configure the JSON payload:

```json
{
  "glucose": %glucose,
  "timestamp": "%timestamp",
  "trend": "%trend",
  "noise": "%noise_level",
  "device": "xDrip+",
  "rawValue": %raw,
  "batteryLevel": %battery,
  "signalStrength": %signal
}
```

### Step 5: Set Upload Frequency

1. **Upload Interval**: Set to your preferred interval (e.g., 1 minute)
2. **Only when WiFi**: Toggle based on your preference
3. **Skip LAN uploads**: Toggle OFF to ensure uploads work

### Step 6: Test the Configuration

1. Tap **Test** to send a test reading
2. Check your server logs for incoming requests
3. Verify data appears in your MongoDB database

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused / Network Error

**Problem**: xDrip+ cannot connect to your server

**Solutions**:
- Verify your server is running and accessible
- Check firewall settings on your server
- Ensure the URL is correct (include `http://` or `https://`)
- For local testing, use your computer's IP address, not `localhost`

#### 2. 400 Bad Request Error

**Problem**: Server rejects the data format

**Solutions**:
- Verify the JSON format matches the expected structure
- Check that glucose values are numeric and within range (0-1000)
- Ensure timestamp format is ISO 8601 if provided
- Validate trend and noise values are from allowed enums

#### 3. 404 Not Found Error

**Problem**: Endpoint not found

**Solutions**:
- Verify the URL path is `/api/xdrip`
- Check that your server routes are properly configured
- Ensure the server is running on the correct port

#### 4. 500 Internal Server Error

**Problem**: Server error processing the request

**Solutions**:
- Check server logs for detailed error messages
- Verify MongoDB connection is working
- Ensure all required environment variables are set
- Check database permissions and connectivity

### Testing with curl

You can test your server endpoint manually using curl:

```bash
# Test the endpoint
curl -X POST http://localhost:3000/api/xdrip \
  -H "Content-Type: application/json" \
  -d '{
    "glucose": 120,
    "timestamp": "2023-12-07T10:30:00.000Z",
    "trend": "Stable",
    "noise": "Clean"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Glucose reading saved successfully",
  "data": {
    "id": "656f8a1b2c3d4e5f6789abcd",
    "glucose": 120,
    "timestamp": "2023-12-07T10:30:00.000Z",
    "trend": "Stable",
    "noise": "Clean",
    "device": "xDrip+",
    "timeAgo": "Just now"
  }
}
```

## 📊 Retrieving Data

### Get Latest Readings

```bash
curl http://localhost:3000/api/readings?limit=10
```

### Get Specific User's Data

```bash
curl http://localhost:3000/api/readings?userId=USER_ID&limit=20
```

### Get Statistics

```bash
curl http://localhost:3000/api/stats?hours=24
```

## 🔐 Security Considerations

### Production Deployment

1. **Use HTTPS**: Always use HTTPS in production
2. **Rate Limiting**: The server includes built-in rate limiting
3. **Input Validation**: All inputs are validated and sanitized
4. **Environment Variables**: Use secure environment variables for sensitive data

### Authentication (Future Enhancement)

For multi-user support, consider implementing:
- JWT token authentication
- User registration and login
- API key authentication for devices

## 📝 Server Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 201 | Created | Glucose reading saved successfully |
| 400 | Bad Request | Invalid data format or validation error |
| 409 | Conflict | Duplicate reading (if implemented) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server or database error |

## 🆘 Getting Help

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify your network connectivity
3. Test the endpoint manually with curl
4. Check the xDrip+ logs for upload attempts
5. Ensure your server environment is properly configured

## 📚 Additional Resources

- [xDrip+ Documentation](https://github.com/NightscoutFoundation/xDrip)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)