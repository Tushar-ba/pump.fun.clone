const express = require('express');
const router = express.Router();
const { LiquidityPool } = require('../models');

/**
 * POST /api/liquidity/track
 * Track a liquidity pool creation
 */
router.post('/track', async (req, res) => {
  try {
    const {
      tokenA,
      tokenB,
      pairAddress,
      lpTokenAmount,
      provider,
      dexName,
      routerAddress,
      chainId,
      transactionHash,
      blockNumber
    } = req.body;

    // Validation
    if (!tokenA || !tokenB || !pairAddress || !provider || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'TokenA, TokenB, pairAddress, provider, and chainId are required'
      });
    }

    // Create record
    const pool = await LiquidityPool.create({
      tokenA: {
        address: tokenA.address.toLowerCase(),
        symbol: tokenA.symbol,
        amount: tokenA.amount.toString()
      },
      tokenB: {
        address: tokenB.address.toLowerCase(),
        symbol: tokenB.symbol,
        amount: tokenB.amount.toString()
      },
      pairAddress: pairAddress.toLowerCase(),
      lpTokenAmount: (lpTokenAmount || '0').toString(),
      provider: provider.toLowerCase(),
      dexName: dexName || 'Uniswap V2',
      routerAddress: routerAddress?.toLowerCase(),
      chainId,
      transactionHash: transactionHash?.toLowerCase(),
      blockNumber
    });

    res.status(201).json({
      success: true,
      data: pool
    });
  } catch (error) {
    console.error('Track liquidity error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/liquidity/pools
 * Get all liquidity pools (with pagination)
 */
router.get('/pools', async (req, res) => {
  try {
    const { page = 1, limit = 20, provider, chainId, token } = req.query;
    
    const query = {};
    if (provider) query.provider = provider.toLowerCase();
    if (chainId) query.chainId = parseInt(chainId);
    if (token) {
      const tokenLower = token.toLowerCase();
      query.$or = [
        { 'tokenA.address': tokenLower },
        { 'tokenB.address': tokenLower }
      ];
    }

    const pools = await LiquidityPool.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await LiquidityPool.countDocuments(query);

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
    console.error('Get pools error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/liquidity/pools/:pairAddress
 * Get a specific liquidity pool
 */
router.get('/pools/:pairAddress', async (req, res) => {
  try {
    const { pairAddress } = req.params;
    
    const pool = await LiquidityPool.findOne({ 
      pairAddress: pairAddress.toLowerCase() 
    });

    if (!pool) {
      return res.status(404).json({
        success: false,
        error: 'Pool not found'
      });
    }

    res.json({
      success: true,
      data: pool
    });
  } catch (error) {
    console.error('Get pool error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
