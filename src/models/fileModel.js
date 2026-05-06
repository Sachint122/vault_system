const mongoose = require('mongoose');

/**
 * 1. Schema Definition
 *
 * - Always use: timestamps, strict, toJSON/toObject with virtuals.
 * - Apply field-level validation (required, enum, match).
 */
const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    type: {
      type: String,
      required: [true, 'File type is required'],
    },
    sha256: {
      type: String,
      required: [true, 'SHA-256 hash is required'],
      unique: true,
      index: true,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
      min: [1, 'Occurrence count cannot be less than 1'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
      select: false, // Security: Hide internal filesystem path from default queries
    },
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.path; // Double safety
        return ret;
      }
    },
    toObject: { 
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.path;
        return ret;
      }
    },
    strict: true,
  }
);

/**
 * 2. Indexes
 *
 * - Define all indexes here.
 * - Use unique indexes where needed.
 */
fileSchema.index({ sha256: 1 }, { unique: true });
fileSchema.index({ uploadDate: -1 });

/**
 * 3. Middleware (Hooks)
 */
fileSchema.pre('save', async function (next) {
  try {
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * 4. Instance Methods
 *
 * - Document-level behavior.
 */
fileSchema.methods.incrementCount = function () {
  this.occurrenceCount += 1;
  return this.save();
};

fileSchema.methods.decrementCount = function () {
  if (this.occurrenceCount > 1) {
    this.occurrenceCount -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

/**
 * 5. Static Methods
 *
 * - Collection-level operations.
 */
fileSchema.statics.findByHash = function (hash) {
  return this.findOne({ sha256: hash }).select('+path'); // Explicitly select path for server-side logic
};

fileSchema.statics.calculateTotalUniqueSize = async function () {
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
      },
    },
  ]);
  return result[0]?.totalSize || 0;
};

/**
 * 6. Virtuals
 *
 * - Computed properties.
 */
fileSchema.virtual('readableSize').get(function () {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

/**
 * 7. Query Helpers
 */
fileSchema.query.byType = function (type) {
  return this.where({ type: new RegExp(type, 'i') });
};

/**
 * Model Export
 */
const File = mongoose.model('File', fileSchema);

module.exports = File;
