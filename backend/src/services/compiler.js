const solc = require('solc');
const path = require('path');
const fs = require('fs');

// OpenZeppelin contracts path
const OZ_PATH = path.join(__dirname, '../../node_modules/@openzeppelin/contracts');

/**
 * Generate StandardToken source code with injected parameters
 */
function generateTokenSource(params) {
  const {
    name,
    symbol,
    initialSupply,
    maxSupply = 0,
    mintable = false,
    buyTax = 0,
    sellTax = 0,
    taxReceiver,
    owner
  } = params;

  // Using a cleaner template that will be flattened
  const source = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ${name}
 * @dev Custom ERC-20 token with optional minting, burning, and tax features
 * Symbol: ${symbol}
 * Initial Supply: ${initialSupply}
 * Max Supply: ${maxSupply || 'Unlimited'}
 * Mintable: ${mintable}
 * Buy Tax: ${buyTax}%
 * Sell Tax: ${sellTax}%
 */
contract ${symbol.replace(/[^a-zA-Z0-9]/g, '')}Token is ERC20, ERC20Burnable, Ownable {
    uint256 public maxSupply;
    bool public mintable;
    
    uint256 public buyTaxPercent;
    uint256 public sellTaxPercent;
    address public taxReceiver;
    
    mapping(address => bool) public isDexPair;
    mapping(address => bool) public isExcludedFromTax;

    event TaxUpdated(uint256 buyTax, uint256 sellTax);
    event TaxReceiverUpdated(address newReceiver);
    event DexPairUpdated(address pair, bool status);
    event ExcludedFromTax(address account, bool excluded);

    constructor() ERC20("${name}", "${symbol}") Ownable(msg.sender) {
        maxSupply = ${maxSupply} * 10 ** decimals();
        mintable = ${mintable};
        buyTaxPercent = ${buyTax};
        sellTaxPercent = ${sellTax};
        taxReceiver = ${taxReceiver ? `address(${taxReceiver})` : 'msg.sender'};
        
        isExcludedFromTax[msg.sender] = true;
        isExcludedFromTax[address(this)] = true;
        
        if (${initialSupply} > 0) {
            _mint(msg.sender, ${initialSupply} * 10 ** decimals());
        }
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(mintable, "Minting disabled");
        if (maxSupply > 0) {
            require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        }
        _mint(to, amount);
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from == address(0) || to == address(0) || 
            isExcludedFromTax[from] || isExcludedFromTax[to]) {
            super._update(from, to, amount);
            return;
        }

        uint256 taxAmount = 0;
        
        if (isDexPair[from] && buyTaxPercent > 0) {
            taxAmount = (amount * buyTaxPercent) / 100;
        }
        else if (isDexPair[to] && sellTaxPercent > 0) {
            taxAmount = (amount * sellTaxPercent) / 100;
        }

        if (taxAmount > 0) {
            super._update(from, taxReceiver, taxAmount);
            amount -= taxAmount;
        }
        
        super._update(from, to, amount);
    }

    function setTaxPercent(uint256 buyTax_, uint256 sellTax_) external onlyOwner {
        require(buyTax_ <= 25, "Buy tax too high");
        require(sellTax_ <= 25, "Sell tax too high");
        buyTaxPercent = buyTax_;
        sellTaxPercent = sellTax_;
        emit TaxUpdated(buyTax_, sellTax_);
    }

    function setTaxReceiver(address receiver_) external onlyOwner {
        require(receiver_ != address(0), "Invalid address");
        taxReceiver = receiver_;
        emit TaxReceiverUpdated(receiver_);
    }

    function setDexPair(address pair_, bool status_) external onlyOwner {
        isDexPair[pair_] = status_;
        emit DexPairUpdated(pair_, status_);
    }

    function setExcludedFromTax(address account_, bool excluded_) external onlyOwner {
        isExcludedFromTax[account_] = excluded_;
        emit ExcludedFromTax(account_, excluded_);
    }

    function disableMinting() external onlyOwner {
        mintable = false;
    }
}
`;

  return source;
}

/**
 * Read file content with import resolution
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

/**
 * Import callback for solc
 */
function findImports(importPath) {
  // Handle OpenZeppelin imports
  if (importPath.startsWith('@openzeppelin/contracts')) {
    const relativePath = importPath.replace('@openzeppelin/contracts', '');
    const fullPath = path.join(OZ_PATH, relativePath);
    const content = readFileContent(fullPath);
    if (content) {
      return { contents: content };
    }
  }
  
  return { error: `File not found: ${importPath}` };
}

/**
 * Compile Solidity source code
 */
function compileContract(source, contractName) {
  const input = {
    language: 'Solidity',
    sources: {
      'Token.sol': {
        content: source
      }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
        }
      }
    }
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports })
  );

  // Check for errors
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      throw new Error(`Compilation failed: ${errors.map(e => e.message).join('\n')}`);
    }
  }

  // Find the main contract
  const contracts = output.contracts['Token.sol'];
  const contractNames = Object.keys(contracts);
  
  // Get the contract (use provided name or find the token contract)
  let targetContract = contractName ? contracts[contractName] : null;
  
  if (!targetContract) {
    // Find the contract that ends with 'Token' or use the first one
    const tokenContractName = contractNames.find(n => n.endsWith('Token')) || contractNames[0];
    targetContract = contracts[tokenContractName];
  }

  if (!targetContract) {
    throw new Error('No contract found in compilation output');
  }

  return {
    abi: targetContract.abi,
    bytecode: targetContract.evm.bytecode.object,
    deployedBytecode: targetContract.evm.deployedBytecode.object
  };
}

/**
 * Flatten source code by inlining all imports
 */
function flattenSource(source) {
  const seen = new Set();
  const licensePattern = /\/\/ SPDX-License-Identifier: [^\n]+\n/g;
  const pragmaPattern = /pragma solidity [^;]+;\n/g;
  
  function processImports(content, depth = 0) {
    if (depth > 20) throw new Error('Import depth exceeded');
    
    const importPattern = /import\s+(?:{[^}]+}\s+from\s+)?["']([^"']+)["'];?\n?/g;
    let result = content;
    let match;
    
    // Find all imports
    const imports = [];
    while ((match = importPattern.exec(content)) !== null) {
      imports.push({
        fullMatch: match[0],
        path: match[1]
      });
    }
    
    // Process each import
    for (const imp of imports) {
      if (seen.has(imp.path)) {
        result = result.replace(imp.fullMatch, '');
        continue;
      }
      
      seen.add(imp.path);
      
      let importContent = '';
      if (imp.path.startsWith('@openzeppelin/contracts')) {
        const relativePath = imp.path.replace('@openzeppelin/contracts', '');
        const fullPath = path.join(OZ_PATH, relativePath);
        importContent = readFileContent(fullPath);
      }
      
      if (importContent) {
        // Recursively process nested imports
        importContent = processImports(importContent, depth + 1);
        // Remove license and pragma from imported content
        importContent = importContent.replace(licensePattern, '');
        importContent = importContent.replace(pragmaPattern, '');
        result = result.replace(imp.fullMatch, importContent + '\n');
      } else {
        result = result.replace(imp.fullMatch, `// Import not found: ${imp.path}\n`);
      }
    }
    
    return result;
  }
  
  let flattened = processImports(source);
  
  // Clean up multiple blank lines
  flattened = flattened.replace(/\n{3,}/g, '\n\n');
  
  return flattened;
}

module.exports = {
  generateTokenSource,
  compileContract,
  flattenSource
};
