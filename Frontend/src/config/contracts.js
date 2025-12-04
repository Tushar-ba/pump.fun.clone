// Deployed contract addresses by network

// ABIs for deployed contracts
export const ABIS = {
  // ERC20 Standard ABI
  ERC20: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],

  // StandardToken ABI (our deployed token with tax features)
  StandardToken: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function maxSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function owner() view returns (address)',
    'function buyTaxPercent() view returns (uint256)',
    'function sellTaxPercent() view returns (uint256)',
    'function taxReceiver() view returns (address)',
    'function mintable() view returns (bool)',
    'function isDexPair(address) view returns (bool)',
    'function isExcludedFromTax(address) view returns (bool)',
    'function mint(address to, uint256 amount)',
    'function burn(uint256 amount)',
    'function burnFrom(address account, uint256 amount)',
    'function setDexPair(address pair_, bool status_)',
    'function setTaxPercent(uint256 buyTax_, uint256 sellTax_)',
    'function setTaxReceiver(address receiver_)',
    'function setExcludedFromTax(address account_, bool excluded_)',
    'function disableMinting()',
    'function renounceOwnership()',
    'function transferOwnership(address newOwner)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
    'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
    'event TaxUpdated(uint256 buyTax, uint256 sellTax)',
    'event TaxReceiverUpdated(address newReceiver)',
    'event DexPairUpdated(address pair, bool status)',
    'event ExcludedFromTax(address account, bool excluded)'
  ],

  // MockUSDT ABI
  MockUSDT: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function faucet(uint256 amount)',
    'function mint(address to, uint256 amount)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],

  // LiquidityHelper ABI
  LiquidityHelper: [
    'function router() view returns (address)',
    'function factory() view returns (address)',
    'function WETH() view returns (address)',
    'function addLiquidityETH(address token, uint256 tokenAmount, uint256 tokenAmountMin, uint256 ethAmountMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)',
    'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
    'function getPair(address tokenA, address tokenB) view returns (address pair)',
    'function getReserves(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB)',
    'function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) pure returns (uint256 amountB)',
    'event LiquidityAdded(address indexed token, address indexed pair, uint256 tokenAmount, uint256 ethAmount, uint256 liquidity)'
  ],

  // Uniswap V2 Router ABI
  UniswapV2Router: [
    'function factory() view returns (address)',
    'function WETH() view returns (address)',
    'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
    'function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)',
    'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
    'function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) returns (uint256 amountToken, uint256 amountETH)',
    'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)',
    'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) payable returns (uint256[] memory amounts)',
    'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)',
    'function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] memory amounts)',
    'function getAmountsIn(uint256 amountOut, address[] calldata path) view returns (uint256[] memory amounts)'
  ],

  // Uniswap V2 Factory ABI
  UniswapV2Factory: [
    'function getPair(address tokenA, address tokenB) view returns (address pair)',
    'function allPairs(uint256) view returns (address pair)',
    'function allPairsLength() view returns (uint256)',
    'function createPair(address tokenA, address tokenB) returns (address pair)',
    'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)'
  ],

  // Uniswap V2 Pair ABI
  UniswapV2Pair: [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address account) view returns (uint256)',
    'function token0() view returns (address)',
    'function token1() view returns (address)',
    'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function price0CumulativeLast() view returns (uint256)',
    'function price1CumulativeLast() view returns (uint256)',
    'function kLast() view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Sync(uint112 reserve0, uint112 reserve1)'
  ]
};

export const CONTRACTS = {
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
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/-qbD2Yd4GIC_sRvgtkTME',
    dexName: 'Uniswap V2'
  }
};

// Required chain ID - Sepolia only
export const REQUIRED_CHAIN_ID = 11155111;

export const getContracts = (chainId) => {
  return CONTRACTS[chainId] || null;
};

// Alias for better readability
export const getContractsForChain = getContracts;

// Get ABI by name
export const getABI = (name) => {
  return ABIS[name] || null;
};

export const getSupportedChainIds = () => {
  return Object.keys(CONTRACTS).map(id => parseInt(id));
};

export const isChainSupported = (chainId) => {
  return chainId in CONTRACTS;
};

// Default to Sepolia for development
export const DEFAULT_CHAIN_ID = 11155111;
