const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get supported chains
 */
export async function getSupportedChains() {
  const response = await fetch(`${API_BASE_URL}/config/chains`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get chains');
  }
  return data;
}

/**
 * Get contract addresses for a chain
 */
export async function getContractsForChain(chainId) {
  const response = await fetch(`${API_BASE_URL}/config/contracts/${chainId}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get contracts');
  }
  return data;
}

/**
 * Get full configuration
 */
export async function getConfig(chainId) {
  const params = chainId ? `?chainId=${chainId}` : '';
  const response = await fetch(`${API_BASE_URL}/config/config${params}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get config');
  }
  return data;
}

/**
 * Generate and compile a token contract
 */
export async function generateContract(params) {
  const response = await fetch(`${API_BASE_URL}/contracts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to generate contract');
  }
  return data.data;
}

/**
 * Track a deployed token
 */
export async function trackDeployment(params) {
  const response = await fetch(`${API_BASE_URL}/contracts/track-deployment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to track deployment');
  }
  return data.data;
}

/**
 * Get all token deployments
 */
export async function getDeployments(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/contracts/deployments?${queryParams}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get deployments');
  }
  return data;
}

/**
 * Get a specific deployment by address
 */
export async function getDeployment(address) {
  const response = await fetch(`${API_BASE_URL}/contracts/deployments/${address}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get deployment');
  }
  return data.data;
}

/**
 * Track a liquidity pool
 */
export async function trackLiquidity(params) {
  const response = await fetch(`${API_BASE_URL}/liquidity/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to track liquidity');
  }
  return data.data;
}

/**
 * Get all liquidity pools
 */
export async function getLiquidityPools(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/liquidity/pools?${queryParams}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get pools');
  }
  return data;
}

/**
 * Get statistics overview
 */
export async function getStatsOverview(chainId) {
  const params = chainId ? `?chainId=${chainId}` : '';
  const response = await fetch(`${API_BASE_URL}/stats/overview${params}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get stats');
  }
  return data.data;
}

/**
 * Get recent activity
 */
export async function getRecentActivity(params = {}) {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${API_BASE_URL}/stats/recent-activity?${queryParams}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get activity');
  }
  return data.data;
}

// ============================================
// Admin API Functions
// ============================================

/**
 * Get admin nonce for wallet signature
 */
export async function getAdminNonce(address) {
  const response = await fetch(`${API_BASE_URL}/admin/nonce?address=${address}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to get nonce');
  }
  return data;
}

/**
 * Verify admin wallet signature
 */
export async function verifyAdminSignature(address, signature) {
  const response = await fetch(`${API_BASE_URL}/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Verification failed');
  }
  return data;
}

/**
 * Check if address is an admin
 */
export async function checkAdminStatus(address) {
  const response = await fetch(`${API_BASE_URL}/admin/check?address=${address}`);
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to check admin status');
  }
  return data;
}

/**
 * Admin logout
 */
export async function adminLogout() {
  const response = await fetch(`${API_BASE_URL}/admin/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  
  const data = await response.json();
  return data;
}
