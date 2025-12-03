import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getStatsOverview, getRecentActivity } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const { chainId, network } = useWallet();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [statsData, activityData] = await Promise.all([
        getStatsOverview(chainId),
        getRecentActivity({ chainId, limit: 10 })
      ]);
      
      setStats(statsData);
      setActivity(activityData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [chainId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-state">
          <h3>Unable to load dashboard</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="subtitle">
          Overview for {network?.name || 'All Networks'}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalTokens || 0}</span>
            <span className="stat-label">Tokens Created</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💧</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.totalPools || 0}</span>
            <span className="stat-label">Liquidity Pools</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <span className="stat-value">
              {stats?.recentTokens?.length || 0}
            </span>
            <span className="stat-label">Recent Tokens</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <span className="stat-value">
              {stats?.recentPools?.length || 0}
            </span>
            <span className="stat-label">Recent Pools</span>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h2>Recent Tokens</h2>
          {stats?.recentTokens?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>Supply</th>
                    <th>Address</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTokens.map((token, idx) => (
                    <tr key={idx}>
                      <td>{token.name}</td>
                      <td className="symbol">{token.symbol}</td>
                      <td>{Number(token.initialSupply).toLocaleString()}</td>
                      <td>
                        <a 
                          href={`${network?.explorer}/address/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="address-link"
                        >
                          {formatAddress(token.address)}
                        </a>
                      </td>
                      <td className="date">{formatDate(token.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No tokens created yet</p>
            </div>
          )}
        </div>

        <div className="section">
          <h2>Recent Liquidity Pools</h2>
          {stats?.recentPools?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Token Amount</th>
                    <th>ETH Amount</th>
                    <th>DEX</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPools.map((pool, idx) => (
                    <tr key={idx}>
                      <td className="pair">
                        {pool.tokenA.symbol}/{pool.tokenB.symbol}
                      </td>
                      <td>{Number(pool.tokenA.amount).toLocaleString()}</td>
                      <td>{Number(pool.tokenB.amount).toLocaleString()}</td>
                      <td>{pool.dexName}</td>
                      <td className="date">{formatDate(pool.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No liquidity pools created yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="section activity-section">
        <h2>Recent Activity</h2>
        {activity.length > 0 ? (
          <div className="activity-feed">
            {activity.map((item, idx) => (
              <div key={idx} className="activity-item">
                <div className={`activity-icon ${item.type}`}>
                  {item.type === 'token_created' ? '🪙' : '💧'}
                </div>
                <div className="activity-content">
                  <span className="activity-title">
                    {item.type === 'token_created' 
                      ? `Token "${item.data.name}" created`
                      : `Liquidity added for ${item.data.tokenA.symbol}/${item.data.tokenB.symbol}`
                    }
                  </span>
                  <span className="activity-time">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <a 
                  href={`${network?.explorer}/tx/${item.data.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="activity-link"
                >
                  View →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
