import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContext';

const AdminContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_URL || ' https://pump-fun-clone.onrender.com/api';

export function AdminProvider({ children }) {
  const { account, signer, isConnected } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if connected wallet is an admin
  const checkAdminStatus = useCallback(async () => {
    if (!account) {
      setIsAdmin(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/check?address=${account}`);
      const data = await response.json();
      setIsAdmin(data.isAdmin);
      
      // Check if we have a valid stored token
      const storedToken = localStorage.getItem('adminToken');
      if (storedToken && data.isAdmin) {
        const [tokenAddress] = storedToken.split(':');
        if (tokenAddress === account.toLowerCase()) {
          setAdminToken(storedToken);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminToken');
        }
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  }, [account]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Authenticate as admin using signature
  const authenticate = useCallback(async () => {
    if (!account || !signer || !isAdmin) {
      setError('Not an admin or wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get nonce
      const nonceResponse = await fetch(`${API_BASE_URL}/admin/nonce?address=${account}`);
      const nonceData = await nonceResponse.json();
      
      if (!nonceData.success) {
        throw new Error(nonceData.error);
      }

      // Sign the nonce
      const signature = await signer.signMessage(nonceData.nonce);

      // Verify signature
      const verifyResponse = await fetch(`${API_BASE_URL}/admin/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: account, signature })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        throw new Error(verifyData.error);
      }

      // Store token
      setAdminToken(verifyData.token);
      setIsAuthenticated(true);
      localStorage.setItem('adminToken', verifyData.token);

      return true;
    } catch (err) {
      console.error('Admin authentication error:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [account, signer, isAdmin]);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (adminToken) {
        await fetch(`${API_BASE_URL}/admin/logout`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${adminToken}` 
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    }

    setAdminToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminToken');
  }, [adminToken]);

  // Make authenticated admin API requests
  const adminFetch = useCallback(async (endpoint, options = {}) => {
    if (!adminToken) {
      throw new Error('Not authenticated as admin');
    }

    const response = await fetch(`${API_BASE_URL}/admin${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!data.success) {
      if (response.status === 401) {
        // Token expired
        logout();
      }
      throw new Error(data.error);
    }

    return data;
  }, [adminToken, logout]);

  // Clear auth on account change
  useEffect(() => {
    if (!isConnected) {
      setIsAdmin(false);
      setIsAuthenticated(false);
      setAdminToken(null);
      localStorage.removeItem('adminToken');
    }
  }, [isConnected]);

  const value = {
    isAdmin,
    isAuthenticated,
    isLoading,
    error,
    authenticate,
    logout,
    adminFetch,
    adminToken
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
