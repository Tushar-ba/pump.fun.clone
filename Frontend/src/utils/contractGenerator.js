/**
 * Generate Solidity contract source code based on configuration
 * Similar to OpenZeppelin Contracts Wizard
 */

export function generateContractCode(config) {
  const {
    name = 'MyToken',
    symbol = 'MTK',
    initialSupply = '1000000',
    maxSupply = '0',
    mintable = false,
    burnable = true,
    pausable = false,
    buyTax = 0,
    sellTax = 0,
    taxReceiver = '',
    accessControl = 'ownable' // 'ownable' | 'roles' | 'none'
  } = config;

  const hasTax = buyTax > 0 || sellTax > 0;
  const hasMaxSupply = maxSupply && parseInt(maxSupply) > 0;
  const contractName = symbol.replace(/[^a-zA-Z0-9]/g, '') + 'Token';

  // Build imports
  const imports = [
    'import "@openzeppelin/contracts/token/ERC20/ERC20.sol";'
  ];

  if (burnable) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";');
  }

  if (pausable) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";');
  }

  if (accessControl === 'ownable') {
    imports.push('import "@openzeppelin/contracts/access/Ownable.sol";');
  } else if (accessControl === 'roles') {
    imports.push('import "@openzeppelin/contracts/access/AccessControl.sol";');
  }

  // Build inheritance
  const inheritance = ['ERC20'];
  if (burnable) inheritance.push('ERC20Burnable');
  if (pausable) inheritance.push('ERC20Pausable');
  if (accessControl === 'ownable') inheritance.push('Ownable');
  if (accessControl === 'roles') inheritance.push('AccessControl');

  // Build state variables
  const stateVars = [];
  
  if (hasMaxSupply) {
    stateVars.push('    uint256 public maxSupply;');
  }
  
  if (mintable) {
    stateVars.push('    bool public mintable;');
  }

  if (hasTax) {
    stateVars.push('    uint256 public buyTaxPercent;');
    stateVars.push('    uint256 public sellTaxPercent;');
    stateVars.push('    address public taxReceiver;');
    stateVars.push('    ');
    stateVars.push('    mapping(address => bool) public isDexPair;');
    stateVars.push('    mapping(address => bool) public isExcludedFromTax;');
  }

  if (accessControl === 'roles') {
    stateVars.push('    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");');
    if (pausable) {
      stateVars.push('    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");');
    }
  }

  // Build events
  const events = [];
  if (hasTax) {
    events.push('    event TaxUpdated(uint256 buyTax, uint256 sellTax);');
    events.push('    event TaxReceiverUpdated(address newReceiver);');
    events.push('    event DexPairUpdated(address pair, bool status);');
    events.push('    event ExcludedFromTax(address account, bool excluded);');
  }

  // Build constructor
  let constructorParams = '';
  let constructorBody = [];
  
  if (accessControl === 'ownable') {
    constructorParams = `ERC20("${name}", "${symbol}") Ownable(msg.sender)`;
  } else if (accessControl === 'roles') {
    constructorParams = `ERC20("${name}", "${symbol}")`;
    constructorBody.push('        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);');
    if (mintable) {
      constructorBody.push('        _grantRole(MINTER_ROLE, msg.sender);');
    }
    if (pausable) {
      constructorBody.push('        _grantRole(PAUSER_ROLE, msg.sender);');
    }
  } else {
    constructorParams = `ERC20("${name}", "${symbol}")`;
  }

  if (hasMaxSupply) {
    constructorBody.push(`        maxSupply = ${maxSupply} * 10 ** decimals();`);
  }

  if (mintable) {
    constructorBody.push('        mintable = true;');
  }

  if (hasTax) {
    constructorBody.push(`        buyTaxPercent = ${buyTax};`);
    constructorBody.push(`        sellTaxPercent = ${sellTax};`);
    constructorBody.push(`        taxReceiver = ${taxReceiver ? `address(${taxReceiver})` : 'msg.sender'};`);
    constructorBody.push('        ');
    constructorBody.push('        isExcludedFromTax[msg.sender] = true;');
    constructorBody.push('        isExcludedFromTax[address(this)] = true;');
  }

  if (initialSupply && parseInt(initialSupply) > 0) {
    constructorBody.push('        ');
    constructorBody.push(`        _mint(msg.sender, ${initialSupply} * 10 ** decimals());`);
  }

  // Build functions
  const functions = [];

  // Mint function
  if (mintable) {
    const modifier = accessControl === 'ownable' ? 'onlyOwner' : 
                     accessControl === 'roles' ? 'onlyRole(MINTER_ROLE)' : '';
    
    let mintFunc = `    function mint(address to, uint256 amount) external ${modifier} {\n`;
    mintFunc += '        require(mintable, "Minting disabled");\n';
    if (hasMaxSupply) {
      mintFunc += '        if (maxSupply > 0) {\n';
      mintFunc += '            require(totalSupply() + amount <= maxSupply, "Exceeds max supply");\n';
      mintFunc += '        }\n';
    }
    mintFunc += '        _mint(to, amount);\n';
    mintFunc += '    }';
    functions.push(mintFunc);
  }

  // Pause functions
  if (pausable && accessControl !== 'none') {
    const modifier = accessControl === 'ownable' ? 'onlyOwner' : 'onlyRole(PAUSER_ROLE)';
    functions.push(`    function pause() external ${modifier} {\n        _pause();\n    }`);
    functions.push(`    function unpause() external ${modifier} {\n        _unpause();\n    }`);
  }

  // Tax functions
  if (hasTax && accessControl !== 'none') {
    const modifier = accessControl === 'ownable' ? 'onlyOwner' : 'onlyRole(DEFAULT_ADMIN_ROLE)';
    
    functions.push(`    function setTaxPercent(uint256 buyTax_, uint256 sellTax_) external ${modifier} {
        require(buyTax_ <= 25, "Buy tax too high");
        require(sellTax_ <= 25, "Sell tax too high");
        buyTaxPercent = buyTax_;
        sellTaxPercent = sellTax_;
        emit TaxUpdated(buyTax_, sellTax_);
    }`);

    functions.push(`    function setTaxReceiver(address receiver_) external ${modifier} {
        require(receiver_ != address(0), "Invalid address");
        taxReceiver = receiver_;
        emit TaxReceiverUpdated(receiver_);
    }`);

    functions.push(`    function setDexPair(address pair_, bool status_) external ${modifier} {
        isDexPair[pair_] = status_;
        emit DexPairUpdated(pair_, status_);
    }`);

    functions.push(`    function setExcludedFromTax(address account_, bool excluded_) external ${modifier} {
        isExcludedFromTax[account_] = excluded_;
        emit ExcludedFromTax(account_, excluded_);
    }`);
  }

  // Disable minting function
  if (mintable && accessControl !== 'none') {
    const modifier = accessControl === 'ownable' ? 'onlyOwner' : 'onlyRole(DEFAULT_ADMIN_ROLE)';
    functions.push(`    function disableMinting() external ${modifier} {\n        mintable = false;\n    }`);
  }

  // _update override for tax
  let updateOverride = '';
  if (hasTax || pausable) {
    let updateFunc = '    function _update(\n';
    updateFunc += '        address from,\n';
    updateFunc += '        address to,\n';
    updateFunc += '        uint256 amount\n';
    updateFunc += '    ) internal virtual override';
    
    if (pausable) {
      updateFunc += '(ERC20, ERC20Pausable)';
    }
    
    updateFunc += ' {\n';

    if (hasTax) {
      updateFunc += '        if (from == address(0) || to == address(0) || \n';
      updateFunc += '            isExcludedFromTax[from] || isExcludedFromTax[to]) {\n';
      updateFunc += '            super._update(from, to, amount);\n';
      updateFunc += '            return;\n';
      updateFunc += '        }\n\n';
      updateFunc += '        uint256 taxAmount = 0;\n';
      updateFunc += '        \n';
      updateFunc += '        if (isDexPair[from] && buyTaxPercent > 0) {\n';
      updateFunc += '            taxAmount = (amount * buyTaxPercent) / 100;\n';
      updateFunc += '        }\n';
      updateFunc += '        else if (isDexPair[to] && sellTaxPercent > 0) {\n';
      updateFunc += '            taxAmount = (amount * sellTaxPercent) / 100;\n';
      updateFunc += '        }\n\n';
      updateFunc += '        if (taxAmount > 0) {\n';
      updateFunc += '            super._update(from, taxReceiver, taxAmount);\n';
      updateFunc += '            amount -= taxAmount;\n';
      updateFunc += '        }\n';
    }
    
    updateFunc += '        super._update(from, to, amount);\n';
    updateFunc += '    }';
    updateOverride = updateFunc;
  }

  // supportsInterface for AccessControl
  let supportsInterface = '';
  if (accessControl === 'roles') {
    supportsInterface = `    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }`;
  }

  // Build the full contract
  let contract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join('\n')}

/**
 * @title ${name}
 * @dev ERC-20 Token with the following features:
 * - Symbol: ${symbol}
 * - Initial Supply: ${initialSupply || '0'}
 * - Max Supply: ${hasMaxSupply ? maxSupply : 'Unlimited'}
 * - Mintable: ${mintable ? 'Yes' : 'No'}
 * - Burnable: ${burnable ? 'Yes' : 'No'}
 * - Pausable: ${pausable ? 'Yes' : 'No'}
 * - Buy Tax: ${buyTax}%
 * - Sell Tax: ${sellTax}%
 * - Access Control: ${accessControl === 'ownable' ? 'Ownable' : accessControl === 'roles' ? 'Role-Based' : 'None'}
 *
 * Generated by TokenLaunch - https://tokenlaunch.app
 */
contract ${contractName} is ${inheritance.join(', ')} {
${stateVars.length > 0 ? stateVars.join('\n') + '\n' : ''}
${events.length > 0 ? events.join('\n') + '\n' : ''}
    constructor() ${constructorParams} {
${constructorBody.join('\n')}
    }

${functions.join('\n\n')}
${updateOverride ? '\n' + updateOverride : ''}
${supportsInterface ? '\n' + supportsInterface : ''}
}
`;

  return contract;
}

/**
 * Get available features for the wizard
 */
export const AVAILABLE_FEATURES = [
  {
    id: 'mintable',
    name: 'Mintable',
    description: 'Owner can create new tokens',
    icon: '🪙'
  },
  {
    id: 'burnable',
    name: 'Burnable',
    description: 'Holders can destroy their tokens',
    icon: '🔥'
  },
  {
    id: 'pausable',
    name: 'Pausable',
    description: 'Owner can pause all transfers',
    icon: '⏸️'
  }
];

export const ACCESS_CONTROL_OPTIONS = [
  { id: 'ownable', name: 'Ownable', description: 'Single owner with full control' },
  { id: 'roles', name: 'Role-Based', description: 'Multiple roles with different permissions' },
  { id: 'none', name: 'None', description: 'No access control (be careful!)' }
];
