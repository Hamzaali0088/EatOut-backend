const express = require('express');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

const router = express.Router();

// Helper to normalize MongoDB documents to frontend shape
const mapCategory = (category) => ({
  id: category._id.toString(),
  name: category.name,
  description: category.description || '',
  createdAt: category.createdAt.toISOString().slice(0, 10),
});

const mapMenuItem = (item) => ({
  id: item._id.toString(),
  name: item.name,
  price: item.price,
  categoryId: item.category.toString(),
  available: item.available,
});

const mapUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});

// @route   GET /api/admin/menu
// @desc    Get all categories and menu items
// @access  Public (protect with auth middleware later)
router.get('/menu', async (req, res, next) => {
  try {
    const [categories, items] = await Promise.all([
      Category.find({}).sort({ createdAt: 1 }),
      MenuItem.find({}),
    ]);

    res.json({
      categories: categories.map(mapCategory),
      items: items.map(mapMenuItem),
    });
  } catch (error) {
    next(error);
  }
});

// CATEGORY ROUTES

// @route   POST /api/admin/categories
// @desc    Create a new category
// @access  Public (protect with auth middleware later)
router.post('/categories', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || '',
    });

    res.status(201).json(mapCategory(category));
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update a category
// @access  Public (protect with auth middleware later)
router.put('/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (typeof isActive === 'boolean') category.isActive = isActive;

    await category.save();

    res.json(mapCategory(category));
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete a category and its items
// @access  Public (protect with auth middleware later)
router.delete('/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Promise.all([
      Category.deleteOne({ _id: id }),
      MenuItem.deleteMany({ category: id }),
    ]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// MENU ITEM ROUTES

// @route   POST /api/admin/items
// @desc    Create a new menu item
// @access  Public (protect with auth middleware later)
router.post('/items', async (req, res, next) => {
  try {
    const { name, price, categoryId } = req.body;

    if (!name || !name.trim() || price === undefined || !categoryId) {
      return res.status(400).json({ message: 'Name, price and categoryId are required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Invalid categoryId' });
    }

    const item = await MenuItem.create({
      name: name.trim(),
      price,
      category: categoryId,
    });

    res.status(201).json(mapMenuItem(item));
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/items/:id
// @desc    Update a menu item (including availability)
// @access  Public (protect with auth middleware later)
router.put('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, categoryId, available } = req.body;

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (name !== undefined) item.name = name.trim();
    if (price !== undefined) item.price = price;
    if (typeof available === 'boolean') item.available = available;

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Invalid categoryId' });
      }
      item.category = categoryId;
    }

    await item.save();

    res.json(mapMenuItem(item));
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/items/:id
// @desc    Delete a menu item
// @access  Public (protect with auth middleware later)
router.delete('/items/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await MenuItem.deleteOne({ _id: id });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// USER MANAGEMENT ROUTES

// @route   GET /api/admin/users
// @desc    List all users
// @access  Public (protect with auth middleware later)
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users.map(mapUser));
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user (admin, employee, or customer)
// @access  Public (protect with auth middleware later)
router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (role && !['customer', 'employee', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'customer',
    });

    res.status(201).json(mapUser(user));
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user
// @access  Public (protect with auth middleware later)
router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.toLowerCase().trim();
    if (role !== undefined) {
      if (!['customer', 'employee', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }
    if (password) {
      user.password = password; // will be hashed by pre-save hook
    }

    await user.save();

    res.json(mapUser(user));
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Public (protect with auth middleware later)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.deleteOne({ _id: id });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;


