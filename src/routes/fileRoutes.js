const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const upload = require('../middleware/uploadMiddleware');

// ======================
// Routes
// ======================

router.post('/', upload.single('file'), fileController.uploadFile);
router.get('/', fileController.getAllFiles);
router.delete('/:id', fileController.deleteFile);

module.exports = router;
