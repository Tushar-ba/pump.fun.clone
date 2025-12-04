import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { getDeployments, getLiquidityPools } from '../services/api';
import { ABIS } from '../config/contracts';
import './UserPanel.css';

function UserPanel() {
  const { account, signer, network, chainId, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('tokens');
  const [tokens, setTokens] = useState([]);
  const [pools, setPools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  // Fetch user's tokens
  const fetchUserTokens = useCallback(async () => {
    if (!account) return;
    
    setIsLoading(true);
    try {
      const data = await getDeployments({ owner: account, chainId });
      setTokens(data.data || []);
    } catch (err) {
      console.error('Error fetching tokens:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account, chainId]);

  // Fetch user's pools
  const fetchUserPools = useCallback(async () => {
    if (!account) return;
    
    setIsLoading(true);
    try {
      const data = await getLiquidityPools({ provider: account, chainId });
      setPools(data.data || []);
    } catch (err) {
      console.error('Error fetching pools:', err);
    } finally {
      setIsLoading(false);
    }
  }, [account, chainId]);

  useEffect(() => {
    if (activeTab === 'tokens') {
      fetchUserTokens();
    } else {
      fetchUserPools();
    }
  }, [activeTab, fetchUserTokens, fetchUserPools]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openManageModal = (token) => {
    setSelectedToken(token);
    setShowManageModal(true);
  };

  if (!isConnected) {
    return (
      <div className="user-panel">
        <div className="connect-prompt">
          <div className="prompt-icon">👛</div>
          <h2>Connect Your Wallet</h2>
          <p>Connect your wallet to view your deployed tokens and liquidity pools.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-panel">
      <div className="user-header">
        <div className="user-info">
          <h1>My Portfolio</h1>
          <p className="wallet-address">
            <span className="network-badge">{network?.name}</span>
            {formatAddress(account)}
          </p>
        </div>
      </div>

      <div className="user-tabs">
        <button 
          className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          🪙 My Tokens ({tokens.length})
        </button>
        <button 
          className={`tab ${activeTab === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('pools')}
        >
          💧 My Pools ({pools.length})
        </button>
      </div>

      <div className="user-content">
        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {activeTab === 'tokens' && !isLoading && (
          <div className="tokens-grid">
            {tokens.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🪙</div>
                <h3>No Tokens Yet</h3>
                <p>You haven't deployed any tokens yet. Create your first token!</p>
                <a href="/" className="btn btn-primary">Create Token</a>
              </div>
            ) : (
              tokens.map((token, idx) => (
                <div key={idx} className="token-card">
                  <div className="token-header">
                    <div className="token-icon">
                      {token.symbol.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="token-info">
                      <h3>{token.name}</h3>
                      <span className="token-symbol">{token.symbol}</span>
                    </div>
                  </div>

                  <div className="token-details">
                    <div className="detail-row">
                      <span>Contract</span>
                      <a 
                        href={`${network?.explorer}/address/${token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formatAddress(token.address)}
                      </a>
                    </div>
                    <div className="detail-row">
                      <span>Initial Supply</span>
                      <span>{Number(token.initialSupply).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>Max Supply</span>
                      <span>
                        {token.maxSupply && token.maxSupply !== '0' 
                          ? Number(token.maxSupply).toLocaleString() 
                          : 'Unlimited'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Tax (Buy/Sell)</span>
                      <span>{token.buyTax}% / {token.sellTax}%</span>
                    </div>
                    <div className="detail-row">
                      <span>Created</span>
                      <span>{formatDate(token.createdAt)}</span>
                    </div>
                  </div>

                  <div className="token-badges">
                    {token.mintable && <span className="badge mintable">Mintable</span>}
                    {token.burnable && <span className="badge burnable">Burnable</span>}
                    {(token.buyTax > 0 || token.sellTax > 0) && (
                      <span className="badge tax">Has Tax</span>
                    )}
                  </div>

                  <div className="token-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openManageModal(token)}
                    >
                      ⚙️ Manage
                    </button>
                    <a 
                      href={`${network?.explorer}/token/${token.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      🔗 Explorer
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pools' && !isLoading && (
          <div className="pools-list">
            {pools.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💧</div>
                <h3>No Liquidity Pools</h3>
                <p>You haven't created any liquidity pools yet.</p>
                <a href="/liquidity" className="btn btn-primary">Add Liquidity</a>
              </div>
            ) : (
              pools.map((pool, idx) => (
                <div key={idx} className="pool-card">
                  <div className="pool-pair">
                    <span className="pair-name">
                      {pool.tokenA?.symbol} / {pool.tokenB?.symbol}
                    </span>
                    <span className="dex-name">{pool.dexName}</span>
                  </div>
                  
                  <div className="pool-amounts">
                    <div className="amount">
                      <span className="label">{pool.tokenA?.symbol}</span>
                      <span className="value">{Number(pool.tokenA?.amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="amount">
                      <span className="label">{pool.tokenB?.symbol}</span>
                      <span className="value">{Number(pool.tokenB?.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pool-actions">
                    <a 
                      href={`${network?.explorer}/address/${pool.pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      View Pair
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Token Management Modal */}
      {showManageModal && selectedToken && (
        <TokenManageModal 
          token={selectedToken}
          signer={signer}
          network={network}
          onClose={() => {
            setShowManageModal(false);
            setSelectedToken(null);
          }}
          onUpdate={fetchUserTokens}
        />
      )}
    </div>
  );
}

// Token Management Modal Component
function TokenManageModal({ token, signer, network, onClose, onUpdate }) {
  const [activeAction, setActiveAction] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    dexPairAddress: '',
    newBuyTax: token.buyTax || 0,
    newSellTax: token.sellTax || 0,
    mintTo: '',
    mintAmount: '',
    newTaxReceiver: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const setDexPair = async () => {
    if (!formData.dexPairAddress || !ethers.isAddress(formData.dexPairAddress)) {
      toast.error('Invalid DEX pair address');
      return;
    }

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(token.address, ABIS.StandardToken, signer);
      const tx = await contract.setDexPair(formData.dexPairAddress, true);
      toast.loading('Setting DEX pair...', { id: 'dexpair' });
      await tx.wait();
      toast.success('DEX pair set successfully!', { id: 'dexpair' });
      onUpdate();
    } catch (err) {
      console.error('Error setting DEX pair:', err);
      toast.error(err.reason || err.message, { id: 'dexpair' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaxes = async () => {
    if (formData.newBuyTax > 25 || formData.newSellTax > 25) {
      toast.error('Tax cannot exceed 25%');
      return;
    }

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(token.address, ABIS.StandardToken, signer);
      const tx = await contract.setTaxPercent(formData.newBuyTax, formData.newSellTax);
      toast.loading('Updating taxes...', { id: 'tax' });
      await tx.wait();
      toast.success('Taxes updated successfully!', { id: 'tax' });
      onUpdate();
    } catch (err) {
      console.error('Error updating taxes:', err);
      toast.error(err.reason || err.message, { id: 'tax' });
    } finally {
      setIsLoading(false);
    }
  };

  const mintTokens = async () => {
    if (!formData.mintTo || !ethers.isAddress(formData.mintTo)) {
      toast.error('Invalid recipient address');
      return;
    }
    if (!formData.mintAmount || parseFloat(formData.mintAmount) <= 0) {
      toast.error('Invalid mint amount');
      return;
    }

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(token.address, ABIS.StandardToken, signer);
      const decimals = await contract.decimals();
      const amount = ethers.parseUnits(formData.mintAmount, decimals);
      const tx = await contract.mint(formData.mintTo, amount);
      toast.loading('Minting tokens...', { id: 'mint' });
      await tx.wait();
      toast.success('Tokens minted successfully!', { id: 'mint' });
      onUpdate();
    } catch (err) {
      console.error('Error minting tokens:', err);
      toast.error(err.reason || err.message, { id: 'mint' });
    } finally {
      setIsLoading(false);
    }
  };

  const disableMinting = async () => {
    if (!confirm('Are you sure? This action is IRREVERSIBLE!')) return;

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(token.address, ABIS.StandardToken, signer);
      const tx = await contract.disableMinting();
      toast.loading('Disabling minting...', { id: 'disable' });
      await tx.wait();
      toast.success('Minting disabled permanently!', { id: 'disable' });
      onUpdate();
    } catch (err) {
      console.error('Error disabling minting:', err);
      toast.error(err.reason || err.message, { id: 'disable' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage {token.symbol}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={activeAction === 'info' ? 'active' : ''}
            onClick={() => setActiveAction('info')}
          >
            Info
          </button>
          <button 
            className={activeAction === 'dex' ? 'active' : ''}
            onClick={() => setActiveAction('dex')}
          >
            DEX Pair
          </button>
          <button 
            className={activeAction === 'tax' ? 'active' : ''}
            onClick={() => setActiveAction('tax')}
          >
            Taxes
          </button>
          {token.mintable && (
            <button 
              className={activeAction === 'mint' ? 'active' : ''}
              onClick={() => setActiveAction('mint')}
            >
              Mint
            </button>
          )}
        </div>

        <div className="modal-body">
          {activeAction === 'info' && (
            <div className="info-section">
              <div className="info-row">
                <label>Contract Address</label>
                <a href={`${network?.explorer}/address/${token.address}`} target="_blank" rel="noopener noreferrer">
                  {token.address}
                </a>
              </div>
              <div className="info-row">
                <label>Name / Symbol</label>
                <span>{token.name} ({token.symbol})</span>
              </div>
              <div className="info-row">
                <label>Initial Supply</label>
                <span>{Number(token.initialSupply).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <label>Max Supply</label>
                <span>{token.maxSupply && token.maxSupply !== '0' ? Number(token.maxSupply).toLocaleString() : 'Unlimited'}</span>
              </div>
              <div className="info-row">
                <label>Mintable</label>
                <span>{token.mintable ? 'Yes' : 'No'}</span>
              </div>
              <div className="info-row">
                <label>Tax Receiver</label>
                <span>{token.taxReceiver || 'Owner'}</span>
              </div>
            </div>
          )}

          {activeAction === 'dex' && (
            <div className="action-section">
              <p>Set the DEX pair address to enable buy/sell taxes on trades.</p>
              <div className="form-group">
                <label>DEX Pair Address</label>
                <input
                  type="text"
                  name="dexPairAddress"
                  value={formData.dexPairAddress}
                  onChange={handleChange}
                  placeholder="0x..."
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={setDexPair}
                disabled={isLoading}
              >
                {isLoading ? 'Setting...' : 'Set DEX Pair'}
              </button>
            </div>
          )}

          {activeAction === 'tax' && (
            <div className="action-section">
              <p>Update buy and sell tax percentages (max 25%).</p>
              <div className="form-row">
                <div className="form-group">
                  <label>Buy Tax (%)</label>
                  <input
                    type="number"
                    name="newBuyTax"
                    value={formData.newBuyTax}
                    onChange={handleChange}
                    min="0"
                    max="25"
                  />
                </div>
                <div className="form-group">
                  <label>Sell Tax (%)</label>
                  <input
                    type="number"
                    name="newSellTax"
                    value={formData.newSellTax}
                    onChange={handleChange}
                    min="0"
                    max="25"
                  />
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={updateTaxes}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Taxes'}
              </button>
            </div>
          )}

          {activeAction === 'mint' && (
            <div className="action-section">
              <p>Mint new tokens to any address.</p>
              <div className="form-group">
                <label>Recipient Address</label>
                <input
                  type="text"
                  name="mintTo"
                  value={formData.mintTo}
                  onChange={handleChange}
                  placeholder="0x..."
                />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  name="mintAmount"
                  value={formData.mintAmount}
                  onChange={handleChange}
                  placeholder="1000000"
                  min="0"
                />
              </div>
              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={mintTokens}
                  disabled={isLoading}
                >
                  {isLoading ? 'Minting...' : 'Mint Tokens'}
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={disableMinting}
                  disabled={isLoading}
                >
                  Disable Minting Forever
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserPanel;
