// Deployed contract addresses and network configuration

const CONTRACTS = {
  // Sepolia Testnet (Chain ID: 11155111) - Only supported network
  11155111: {
    // DEX Contracts
    router: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
    factory: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6',
    
    // Our Deployed Contracts
    liquidityHelper: '0xf7f3B3aEb0Ab69A123383F84D5d59a0C661C04be',
    mockUSDT: '0x2d5D8De86A18182152881cB283BD319E9b51414b',
    sampleToken: '0xE9085e06D0262c4Ea7A7002a1A3D55985fFe9C46',
    
    // Network info
    name: 'Sepolia Testnet',
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    explorerApi: 'https://api-sepolia.etherscan.io/api',
    dexName: 'Uniswap V2',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/-qbD2Yd4GIC_sRvgtkTME'
  }
};

// Required chain ID - Sepolia only
const REQUIRED_CHAIN_ID = 11155111;

const getContracts = (chainId) => {
  return CONTRACTS[chainId] || null;
};

const getSupportedChainIds = () => {
  return Object.keys(CONTRACTS).map(id => parseInt(id));
};

const isChainSupported = (chainId) => {
  return chainId in CONTRACTS;
};

module.exports = {
  CONTRACTS,
  getContracts,
  getSupportedChainIds,
  isChainSupported,
  REQUIRED_CHAIN_ID,
  DEFAULT_CHAIN_ID: REQUIRED_CHAIN_ID
};
