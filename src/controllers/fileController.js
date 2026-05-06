const fs = require('fs');
const crypto = require('crypto');
const File = require('../models/fileModel');
const { asyncHandler } = require('devil-backend-nodejs');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const constants = require('../config/constants');

/**
 * Computes SHA-256 hash of a file efficiently using streams
 * Optimized for memory usage with large files
 */
const computeHash = (filePath) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error('File not found for hash computation'));
    }
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

/**
 * Safely unlinks a file without crashing the server
 */
const safeUnlink = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error(`[Cleanup Error] Failed to delete file at ${filePath}:`, err.message);
    }
  }
};

// ======================
// @route   POST /api/files
// @desc    Upload file with SHA-256 deduplication
// @access  Public
// ======================
exports.uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(constants.STATUS.BAD_REQUEST, 'No file provided in the request');
  }

  const { path: filePath, originalname, size, mimetype } = req.file;

  try {
    // 1. Compute SHA-256 Hash
    const hash = await computeHash(filePath);

    // 2. Performance: Use static method for deduplication check
    const existingFile = await File.findByHash(hash);

    if (existingFile) {
      // Logic: Duplicate detected - increment occurrence count
      await existingFile.incrementCount();

      // Optimize: Remove redundant physical storage immediately
      safeUnlink(filePath);

      return res.status(constants.STATUS.OK).json(
        new ApiResponse(constants.STATUS.OK, {
          message: 'Duplicate file detected. Occurrence count updated successfully.',
          file: existingFile,
        })
      );
    }

    // 3. New File: Create database record
    const newFile = await File.create({
      name: originalname,
      size: size,
      type: mimetype,
      sha256: hash,
      path: filePath,
      occurrenceCount: 1,
    });

    res.status(constants.STATUS.CREATED).json(
      new ApiResponse(constants.STATUS.CREATED, {
        message: 'File uploaded and stored successfully.',
        file: newFile,
      })
    );
  } catch (error) {
    // Security: Ensure temporary/uploaded file is cleaned up on any error
    safeUnlink(filePath);
    throw error;
  }
});

const formatSize = require('../utils/formatSize');

// ======================
// @route   GET /api/files
// @desc    Get all files metadata and storage statistics
// @access  Public
// ======================
exports.getAllFiles = asyncHandler(async (req, res) => {
  // Optimization: Select only required fields, lean query for performance
  const [files, totalOccupiedSize] = await Promise.all([
    File.find().sort({ createdAt: -1 }),
    File.calculateTotalUniqueSize()
  ]);

  // Transform files to match the specific format (Renaming ID, removing internal fields)
  // Note: Model toJSON/toObject handle most of this, but explicit map ensures structure
  const serializedFiles = files.map(file => file.toJSON());

  res.status(constants.STATUS.OK).json(
    new ApiResponse(constants.STATUS.OK, {
      message: 'File metadata and storage statistics retrieved successfully.',
      totalFiles: files.length,
      totalOccupiedSize,
      readableTotalOccupiedSize: formatSize(totalOccupiedSize),
      files: serializedFiles,
    })
  );
});

// ======================
// @route   DELETE /api/files/:id
// @desc    Delete file or decrement occurrence count (Production Safe)
// @access  Public
// ======================
exports.deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validation: Check MongoID format (Protected by global CastError handler, but explicit is better for UX)
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(constants.STATUS.BAD_REQUEST, 'Invalid file identification format.');
  }

  // Security: Explicitly select path for physical deletion logic
  const file = await File.findById(id).select('+path');

  if (!file) {
    throw new ApiError(constants.STATUS.NOT_FOUND, 'The requested file could not be found.');
  }

  if (file.occurrenceCount > 1) {
    // Operational Consistency: Decrement count only
    await file.decrementCount();

    return res.status(constants.STATUS.OK).json(
      new ApiResponse(constants.STATUS.OK, 'File occurrence decremented successfully.')
    );
  } else {
    // Transactional Safety: Attempt physical deletion before database removal
    try {
      // Graceful handling of missing files (prevent crash/error if already gone)
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      } else {
        console.warn(`[System] File already missing from disk during deletion: ${file.path}`);
      }
    } catch (err) {
      console.error(`[Critical] Disk I/O Failure during file deletion:`, err.message);
      // In production, we might still delete the DB record to avoid 'ghost' entries, 
      // but here we follow strict error reporting.
      throw new ApiError(constants.STATUS.INTERNAL_SERVER, 'Failed to remove physical file from storage.');
    }

    // Finalize state: Remove database document
    await File.findByIdAndDelete(id);

    res.status(constants.STATUS.OK).json(
      new ApiResponse(constants.STATUS.OK, 'File permanently deleted successfully.')
    );
  }
});
