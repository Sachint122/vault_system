const express = require('express');
const router = express.Router();

// Import all routes
const authRoutes = require('./authRoutes');
const fileRoutes = require('./fileRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/files', fileRoutes);



module.exports = router;
