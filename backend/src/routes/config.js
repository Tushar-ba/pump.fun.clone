const express = require('express');
const router = express.Router();
const { CONTRACTS, getContracts, getSupportedChainIds, DEFAULT_CHAIN_ID } = require('../config/contracts');

// Get all supported chains
router.get('/chains', (req, res) => {
  try {
    const chains = getSupportedChainIds().map(chainId => {
      const config = getContracts(chainId);
      return {
        chainId,
        name: config.name,
        currency: config.currency,
        explorer: config.explorer,
        dexName: config.dexName
      };
    });
    
    res.json({
      success: true,
      chains,
      defaultChainId: DEFAULT_CHAIN_ID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get contract addresses for a specific chain
router.get('/contracts/:chainId', (req, res) => {
  try {
    const chainId = parseInt(req.params.chainId);
    const contracts = getContracts(chainId);
    
    if (!contracts) {
      return res.status(404).json({
        success: false,
        error: `Chain ID ${chainId} not supported`
      });
    }
    
    res.json({
      success: true,
      chainId,
      contracts: {
        router: contracts.router,
        factory: contracts.factory,
        liquidityHelper: contracts.liquidityHelper || null,
        mockUSDT: contracts.mockUSDT || null
      },
      network: {
        name: contracts.name,
        currency: contracts.currency,
        explorer: contracts.explorer,
        dexName: contracts.dexName,
        rpcUrl: contracts.rpcUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get full configuration for current environment
router.get('/config', (req, res) => {
  try {
    const chainId = parseInt(req.query.chainId) || DEFAULT_CHAIN_ID;
    const contracts = getContracts(chainId);
    
    if (!contracts) {
      return res.status(404).json({
        success: false,
        error: `Chain ID ${chainId} not supported`
      });
    }
    
    res.json({
      success: true,
      config: {
        chainId,
        ...contracts
      },
      supportedChains: getSupportedChainIds()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
