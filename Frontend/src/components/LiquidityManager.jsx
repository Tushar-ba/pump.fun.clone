import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { trackLiquidity } from '../services/api';
import { getContractsForChain } from '../config/contracts';
import './LiquidityManager.css';

// Uniswap V2 Router ABI (minimal)
const ROUTER_ABI = [
  'function factory() external pure returns (address)',
  'function WETH() external pure returns (address)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

// Factory ABI
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

// Pair ABI
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

// ERC20 ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

function LiquidityManager() {
  const { account, signer, provider, chainId, network, isConnected } = useWallet();
  
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState(null);
  const [ethAmount, setEthAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [pairInfo, setPairInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [txResult, setTxResult] = useState(null);

  // Get DEX config from centralized config
  const dexConfig = getContractsForChain(chainId);

  // Fetch token info
  const fetchTokenInfo = async () => {
    if (!tokenAddress || !ethers.isAddress(tokenAddress) || !provider) {
      setTokenInfo(null);
      return;
    }

    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [name, symbol, decimals, balance] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.balanceOf(account)
      ]);

      setTokenInfo({
        address: tokenAddress,
        name,
        symbol,
        decimals,
        balance: ethers.formatUnits(balance, decimals)
      });

      // Check if pair exists
      await checkPairExists(tokenAddress);
    } catch (error) {
      console.error('Error fetching token info:', error);
      toast.error('Invalid token address or unable to fetch token info');
      setTokenInfo(null);
    }
  };

  // Check if pair exists
  const checkPairExists = async (tokenAddr) => {
    if (!dexConfig || !provider) return;

    try {
      const factory = new ethers.Contract(dexConfig.factory, FACTORY_ABI, provider);
      const router = new ethers.Contract(dexConfig.router, ROUTER_ABI, provider);
      const weth = await router.WETH();
      const pairAddress = await factory.getPair(tokenAddr, weth);

      if (pairAddress !== ethers.ZeroAddress) {
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const [reserves, token0] = await Promise.all([
          pair.getReserves(),
          pair.token0()
        ]);

        const isToken0 = token0.toLowerCase() === tokenAddr.toLowerCase();
        const tokenReserve = isToken0 ? reserves[0] : reserves[1];
        const ethReserve = isToken0 ? reserves[1] : reserves[0];

        setPairInfo({
          exists: true,
          address: pairAddress,
          tokenReserve: ethers.formatUnits(tokenReserve, tokenInfo?.decimals || 18),
          ethReserve: ethers.formatEther(ethReserve)
        });
      } else {
        setPairInfo({ exists: false, address: null });
      }
    } catch (error) {
      console.error('Error checking pair:', error);
      setPairInfo(null);
    }
  };

  // Check approval
  const checkApproval = async () => {
    if (!tokenAddress || !signer || !dexConfig) return;

    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const allowance = await token.allowance(account, dexConfig.router);
      const requiredAmount = ethers.parseUnits(tokenAmount || '0', tokenInfo?.decimals || 18);
      setIsApproved(allowance >= requiredAmount);
    } catch (error) {
      console.error('Error checking approval:', error);
    }
  };

  // Handle approval
  const handleApprove = async () => {
    if (!tokenAddress || !signer || !dexConfig) return;

    setIsLoading(true);
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await token.approve(
        dexConfig.router,
        ethers.MaxUint256
      );
      
      toast.loading('Approving tokens...', { id: 'approve' });
      await tx.wait();
      
      setIsApproved(true);
      toast.success('Tokens approved!', { id: 'approve' });
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.reason || error.message, { id: 'approve' });
    } finally {
      setIsLoading(false);
    }
  };

  // Add liquidity
  const handleAddLiquidity = async () => {
    if (!isConnected || !signer || !dexConfig) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!tokenAmount || !ethAmount) {
      toast.error('Please enter both token and ETH amounts');
      return;
    }

    setIsLoading(true);
    try {
      const router = new ethers.Contract(dexConfig.router, ROUTER_ABI, signer);
      
      const tokenAmountWei = ethers.parseUnits(tokenAmount, tokenInfo.decimals);
      const ethAmountWei = ethers.parseEther(ethAmount);
      
      // 5% slippage
      const tokenAmountMin = tokenAmountWei * 95n / 100n;
      const ethAmountMin = ethAmountWei * 95n / 100n;
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      toast.loading('Adding liquidity...', { id: 'liquidity' });
      
      const tx = await router.addLiquidityETH(
        tokenAddress,
        tokenAmountWei,
        tokenAmountMin,
        ethAmountMin,
        account,
        deadline,
        { value: ethAmountWei }
      );

      const receipt = await tx.wait();

      // Get pair address
      const factory = new ethers.Contract(dexConfig.factory, FACTORY_ABI, provider);
      const weth = await router.WETH();
      const pairAddress = await factory.getPair(tokenAddress, weth);

      // Track in backend
      await trackLiquidity({
        tokenA: {
          address: tokenAddress,
          symbol: tokenInfo.symbol,
          amount: tokenAmount
        },
        tokenB: {
          address: weth,
          symbol: network?.currency || 'ETH',
          amount: ethAmount
        },
        pairAddress,
        lpTokenAmount: '0', // Would need to parse from logs
        provider: account,
        dexName: dexConfig?.dexName || 'Unknown DEX',
        routerAddress: dexConfig?.router,
        chainId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });

      setTxResult({
        success: true,
        hash: receipt.hash,
        pairAddress
      });

      toast.success('Liquidity added successfully!', { id: 'liquidity' });
    } catch (error) {
      console.error('Add liquidity error:', error);
      toast.error(error.reason || error.message, { id: 'liquidity' });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate optimal ratio
  const calculateOptimalAmount = (inputEth) => {
    if (!pairInfo?.exists || !inputEth) return;
    
    const ethReserve = parseFloat(pairInfo.ethReserve);
    const tokenReserve = parseFloat(pairInfo.tokenReserve);
    
    if (ethReserve > 0 && tokenReserve > 0) {
      const optimalToken = (parseFloat(inputEth) * tokenReserve) / ethReserve;
      setTokenAmount(optimalToken.toFixed(6));
    }
  };

  useEffect(() => {
    if (tokenAddress && ethers.isAddress(tokenAddress)) {
      fetchTokenInfo();
    }
  }, [tokenAddress, account, chainId]);

  useEffect(() => {
    if (tokenAmount && tokenInfo) {
      checkApproval();
    }
  }, [tokenAmount, tokenInfo]);

  const handleReset = () => {
    setTokenAddress('');
    setTokenInfo(null);
    setEthAmount('');
    setTokenAmount('');
    setPairInfo(null);
    setIsApproved(false);
    setTxResult(null);
  };

  if (txResult?.success) {
    return (
      <div className="liquidity-manager">
        <div className="success-card">
          <div className="success-icon">🎊</div>
          <h2>Liquidity Added Successfully!</h2>
          <p>Your liquidity has been added to the pool</p>
          
          <div className="result-info">
            <div className="info-row">
              <span>Transaction:</span>
              <a 
                href={`${network?.explorer}/tx/${txResult.hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {txResult.hash.slice(0, 20)}...
              </a>
            </div>
            <div className="info-row">
              <span>Pair Address:</span>
              <a 
                href={`${network?.explorer}/address/${txResult.pairAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {txResult.pairAddress.slice(0, 20)}...
              </a>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleReset}>
            Add More Liquidity
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="liquidity-manager">
      <h2>Add Liquidity</h2>
      <p className="description">
        Create a liquidity pool or add to an existing one on {dexConfig?.dexName || 'DEX'}
      </p>

      {!dexConfig && (
        <div className="warning-banner">
          ⚠️ DEX not configured for this network. Please switch to a supported network.
        </div>
      )}

      <div className="form-card">
        <div className="form-group">
          <label>Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            disabled={!isConnected}
          />
        </div>

        {tokenInfo && (
          <div className="token-info-card">
            <div className="token-header">
              <span className="token-symbol">{tokenInfo.symbol}</span>
              <span className="token-name">{tokenInfo.name}</span>
            </div>
            <div className="token-balance">
              Balance: {parseFloat(tokenInfo.balance).toLocaleString()} {tokenInfo.symbol}
            </div>
            {pairInfo?.exists && (
              <div className="pair-status existing">
                ✅ Pair exists - Adding to existing pool
              </div>
            )}
            {pairInfo && !pairInfo.exists && (
              <div className="pair-status new">
                🆕 No pair found - Creating new pool
              </div>
            )}
          </div>
        )}

        {tokenInfo && (
          <>
            <div className="input-group">
              <div className="form-group">
                <label>{network?.currency || 'ETH'} Amount</label>
                <input
                  type="number"
                  value={ethAmount}
                  onChange={(e) => {
                    setEthAmount(e.target.value);
                    if (pairInfo?.exists) {
                      calculateOptimalAmount(e.target.value);
                    }
                  }}
                  placeholder="0.0"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>{tokenInfo.symbol} Amount</label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="0.0"
                  min="0"
                  disabled={pairInfo?.exists}
                />
                {pairInfo?.exists && (
                  <small className="helper-text">
                    Auto-calculated based on pool ratio
                  </small>
                )}
              </div>
            </div>

            {pairInfo?.exists && (
              <div className="pool-info">
                <h4>Current Pool Reserves</h4>
                <div className="reserves">
                  <span>{parseFloat(pairInfo.tokenReserve).toLocaleString()} {tokenInfo.symbol}</span>
                  <span>{parseFloat(pairInfo.ethReserve).toLocaleString()} {network?.currency || 'ETH'}</span>
                </div>
              </div>
            )}

            <div className="actions">
              {!isApproved ? (
                <button
                  className="btn btn-secondary btn-large"
                  onClick={handleApprove}
                  disabled={isLoading || !tokenAmount}
                >
                  {isLoading ? 'Approving...' : `Approve ${tokenInfo.symbol}`}
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-large"
                  onClick={handleAddLiquidity}
                  disabled={isLoading || !ethAmount || !tokenAmount}
                >
                  {isLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
                </button>
              )}
            </div>
          </>
        )}

        {!isConnected && (
          <p className="connect-prompt">Please connect your wallet to add liquidity</p>
        )}
      </div>
    </div>
  );
}

export default LiquidityManager;
