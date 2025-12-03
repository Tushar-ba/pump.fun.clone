const mongoose = require('mongoose');

const liquidityPoolSchema = new mongoose.Schema({
  tokenA: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    }
  },
  tokenB: {
    address: {
      type: String,
      required: true,
      lowercase: true
    },
    symbol: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    }
  },
  pairAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  lpTokenAmount: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true,
    lowercase: true
  },
  dexName: {
    type: String,
    default: 'Uniswap V2'
  },
  routerAddress: {
    type: String,
    lowercase: true
  },
  chainId: {
    type: Number,
    required: true
  },
  transactionHash: {
    type: String,
    lowercase: true
  },
  blockNumber: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for faster queries
liquidityPoolSchema.index({ provider: 1 });
liquidityPoolSchema.index({ 'tokenA.address': 1 });
liquidityPoolSchema.index({ 'tokenB.address': 1 });
liquidityPoolSchema.index({ pairAddress: 1 });
liquidityPoolSchema.index({ chainId: 1 });
liquidityPoolSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LiquidityPool', liquidityPoolSchema);
