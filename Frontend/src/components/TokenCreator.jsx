import { useState } from 'react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { generateContract, trackDeployment } from '../services/api';
import './TokenCreator.css';

const initialFormData = {
  name: '',
  symbol: '',
  initialSupply: '',
  maxSupply: '',
  mintable: false,
  buyTax: 0,
  sellTax: 0,
  taxReceiver: ''
};

function TokenCreator() {
  const { account, signer, chainId, network, isConnected } = useWallet();
  const [formData, setFormData] = useState(initialFormData);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deployedToken, setDeployedToken] = useState(null);
  const [contractData, setContractData] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Token name is required');
      return false;
    }
    if (!formData.symbol.trim()) {
      toast.error('Token symbol is required');
      return false;
    }
    if (formData.symbol.length > 11) {
      toast.error('Symbol must be 11 characters or less');
      return false;
    }
    if (!formData.initialSupply || parseFloat(formData.initialSupply) <= 0) {
      toast.error('Initial supply must be greater than 0');
      return false;
    }
    if (formData.maxSupply && parseFloat(formData.maxSupply) < parseFloat(formData.initialSupply)) {
      toast.error('Max supply must be greater than initial supply');
      return false;
    }
    if (formData.buyTax > 25 || formData.sellTax > 25) {
      toast.error('Tax cannot exceed 25%');
      return false;
    }
    if (formData.taxReceiver && !ethers.isAddress(formData.taxReceiver)) {
      toast.error('Invalid tax receiver address');
      return false;
    }
    return true;
  };

  const handleGenerateContract = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const data = await generateContract({
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        initialSupply: String(formData.initialSupply),
        maxSupply: formData.maxSupply ? String(formData.maxSupply) : '0',
        mintable: Boolean(formData.mintable),
        buyTax: parseInt(formData.buyTax) || 0,
        sellTax: parseInt(formData.sellTax) || 0,
        taxReceiver: formData.taxReceiver || null,
        owner: account
      });
      
      setContractData(data);
      setStep(2);
      toast.success('Contract generated successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!contractData) {
      toast.error('Please generate the contract first');
      return;
    }

    setIsLoading(true);
    try {
      // Create contract factory
      const factory = new ethers.ContractFactory(
        contractData.abi,
        contractData.bytecode,
        signer
      );

      // Deploy the contract
      toast.loading('Deploying contract...', { id: 'deploy' });
      const contract = await factory.deploy();
      
      toast.loading('Waiting for confirmation...', { id: 'deploy' });
      const receipt = await contract.deploymentTransaction().wait();
      
      const contractAddress = await contract.getAddress();
      
      // Track the deployment
      await trackDeployment({
        name: formData.name,
        symbol: formData.symbol.toUpperCase(),
        address: contractAddress,
        owner: account,
        initialSupply: formData.initialSupply,
        maxSupply: formData.maxSupply || 0,
        mintable: formData.mintable,
        burnable: true,
        buyTax: formData.buyTax,
        sellTax: formData.sellTax,
        taxReceiver: formData.taxReceiver || account,
        chainId,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        sourceCode: contractData.sourceCode
      });

      setDeployedToken({
        address: contractAddress,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber
      });
      
      setStep(3);
      toast.success('Token deployed successfully!', { id: 'deploy' });
    } catch (error) {
      console.error('Deployment error:', error);
      toast.error(error.reason || error.message, { id: 'deploy' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setStep(1);
    setContractData(null);
    setDeployedToken(null);
  };

  const downloadSourceCode = () => {
    if (!contractData) return;
    
    const blob = new Blob([contractData.flattenedSource], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.symbol}_Token.sol`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStep1 = () => (
    <div className="form-step">
      <h2>Token Details</h2>
      <p className="step-description">Enter the basic information for your token</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name">Token Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., My Awesome Token"
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label htmlFor="symbol">Symbol *</label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="e.g., MAT"
            maxLength={11}
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="initialSupply">Initial Supply *</label>
          <input
            type="number"
            id="initialSupply"
            name="initialSupply"
            value={formData.initialSupply}
            onChange={handleChange}
            placeholder="e.g., 1000000"
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxSupply">Max Supply (0 = unlimited)</label>
          <input
            type="number"
            id="maxSupply"
            name="maxSupply"
            value={formData.maxSupply}
            onChange={handleChange}
            placeholder="e.g., 10000000"
            min="0"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Token Features</h3>
        
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="mintable"
              checked={formData.mintable}
              onChange={handleChange}
            />
            <span className="checkmark"></span>
            <span>Mintable (Owner can mint new tokens)</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Tax Settings (Optional)</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="buyTax">Buy Tax (%)</label>
            <input
              type="number"
              id="buyTax"
              name="buyTax"
              value={formData.buyTax}
              onChange={handleChange}
              min="0"
              max="25"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sellTax">Sell Tax (%)</label>
            <input
              type="number"
              id="sellTax"
              name="sellTax"
              value={formData.sellTax}
              onChange={handleChange}
              min="0"
              max="25"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="taxReceiver">Tax Receiver Address</label>
            <input
              type="text"
              id="taxReceiver"
              name="taxReceiver"
              value={formData.taxReceiver}
              onChange={handleChange}
              placeholder="0x... (leave empty to use your wallet)"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          className="btn btn-primary btn-large"
          onClick={handleGenerateContract}
          disabled={isLoading || !isConnected}
        >
          {isLoading ? 'Generating...' : 'Generate Contract'}
        </button>
        {!isConnected && (
          <p className="warning-text">Please connect your wallet first</p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h2>Review & Deploy</h2>
      <p className="step-description">Review your token configuration and deploy</p>
      
      <div className="review-card">
        <h3>Token Summary</h3>
        <div className="review-grid">
          <div className="review-item">
            <span className="review-label">Name</span>
            <span className="review-value">{formData.name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Symbol</span>
            <span className="review-value">{formData.symbol.toUpperCase()}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Initial Supply</span>
            <span className="review-value">{Number(formData.initialSupply).toLocaleString()}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Max Supply</span>
            <span className="review-value">
              {formData.maxSupply ? Number(formData.maxSupply).toLocaleString() : 'Unlimited'}
            </span>
          </div>
          <div className="review-item">
            <span className="review-label">Mintable</span>
            <span className="review-value">{formData.mintable ? 'Yes' : 'No'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Buy Tax</span>
            <span className="review-value">{formData.buyTax}%</span>
          </div>
          <div className="review-item">
            <span className="review-label">Sell Tax</span>
            <span className="review-value">{formData.sellTax}%</span>
          </div>
          <div className="review-item">
            <span className="review-label">Network</span>
            <span className="review-value">{network?.name || 'Unknown'}</span>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => setStep(1)}
          disabled={isLoading}
        >
          Back
        </button>
        <button 
          className="btn btn-primary btn-large"
          onClick={handleDeploy}
          disabled={isLoading}
        >
          {isLoading ? 'Deploying...' : 'Deploy Token'}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="form-step success-step">
      <div className="success-icon">🎉</div>
      <h2>Token Deployed Successfully!</h2>
      <p className="step-description">Your token is now live on {network?.name}</p>
      
      <div className="deployed-info">
        <div className="info-item">
          <span className="info-label">Contract Address</span>
          <div className="info-value address">
            <code>{deployedToken?.address}</code>
            <button 
              className="btn-copy"
              onClick={() => {
                navigator.clipboard.writeText(deployedToken?.address);
                toast.success('Address copied!');
              }}
            >
              📋
            </button>
          </div>
        </div>
        
        <div className="info-item">
          <span className="info-label">Transaction Hash</span>
          <div className="info-value">
            <a 
              href={`${network?.explorer}/tx/${deployedToken?.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {deployedToken?.txHash?.slice(0, 20)}...
            </a>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <a 
          href={`${network?.explorer}/address/${deployedToken?.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          View on Explorer
        </a>
        <button className="btn btn-secondary" onClick={downloadSourceCode}>
          Download Source Code
        </button>
        <button className="btn btn-primary" onClick={handleReset}>
          Create Another Token
        </button>
      </div>
    </div>
  );

  return (
    <div className="token-creator">
      <div className="progress-bar">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Configure</span>
        </div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Review</span>
        </div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Success</span>
        </div>
      </div>

      <div className="form-container">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}

export default TokenCreator;
