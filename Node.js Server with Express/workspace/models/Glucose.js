import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Glucose Reading Schema
 * Stores glucose readings from xDrip+ and other sources
 */
const glucoseSchema = new Schema({
  // Core glucose data
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
    index: true // Index for efficient time-based queries
  },
  
  glucose: {
    type: Number,
    required: [true, 'Glucose value is required'],
    min: [0, 'Glucose value cannot be negative'],
    max: [1000, 'Glucose value seems too high (max: 1000)'],
    validate: {
      validator: function(value) {
        return !isNaN(value) && isFinite(value);
      },
      message: 'Glucose value must be a valid number'
    }
  },
  
  // Trend information
  trend: {
    type: String,
    enum: {
      values: ['Rising', 'Falling', 'Stable', 'Unknown'],
      message: 'Trend must be one of: Rising, Falling, Stable, Unknown'
    },
    default: 'Unknown'
  },
  
  // Data quality indicator
  noise: {
    type: String,
    enum: {
      values: ['Clean', 'Light', 'Medium', 'Heavy'],
      message: 'Noise must be one of: Clean, Light, Medium, Heavy'
    },
    default: 'Clean'
  },
  
  // Source device/app
  device: {
    type: String,
    default: 'xDrip+',
    maxlength: [100, 'Device name cannot exceed 100 characters'],
    trim: true
  },
  
  // User reference for multi-user support
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true // Index for efficient user-based queries
  },
  
  // Additional metadata
  metadata: {
    // Raw sensor value (if different from glucose)
    rawValue: {
      type: Number,
      min: 0
    },
    
    // Calibration information
    calibration: {
      slope: Number,
      intercept: Number,
      scale: Number
    },
    
    // Battery level of the transmitter/sensor
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Signal strength
    signalStrength: {
      type: Number,
      min: 0,
      max: 100
    },
    
    // Source IP for tracking
    sourceIp: {
      type: String,
      maxlength: 45 // IPv6 max length
    },
    
    // User agent string
    userAgent: {
      type: String,
      maxlength: 500
    }
  }
}, {
  // Schema options
  timestamps: true, // Adds createdAt and updatedAt
  versionKey: false, // Removes __v field
  
  // Transform output
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  
  toObject: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  }
});

// Compound indexes for efficient queries
glucoseSchema.index({ userId: 1, timestamp: -1 }); // User readings by time (descending)
glucoseSchema.index({ timestamp: -1, glucose: 1 }); // Time and glucose value
glucoseSchema.index({ device: 1, timestamp: -1 }); // Device readings by time

// Virtual for glucose in different units
glucoseSchema.virtual('glucoseMmol').get(function() {
  // Convert mg/dL to mmol/L (divide by 18.018)
  return Math.round((this.glucose / 18.018) * 10) / 10;
});

// Instance methods
glucoseSchema.methods.isHigh = function(threshold = 180) {
  return this.glucose > threshold;
};

glucoseSchema.methods.isLow = function(threshold = 70) {
  return this.glucose < threshold;
};

glucoseSchema.methods.isInRange = function(low = 70, high = 180) {
  return this.glucose >= low && this.glucose <= high;
};

glucoseSchema.methods.getTimeAgo = function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

// Static methods
glucoseSchema.statics.getLatestByUser = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

glucoseSchema.statics.getAverageGlucose = function(userId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        userId: userId,
        timestamp: { $gte: since }
      }
    },
    {
      $group: {
        _id: null,
        averageGlucose: { $avg: '$glucose' },
        count: { $sum: 1 },
        minGlucose: { $min: '$glucose' },
        maxGlucose: { $max: '$glucose' }
      }
    }
  ]);
};

glucoseSchema.statics.getReadingsInRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: 1 }).exec();
};

// Pre-save middleware
glucoseSchema.pre('save', function(next) {
  // Ensure timestamp is not in the future
  if (this.timestamp > new Date()) {
    this.timestamp = new Date();
  }
  
  // Round glucose to 1 decimal place
  if (this.glucose) {
    this.glucose = Math.round(this.glucose * 10) / 10;
  }
  
  next();
});

// Post-save middleware for logging
glucoseSchema.post('save', function(doc) {
  console.log(`📊 New glucose reading saved: ${doc.glucose} mg/dL at ${doc.timestamp}`);
});

// Create and export the model
const Glucose = model('Glucose', glucoseSchema);

export default Glucose;