const express = require('express');
const router = express.Router();
const { 
  getNonce, 
  verifyAdmin, 
  requireAdmin, 
  checkAdminStatus, 
  logoutAdmin,
  ADMIN_ADDRESSES 
} = require('../middleware/adminAuth');
const { TokenDeployment, LiquidityPool } = require('../models');

// Public routes
router.get('/check', checkAdminStatus);
router.get('/nonce', getNonce);
router.post('/verify', verifyAdmin);
router.post('/logout', logoutAdmin);

// Protected admin routes
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const [
      totalTokens,
      totalPools,
      tokensToday,
      poolsToday,
      recentTokens,
      recentPools,
      topCreators
    ] = await Promise.all([
      TokenDeployment.countDocuments(),
      LiquidityPool.countDocuments(),
      TokenDeployment.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      LiquidityPool.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      TokenDeployment.find().sort({ createdAt: -1 }).limit(10),
      LiquidityPool.find().sort({ createdAt: -1 }).limit(10),
      TokenDeployment.aggregate([
        { $group: { _id: '$owner', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalTokens,
          totalPools,
          tokensToday,
          poolsToday,
          adminCount: ADMIN_ADDRESSES.length
        },
        recentTokens,
        recentPools,
        topCreators
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all tokens with pagination and filtering
router.get('/tokens', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, chainId, owner } = req.query;
    
    const query = {};
    if (chainId) query.chainId = parseInt(chainId);
    if (owner) query.owner = owner.toLowerCase();
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { symbol: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const [tokens, total] = await Promise.all([
      TokenDeployment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      TokenDeployment.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: tokens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin tokens error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all pools with pagination
router.get('/pools', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, chainId } = req.query;
    
    const query = {};
    if (chainId) query.chainId = parseInt(chainId);

    const [pools, total] = await Promise.all([
      LiquidityPool.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      LiquidityPool.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: pools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin pools error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get analytics data
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [tokensByDay, poolsByDay, tokensByChain, poolsByDex] = await Promise.all([
      TokenDeployment.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      LiquidityPool.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      TokenDeployment.aggregate([
        { $group: { _id: '$chainId', count: { $sum: 1 } } }
      ]),
      LiquidityPool.aggregate([
        { $group: { _id: '$dexName', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        tokensByDay,
        poolsByDay,
        tokensByChain,
        poolsByDex,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a token record (admin only)
router.delete('/tokens/:address', requireAdmin, async (req, res) => {
  try {
    const { address } = req.params;
    const result = await TokenDeployment.findOneAndDelete({ 
      address: address.toLowerCase() 
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    res.json({ success: true, message: 'Token record deleted' });
  } catch (error) {
    console.error('Delete token error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a pool record (admin only)
router.delete('/pools/:address', requireAdmin, async (req, res) => {
  try {
    const { address } = req.params;
    const result = await LiquidityPool.findOneAndDelete({ 
      pairAddress: address.toLowerCase() 
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Pool not found' });
    }

    res.json({ success: true, message: 'Pool record deleted' });
  } catch (error) {
    console.error('Delete pool error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
