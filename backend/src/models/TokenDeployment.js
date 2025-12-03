const mongoose = require('mongoose');

const tokenDeploymentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  address: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  owner: {
    type: String,
    required: true,
    lowercase: true
  },
  initialSupply: {
    type: String,
    required: true
  },
  maxSupply: {
    type: String,
    default: '0'
  },
  decimals: {
    type: Number,
    default: 18
  },
  mintable: {
    type: Boolean,
    default: false
  },
  burnable: {
    type: Boolean,
    default: true
  },
  buyTax: {
    type: Number,
    default: 0,
    min: 0,
    max: 25
  },
  sellTax: {
    type: Number,
    default: 0,
    min: 0,
    max: 25
  },
  taxReceiver: {
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
  },
  verified: {
    type: Boolean,
    default: false
  },
  sourceCode: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
tokenDeploymentSchema.index({ owner: 1 });
tokenDeploymentSchema.index({ chainId: 1 });
tokenDeploymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TokenDeployment', tokenDeploymentSchema);
