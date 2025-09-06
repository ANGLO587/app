import express from 'express';
import {
  handleXDripUpload,
  getGlucoseReadings,
  getGlucoseStats,
  validateXDripData,
  validateReadingsQuery
} from '../controllers/glucoseController.js';

const router = express.Router();

/**
 * POST /api/xdrip
 * Handle glucose readings from xDrip+
 */
router.post('/xdrip', validateXDripData, handleXDripUpload);

/**
 * GET /api/readings
 * Retrieve glucose readings with optional filtering
 */
router.get('/readings', validateReadingsQuery, getGlucoseReadings);

/**
 * GET /api/stats/:userId?
 * Get glucose statistics for a user (optional userId)
 */
router.get('/stats/:userId?', getGlucoseStats);

/**
 * GET /api/latest
 * Get the most recent glucose reading
 */
router.get('/latest', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = userId ? { userId } : {};
    const latestReading = await Glucose
      .findOne(query)
      .sort({ timestamp: -1 })
      .select('-metadata.sourceIp -metadata.userAgent')
      .lean();

    if (!latestReading) {
      return res.status(404).json({
        success: false,
        message: 'No glucose readings found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Latest glucose reading retrieved',
      data: {
        id: latestReading._id,
        glucose: latestReading.glucose,
        glucoseMmol: Math.round((latestReading.glucose / 18.018) * 10) / 10,
        timestamp: latestReading.timestamp,
        trend: latestReading.trend,
        noise: latestReading.noise,
        device: latestReading.device,
        timeAgo: getTimeAgo(latestReading.timestamp),
        isHigh: latestReading.glucose > 180,
        isLow: latestReading.glucose < 70,
        isInRange: latestReading.glucose >= 70 && latestReading.glucose <= 180
      }
    });

  } catch (error) {
    console.error('Error retrieving latest glucose reading:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve latest glucose reading'
    });
  }
});

export default router;