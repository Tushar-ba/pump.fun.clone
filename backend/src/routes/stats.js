const express = require('express');
const router = express.Router();
const { TokenDeployment, LiquidityPool } = require('../models');

/**
 * GET /api/stats/overview
 * Get overall statistics
 */
router.get('/overview', async (req, res) => {
  try {
    const { chainId } = req.query;
    
    const query = chainId ? { chainId: parseInt(chainId) } : {};

    const [tokenCount, poolCount, recentTokens, recentPools] = await Promise.all([
      TokenDeployment.countDocuments(query),
      LiquidityPool.countDocuments(query),
      TokenDeployment.find(query).sort({ createdAt: -1 }).limit(5),
      LiquidityPool.find(query).sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      success: true,
      data: {
        totalTokens: tokenCount,
        totalPools: poolCount,
        recentTokens,
        recentPools
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/tokens
 * Get token statistics
 */
router.get('/tokens', async (req, res) => {
  try {
    const { chainId, days = 30 } = req.query;
    
    const query = chainId ? { chainId: parseInt(chainId) } : {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    query.createdAt = { $gte: startDate };

    // Get daily counts
    const dailyStats = await TokenDeployment.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const total = await TokenDeployment.countDocuments(query);

    res.json({
      success: true,
      data: {
        total,
        daily: dailyStats,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Get token stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/pools
 * Get liquidity pool statistics
 */
router.get('/pools', async (req, res) => {
  try {
    const { chainId, days = 30 } = req.query;
    
    const query = chainId ? { chainId: parseInt(chainId) } : {};
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    query.createdAt = { $gte: startDate };

    // Get daily counts
    const dailyStats = await LiquidityPool.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const total = await LiquidityPool.countDocuments(query);

    res.json({
      success: true,
      data: {
        total,
        daily: dailyStats,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    console.error('Get pool stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats/recent-activity
 * Get recent activity across tokens and pools
 */
router.get('/recent-activity', async (req, res) => {
  try {
    const { limit = 20, chainId } = req.query;
    
    const query = chainId ? { chainId: parseInt(chainId) } : {};

    const [tokens, pools] = await Promise.all([
      TokenDeployment.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit)),
      LiquidityPool.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
    ]);

    // Combine and sort by date
    const activity = [
      ...tokens.map(t => ({ 
        type: 'token_created', 
        data: t, 
        timestamp: t.createdAt 
      })),
      ...pools.map(p => ({ 
        type: 'liquidity_added', 
        data: p, 
        timestamp: p.createdAt 
      }))
    ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
