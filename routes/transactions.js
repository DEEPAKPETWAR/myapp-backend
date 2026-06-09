const express = require('express');
const router = express.Router();
const Transaction = require('../model/transaction');

// Valid categories
const INCOME_CATEGORIES = [
  'salary',
  'business',
  'freelance',
  'investment',
  'bonus',
  'other',
];
const EXPENSE_CATEGORIES = [
  'food',
  'shopping',
  'fuel',
  'bills',
  'transport',
  'health',
  'education',
  'housing',
  'entertainment',
  'healthcare',
  'utilities',
  'other',
];

// GET /api/transactions — get all transactions with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 20, sort = '-date' } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/transactions/:id — get single transaction
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/transactions — create new transaction
router.post('/', async (req, res) => {
  try {
    const { type, category, amount, description, date, note } = req.body;

    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be income or expense' });
    }

    // Validate category
    const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category for ${type}. Valid: ${validCategories.join(', ')}`,
      });
    }

    const transaction = new Transaction({
      type,
      category,
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
      note,
    });

    await transaction.save();
    res.status(201).json({ success: true, data: transaction, message: 'Transaction added successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/transactions/:id — update transaction
router.put('/:id', async (req, res) => {
  try {
    const { type, category, amount, description, date, note } = req.body;

    const existing = await Transaction.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const resolvedType = type || existing.type;
    const validCategories = resolvedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category for ${resolvedType}. Valid: ${validCategories.join(', ')}`,
      });
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      { type, category, amount: amount ? parseFloat(amount) : undefined, description, date, note },
      { new: true, runValidators: true, omitUndefined: true }
    );

    res.json({ success: true, data: updated, message: 'Transaction updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/transactions/:id — delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;