const express = require('express');
const router = express.Router();
const { generateTokenSource, compileContract, flattenSource } = require('../services/compiler');
const { TokenDeployment } = require('../models');

/**
 * POST /api/contracts/generate
 * Generate and compile a token contract
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      name,
      symbol,
      initialSupply,
      maxSupply,
      mintable,
      buyTax,
      sellTax,
      taxReceiver,
      owner
    } = req.body;

    console.log('Generate contract request:', { name, symbol, initialSupply, maxSupply, mintable, buyTax, sellTax, taxReceiver: taxReceiver ? 'set' : 'not set', owner: owner ? 'set' : 'not set' });

    // Validation
    if (!name || !symbol || !initialSupply) {
      return res.status(400).json({
        success: false,
        error: 'Name, symbol, and initial supply are required'
      });
    }

    if (symbol.length > 11) {
      return res.status(400).json({
        success: false,
        error: 'Symbol must be 11 characters or less'
      });
    }

    if (buyTax > 25 || sellTax > 25) {
      return res.status(400).json({
        success: false,
        error: 'Tax cannot exceed 25%'
      });
    }

    // Generate source code
    const source = generateTokenSource({
      name,
      symbol,
      initialSupply,
      maxSupply: maxSupply || 0,
      mintable: mintable || false,
      buyTax: buyTax || 0,
      sellTax: sellTax || 0,
      taxReceiver,
      owner
    });

    // Compile
    const contractName = `${symbol.replace(/[^a-zA-Z0-9]/g, '')}Token`;
    const compiled = compileContract(source, contractName);

    // Flatten for verification
    const flattenedSource = flattenSource(source);

    res.json({
      success: true,
      data: {
        contractName,
        abi: compiled.abi,
        bytecode: '0x' + compiled.bytecode,
        sourceCode: source,
        flattenedSource
      }
    });
  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/contracts/track-deployment
 * Track a deployed token contract
 */
router.post('/track-deployment', async (req, res) => {
  try {
    const {
      name,
      symbol,
      address,
      owner,
      initialSupply,
      maxSupply,
      mintable,
      burnable,
      buyTax,
      sellTax,
      taxReceiver,
      chainId,
      transactionHash,
      blockNumber,
      sourceCode
    } = req.body;

    // Validation
    if (!name || !symbol || !address || !owner || !chainId) {
      return res.status(400).json({
        success: false,
        error: 'Name, symbol, address, owner, and chainId are required'
      });
    }

    // Check if already tracked
    const existing = await TokenDeployment.findOne({ address: address.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Token already tracked'
      });
    }

    // Create record
    const deployment = await TokenDeployment.create({
      name,
      symbol,
      address: address.toLowerCase(),
      owner: owner.toLowerCase(),
      initialSupply: initialSupply.toString(),
      maxSupply: (maxSupply || 0).toString(),
      mintable: mintable || false,
      burnable: burnable !== false,
      buyTax: buyTax || 0,
      sellTax: sellTax || 0,
      taxReceiver: taxReceiver?.toLowerCase(),
      chainId,
      transactionHash: transactionHash?.toLowerCase(),
      blockNumber,
      sourceCode
    });

    res.status(201).json({
      success: true,
      data: deployment
    });
  } catch (error) {
    console.error('Track deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/contracts/deployments
 * Get all token deployments (with pagination)
 */
router.get('/deployments', async (req, res) => {
  try {
    const { page = 1, limit = 20, owner, chainId } = req.query;
    
    const query = {};
    if (owner) query.owner = owner.toLowerCase();
    if (chainId) query.chainId = parseInt(chainId);

    const deployments = await TokenDeployment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TokenDeployment.countDocuments(query);

    res.json({
      success: true,
      data: deployments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get deployments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/contracts/deployments/:address
 * Get a specific token deployment
 */
router.get('/deployments/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const deployment = await TokenDeployment.findOne({ 
      address: address.toLowerCase() 
    });

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    res.json({
      success: true,
      data: deployment
    });
  } catch (error) {
    console.error('Get deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/contracts/source/:address
 * Get source code for a deployed token
 */
router.get('/source/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const deployment = await TokenDeployment.findOne({ 
      address: address.toLowerCase() 
    });

    if (!deployment || !deployment.sourceCode) {
      return res.status(404).json({
        success: false,
        error: 'Source code not found'
      });
    }

    res.json({
      success: true,
      data: {
        sourceCode: deployment.sourceCode,
        flattenedSource: flattenSource(deployment.sourceCode)
      }
    });
  } catch (error) {
    console.error('Get source error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
