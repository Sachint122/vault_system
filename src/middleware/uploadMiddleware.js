const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');
const constants = require('../config/constants');

// Configure storage with custom naming strategy
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Keep original extension but sanitize filename
    const ext = path.extname(file.originalname);
    cb(null, `vault-${uniqueSuffix}${ext}`);
  },
});

/**
 * File Filter to prevent unsafe uploads
 */
const fileFilter = (req, file, cb) => {
  // Allowed extensions/types
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'application/zip', 'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(constants.STATUS.BAD_REQUEST, `Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Optimized: 50MB limit per file
    files: 1, // Limit to 1 file per request
  },
});

module.exports = upload;
