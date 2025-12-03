import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletContext';
import WalletButton from './components/WalletButton';
import TokenCreator from './components/TokenCreator';
import LiquidityManager from './components/LiquidityManager';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="app">
          <header className="header">
            <div className="header-content">
              <div className="logo">
                <span className="logo-icon">🚀</span>
                <span className="logo-text">TokenLaunch</span>
              </div>
              
              <nav className="nav">
                <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Create Token
                </NavLink>
                <NavLink to="/liquidity" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Add Liquidity
                </NavLink>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                  Dashboard
                </NavLink>
              </nav>
              
              <WalletButton />
            </div>
          </header>

          <main className="main">
            <Routes>
              <Route path="/" element={<TokenCreator />} />
              <Route path="/liquidity" element={<LiquidityManager />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>

          <footer className="footer">
            <p>© 2025 TokenLaunch. Deploy tokens and create liquidity pools easily.</p>
          </footer>
        </div>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            },
          }}
        />
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
