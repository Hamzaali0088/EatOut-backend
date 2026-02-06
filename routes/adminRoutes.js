const express = require('express');

const router = express.Router();

// @route   GET /api/admin
// @desc    Simple admin API root
// @access  Public (protect with auth middleware later)
router.get('/', (req, res) => {
  res.json({ message: 'Admin API is working' });
});

module.exports = router;

