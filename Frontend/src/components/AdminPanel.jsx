import { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import { useWallet } from '../contexts/WalletContext';
import './AdminPanel.css';

function AdminPanel() {
  const { account, network } = useWallet();
  const { isAdmin, isAuthenticated, isLoading, error, authenticate, logout, adminFetch } = useAdmin();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [pools, setPools] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dashboard data
  const fetchDashboard = async () => {
    if (!isAuthenticated) return;
    
    setLoadingData(true);
    try {
      const data = await adminFetch('/dashboard');
      setDashboardData(data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch tokens
  const fetchTokens = async (page = 1) => {
    if (!isAuthenticated) return;
    
    setLoadingData(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (searchQuery) params.append('search', searchQuery);
      
      const data = await adminFetch(`/tokens?${params}`);
      setTokens(data.data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Tokens fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch pools
  const fetchPools = async (page = 1) => {
    if (!isAuthenticated) return;
    
    setLoadingData(true);
    try {
      const data = await adminFetch(`/pools?page=${page}&limit=20`);
      setPools(data.data);
    } catch (err) {
      console.error('Pools fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    if (!isAuthenticated) return;
    
    setLoadingData(true);
    try {
      const data = await adminFetch('/analytics?days=30');
      setAnalytics(data.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoadingData(false);
    }
  };

  // Delete token
  const deleteToken = async (address) => {
    if (!confirm('Are you sure you want to delete this token record?')) return;
    
    try {
      await adminFetch(`/tokens/${address}`, { method: 'DELETE' });
      fetchTokens(currentPage);
    } catch (err) {
      console.error('Delete token error:', err);
    }
  };

  // Delete pool
  const deletePool = async (address) => {
    if (!confirm('Are you sure you want to delete this pool record?')) return;
    
    try {
      await adminFetch(`/pools/${address}`, { method: 'DELETE' });
      fetchPools();
    } catch (err) {
      console.error('Delete pool error:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'tokens') {
      fetchTokens();
    } else if (isAuthenticated && activeTab === 'pools') {
      fetchPools();
    } else if (isAuthenticated && activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [isAuthenticated, activeTab]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="admin-panel">
        <div className="admin-access-denied">
          <div className="access-icon">🔒</div>
          <h2>Admin Access Required</h2>
          <p>
            {account 
              ? 'Your connected wallet is not authorized as an admin.'
              : 'Please connect your wallet to access the admin panel.'}
          </p>
          <p className="connected-address">
            {account && `Connected: ${formatAddress(account)}`}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <div className="admin-login">
          <div className="login-icon">🔐</div>
          <h2>Admin Authentication</h2>
          <p>Sign a message with your wallet to verify admin access.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            className="btn btn-primary btn-large"
            onClick={authenticate}
            disabled={isLoading}
          >
            {isLoading ? 'Signing...' : 'Sign to Authenticate'}
          </button>
          
          <p className="wallet-info">
            Connected as: {formatAddress(account)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-title">
          <h1>🛡️ Admin Panel</h1>
          <span className="admin-badge">Authenticated</span>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab ${activeTab === 'tokens' ? 'active' : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          🪙 Tokens
        </button>
        <button 
          className={`tab ${activeTab === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('pools')}
        >
          💧 Pools
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      <div className="admin-content">
        {loadingData && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        {activeTab === 'dashboard' && dashboardData && (
          <div className="dashboard-content">
            <div className="stats-row">
              <div className="stat-card admin">
                <span className="stat-value">{dashboardData.stats.totalTokens}</span>
                <span className="stat-label">Total Tokens</span>
              </div>
              <div className="stat-card admin">
                <span className="stat-value">{dashboardData.stats.totalPools}</span>
                <span className="stat-label">Total Pools</span>
              </div>
              <div className="stat-card admin highlight">
                <span className="stat-value">{dashboardData.stats.tokensToday}</span>
                <span className="stat-label">Tokens Today</span>
              </div>
              <div className="stat-card admin highlight">
                <span className="stat-value">{dashboardData.stats.poolsToday}</span>
                <span className="stat-label">Pools Today</span>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="section">
                <h3>Recent Tokens</h3>
                <div className="mini-table">
                  {dashboardData.recentTokens.map((token, idx) => (
                    <div key={idx} className="mini-row">
                      <span className="token-name">{token.name} ({token.symbol})</span>
                      <span className="token-address">
                        <a href={`${network?.explorer}/address/${token.address}`} target="_blank" rel="noopener noreferrer">
                          {formatAddress(token.address)}
                        </a>
                      </span>
                      <span className="token-date">{formatDate(token.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <h3>Top Creators</h3>
                <div className="mini-table">
                  {dashboardData.topCreators.map((creator, idx) => (
                    <div key={idx} className="mini-row">
                      <span className="rank">#{idx + 1}</span>
                      <span className="creator-address">{formatAddress(creator._id)}</span>
                      <span className="creator-count">{creator.count} tokens</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="tokens-content">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchTokens(1)}
              />
              <button className="btn btn-primary" onClick={() => fetchTokens(1)}>
                Search
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table admin">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>Address</th>
                    <th>Owner</th>
                    <th>Supply</th>
                    <th>Tax</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, idx) => (
                    <tr key={idx}>
                      <td>{token.name}</td>
                      <td className="symbol">{token.symbol}</td>
                      <td>
                        <a href={`${network?.explorer}/address/${token.address}`} target="_blank" rel="noopener noreferrer">
                          {formatAddress(token.address)}
                        </a>
                      </td>
                      <td>{formatAddress(token.owner)}</td>
                      <td>{Number(token.initialSupply).toLocaleString()}</td>
                      <td>{token.buyTax}/{token.sellTax}%</td>
                      <td>{formatDate(token.createdAt)}</td>
                      <td>
                        <button 
                          className="btn-icon delete"
                          onClick={() => deleteToken(token.address)}
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pools' && (
          <div className="pools-content">
            <div className="data-table-container">
              <table className="data-table admin">
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Pair Address</th>
                    <th>Token Amount</th>
                    <th>ETH Amount</th>
                    <th>DEX</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool, idx) => (
                    <tr key={idx}>
                      <td className="pair">{pool.tokenA?.symbol}/{pool.tokenB?.symbol}</td>
                      <td>
                        <a href={`${network?.explorer}/address/${pool.pairAddress}`} target="_blank" rel="noopener noreferrer">
                          {formatAddress(pool.pairAddress)}
                        </a>
                      </td>
                      <td>{Number(pool.tokenA?.amount || 0).toLocaleString()}</td>
                      <td>{Number(pool.tokenB?.amount || 0).toLocaleString()}</td>
                      <td>{pool.dexName}</td>
                      <td>{formatDate(pool.createdAt)}</td>
                      <td>
                        <button 
                          className="btn-icon delete"
                          onClick={() => deletePool(pool.pairAddress)}
                          title="Delete record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="analytics-content">
            <div className="chart-section">
              <h3>Tokens Created (Last 30 Days)</h3>
              <div className="simple-chart">
                {analytics.tokensByDay.map((day, idx) => (
                  <div key={idx} className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: `${Math.max(day.count * 20, 5)}px`,
                        background: 'var(--primary-color)'
                      }}
                      title={`${day._id}: ${day.count} tokens`}
                    />
                    <span className="chart-label">{day._id.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Tokens by Chain</h4>
                <div className="breakdown-list">
                  {analytics.tokensByChain.map((chain, idx) => (
                    <div key={idx} className="breakdown-item">
                      <span>Chain {chain._id}</span>
                      <span className="count">{chain.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="analytics-card">
                <h4>Pools by DEX</h4>
                <div className="breakdown-list">
                  {analytics.poolsByDex.map((dex, idx) => (
                    <div key={idx} className="breakdown-item">
                      <span>{dex._id || 'Unknown'}</span>
                      <span className="count">{dex.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
