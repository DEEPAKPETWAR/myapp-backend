const express = require('express');
const router = express.Router();
const Transaction = require('../model/transaction');

// GET /api/summary — overall summary
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) dateFilter.date.$lte = new Date(endDate + 'T23:59:59');
    }

    const [incomeAgg, expenseAgg, categoryBreakdown, monthlyTrend] = await Promise.all([
      // Total income
      Transaction.aggregate([
        { $match: { type: 'income', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Total expenses
      Transaction.aggregate([
        { $match: { type: 'expense', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),

      // Category breakdown
      Transaction.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { type: '$type', category: '$category' },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Monthly trend (last 6 months)
      Transaction.aggregate([
        {
          $match: {
            date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const totalIncome = incomeAgg[0]?.total || 0;
    const totalExpense = expenseAgg[0]?.total || 0;
    const balance = totalIncome - totalExpense;

    // Structure category breakdown
    const incomeByCategory = {};
    const expenseByCategory = {};
    categoryBreakdown.forEach((item) => {
      if (item._id.type === 'income') {
        incomeByCategory[item._id.category] = { total: item.total, count: item.count };
      } else {
        expenseByCategory[item._id.category] = { total: item.total, count: item.count };
      }
    });

    // Structure monthly trend
    const months = {};
    monthlyTrend.forEach((item) => {
      const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      months[key][item._id.type] = item.total;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalIncome,
          totalExpense,
          balance,
          incomeCount: incomeAgg[0]?.count || 0,
          expenseCount: expenseAgg[0]?.count || 0,
        },
        incomeByCategory,
        expenseByCategory,
        monthlyTrend: Object.entries(months)
          .sort()
          .map(([month, values]) => ({ month, ...values })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/summary/recent — recent transactions
router.get('/recent', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort('-date').limit(10);
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;