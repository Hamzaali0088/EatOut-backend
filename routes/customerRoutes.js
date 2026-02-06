const express = require('express');

const router = express.Router();

// @route   GET /api/
// @desc    Simple customer API root
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Customer API is working' });
});

module.exports = router;

