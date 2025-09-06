import { body, validationResult, query } from 'express-validator';
import Glucose from '../models/Glucose.js';

/**
 * Helper function to calculate time ago
 */
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

/**
 * Validation rules for xDrip+ POST requests
 */
export const validateXDripData = [
  body('glucose')
    .isNumeric()
    .withMessage('Glucose must be a number')
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Glucose must be between 0 and 1000'),
  
  body('timestamp')
    .optional()
    .isISO8601()
    .withMessage('Timestamp must be a valid ISO 8601 date')
    .toDate(),
  
  body('trend')
    .optional()
    .isIn(['Rising', 'Falling', 'Stable', 'Unknown'])
    .withMessage('Trend must be one of: Rising, Falling, Stable, Unknown'),
  
  body('noise')
    .optional()
    .isIn(['Clean', 'Light', 'Medium', 'Heavy'])
    .withMessage('Noise must be one of: Clean, Light, Medium, Heavy'),
  
  body('device')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Device name must be a string with max 100 characters'),
  
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('UserId must be a valid MongoDB ObjectId')
];

/**
 * Validation rules for GET requests
 */
export const validateReadingsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('UserId must be a valid MongoDB ObjectId'),
  
  query('since')
    .optional()
    .isISO8601()
    .withMessage('Since must be a valid ISO 8601 date')
    .toDate(),
  
  query('until')
    .optional()
    .isISO8601()
    .withMessage('Until must be a valid ISO 8601 date')
    .toDate()
];

/**
 * Handle POST requests from xDrip+
 * Validates data, saves to MongoDB, and returns JSON response
 */
export const handleXDripUpload = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid data provided',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }

    // Extract data from request
    const {
      glucose,
      timestamp = new Date(),
      trend = 'Unknown',
      noise = 'Clean',
      device = 'xDrip+',
      userId
    } = req.body;

    // Create metadata object
    const metadata = {
      sourceIp: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Add optional metadata from request
    if (req.body.rawValue !== undefined) {
      metadata.rawValue = parseFloat(req.body.rawValue);
    }
    
    if (req.body.batteryLevel !== undefined) {
      metadata.batteryLevel = parseInt(req.body.batteryLevel, 10);
    }
    
    if (req.body.signalStrength !== undefined) {
      metadata.signalStrength = parseInt(req.body.signalStrength, 10);
    }

    // Create new glucose reading
    const glucoseReading = new Glucose({
      glucose: parseFloat(glucose),
      timestamp: new Date(timestamp),
      trend,
      noise,
      device,
      userId,
      metadata
    });

    // Save to database
    const savedReading = await glucoseReading.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Glucose reading saved successfully',
      data: {
        id: savedReading._id,
        glucose: savedReading.glucose,
        timestamp: savedReading.timestamp,
        trend: savedReading.trend,
        noise: savedReading.noise,
        device: savedReading.device,
        timeAgo: savedReading.getTimeAgo()
      }
    });

  } catch (error) {
    console.error('Error saving glucose reading:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Database Validation Error',
        message: 'Data does not meet database requirements',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Entry',
        message: 'A reading with this data already exists'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to save glucose reading',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
};

/**
 * Handle GET requests to retrieve glucose readings
 * Returns the latest readings sorted by timestamp
 */
export const getGlucoseReadings = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value
        }))
      });
    }

    // Extract query parameters with defaults
    const {
      limit = 10,
      userId,
      since,
      until
    } = req.query;

    // Build query object
    const query = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (since || until) {
      query.timestamp = {};
      if (since) query.timestamp.$gte = new Date(since);
      if (until) query.timestamp.$lte = new Date(until);
    }

    // Execute query
    const readings = await Glucose
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .select('-metadata.sourceIp -metadata.userAgent') // Exclude sensitive data
      .lean(); // Return plain objects for better performance

    // Calculate statistics
    const stats = {
      count: readings.length,
      latest: readings[0]?.timestamp || null,
      oldest: readings[readings.length - 1]?.timestamp || null
    };

    if (readings.length > 0) {
      const glucoseValues = readings.map(r => r.glucose);
      stats.average = Math.round((glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length) * 10) / 10;
      stats.min = Math.min(...glucoseValues);
      stats.max = Math.max(...glucoseValues);
      stats.range = {
        low: glucoseValues.filter(g => g < 70).length,
        normal: glucoseValues.filter(g => g >= 70 && g <= 180).length,
        high: glucoseValues.filter(g => g > 180).length
      };
    }

    // Return response
    res.status(200).json({
      success: true,
      message: `Retrieved ${readings.length} glucose reading${readings.length !== 1 ? 's' : ''}`,
      data: readings.map(reading => ({
        id: reading._id,
        glucose: reading.glucose,
        glucoseMmol: Math.round((reading.glucose / 18.018) * 10) / 10,
        timestamp: reading.timestamp,
        trend: reading.trend,
        noise: reading.noise,
        device: reading.device,
        timeAgo: getTimeAgo(reading.timestamp),
        isHigh: reading.glucose > 180,
        isLow: reading.glucose < 70,
        isInRange: reading.glucose >= 70 && reading.glucose <= 180
      })),
      stats,
      query: {
        limit: parseInt(limit, 10),
        userId: userId || null,
        since: since || null,
        until: until || null
      }
    });

  } catch (error) {
    console.error('Error retrieving glucose readings:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve glucose readings',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
};

/**
 * Get glucose statistics for a user
 */
export const getGlucoseStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { hours = 24 } = req.query;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await Glucose.aggregate([
      {
        $match: {
          ...(userId && { userId: mongoose.Types.ObjectId(userId) }),
          timestamp: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          averageGlucose: { $avg: '$glucose' },
          minGlucose: { $min: '$glucose' },
          maxGlucose: { $max: '$glucose' },
          lowReadings: {
            $sum: { $cond: [{ $lt: ['$glucose', 70] }, 1, 0] }
          },
          normalReadings: {
            $sum: { $cond: [{ $and: [{ $gte: ['$glucose', 70] }, { $lte: ['$glucose', 180] }] }, 1, 0] }
          },
          highReadings: {
            $sum: { $cond: [{ $gt: ['$glucose', 180] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      count: 0,
      averageGlucose: 0,
      minGlucose: 0,
      maxGlucose: 0,
      lowReadings: 0,
      normalReadings: 0,
      highReadings: 0
    };

    res.status(200).json({
      success: true,
      message: `Statistics for the last ${hours} hours`,
      data: {
        ...result,
        averageGlucose: Math.round(result.averageGlucose * 10) / 10,
        timeInRange: {
          low: result.count > 0 ? Math.round((result.lowReadings / result.count) * 100) : 0,
          normal: result.count > 0 ? Math.round((result.normalReadings / result.count) * 100) : 0,
          high: result.count > 0 ? Math.round((result.highReadings / result.count) * 100) : 0
        },
        period: {
          hours: parseInt(hours, 10),
          since: since,
          until: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving glucose statistics:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve glucose statistics',
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
};

export default {
  handleXDripUpload,
  getGlucoseReadings,
  getGlucoseStats,
  validateXDripData,
  validateReadingsQuery
};