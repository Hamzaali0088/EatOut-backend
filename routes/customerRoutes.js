const express = require('express');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

// @route   GET /api/
// @desc    Simple customer API root
// @access  Public
router.get('/', (req, res) => {
  res.json({ message: 'Customer API is working' });
});

// @route   GET /api/menu
// @desc    Public menu for customers
// @access  Public
router.get('/menu', async (req, res, next) => {
  try {
    const [categories, items] = await Promise.all([
      Category.find({ isActive: true }).sort({ createdAt: 1 }),
      MenuItem.find({ available: true }).populate('category'),
    ]);

    const response = items.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      description: item.category?.description || '',
      price: item.price,
      category: item.category?.name || 'Uncategorized',
      tags: [], // placeholder; can be extended later
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
});

module.exports = router;


