# Token Creation Tool & Liquidity Pool Creator

A full-stack dApp for creating custom ERC-20 tokens and managing liquidity pools, similar to pump.fun.

## 🏗️ Project Structure

```
├── smartContract/      # Solidity contracts (Hardhat)
├── backend/            # Node.js API server
└── Frontend/           # React + Vite frontend
```

## 🚀 Features

### Token Creator
- Create custom ERC-20 tokens with OpenZeppelin
- Configurable initial supply and max supply
- Optional minting capability
- Buy/sell tax configuration
- Burnable tokens

### Liquidity Manager
- Add liquidity to Uniswap V2 compatible DEXes
- Auto-detect existing pairs
- Optimal ratio calculation for existing pools
- Support for multiple networks

### Admin Dashboard
- Track all deployed tokens
- Monitor liquidity pools
- View recent activity
- Statistics and analytics

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally or MongoDB Atlas URI
- MetaMask or compatible Web3 wallet

### Smart Contracts

```bash
cd smartContract
npm install
npx hardhat compile
npx hardhat test
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/token-creator |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

### Supported Networks

- Ethereum Mainnet (Chain ID: 1)
- Sepolia Testnet (Chain ID: 11155111)
- Polygon (Chain ID: 137)
- BNB Smart Chain (Chain ID: 56)

## 📡 API Endpoints

### Contracts
- `POST /api/contracts/generate` - Generate and compile token contract
- `POST /api/contracts/track-deployment` - Track deployed token
- `GET /api/contracts/deployments` - List all deployments

### Liquidity
- `POST /api/liquidity/track` - Track liquidity pool creation
- `GET /api/liquidity/pools` - List all pools

### Stats
- `GET /api/stats/overview` - Get statistics overview
- `GET /api/stats/recent-activity` - Get recent activity

## 🧪 Testing

### Smart Contract Tests
```bash
cd smartContract
npx hardhat test
```

### Test on Sepolia
1. Get Sepolia ETH from a faucet
2. Connect MetaMask to Sepolia
3. Create a token via the frontend
4. Verify the contract on Etherscan

## 📦 Deployment

### Smart Contracts
```bash
cd smartContract
npx hardhat ignition deploy ./ignition/modules/Token.js --network sepolia
```

### Backend
Deploy to any Node.js hosting (Render, Railway, DigitalOcean, etc.)

### Frontend
```bash
cd Frontend
npm run build
# Deploy dist/ to Vercel, Netlify, or any static host
```

## 🔐 Security Considerations

- Tax cannot exceed 25%
- Only owner can mint (if enabled)
- Minting can be permanently disabled
- Owner and contract are excluded from tax by default

## 📄 License

MIT
