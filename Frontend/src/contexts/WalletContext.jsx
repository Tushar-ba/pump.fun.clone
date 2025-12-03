import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext(null);

// Network configurations - Sepolia only
const NETWORKS = {
  11155111: {
    name: 'Sepolia Testnet',
    currency: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/-qbD2Yd4GIC_sRvgtkTME'
  }
};

// Required chain ID
const REQUIRED_CHAIN_ID = 11155111;

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const network = NETWORKS[chainId] || null;

  // Initialize provider from window.ethereum
  const initProvider = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethProvider);
      
      // Check if already connected
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const ethSigner = await ethProvider.getSigner();
        setSigner(ethSigner);
      }

      // Get current chain
      const chainIdHex = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      setChainId(parseInt(chainIdHex, 16));
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setProvider(ethProvider);
        const ethSigner = await ethProvider.getSigner();
        setSigner(ethSigner);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
    } catch (err) {
      // If network doesn't exist, try to add it
      if (err.code === 4902 && NETWORKS[targetChainId]) {
        const net = NETWORKS[targetChainId];
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: net.name,
            nativeCurrency: {
              name: net.currency,
              symbol: net.currency,
              decimals: 18
            },
            rpcUrls: [net.rpcUrl],
            blockExplorerUrls: [net.explorer]
          }]
        });
      } else {
        throw err;
      }
    }
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    initProvider();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
        } else {
          setAccount(accounts[0]);
          initProvider();
        }
      };

      const handleChainChanged = (chainIdHex) => {
        setChainId(parseInt(chainIdHex, 16));
        initProvider();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [initProvider]);

  const value = {
    account,
    chainId,
    network,
    provider,
    signer,
    isConnecting,
    isConnected: !!account,
    error,
    connect,
    disconnect,
    switchNetwork,
    networks: NETWORKS
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export { NETWORKS };
