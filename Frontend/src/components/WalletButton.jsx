import { useWallet } from '../contexts/WalletContext';
import './WalletButton.css';

function WalletButton() {
  const { 
    account, 
    network, 
    isConnecting, 
    isConnected, 
    connect, 
    disconnect 
  } = useWallet();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <span className="network-badge">{network?.name || 'Unknown'}</span>
          <span className="wallet-address">{formatAddress(account)}</span>
        </div>
        <button className="btn btn-disconnect" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button 
      className="btn btn-connect" 
      onClick={connect}
      disabled={isConnecting}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}

export default WalletButton;
