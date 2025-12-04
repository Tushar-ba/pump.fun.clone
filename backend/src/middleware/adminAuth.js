const { ethers } = require('ethers');

// Admin wallet addresses (lowercase)
const ADMIN_ADDRESSES = (process.env.ADMIN_ADDRESSES || '')
  .split(',')
  .map(addr => addr.trim().toLowerCase())
  .filter(addr => addr.length > 0);

// Store valid admin sessions (address -> { nonce, expiry })
const adminSessions = new Map();

// Generate a nonce for signing
const generateNonce = () => {
  return `Sign this message to authenticate as admin.\n\nNonce: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if address is an admin
 */
const isAdmin = (address) => {
  if (!address) return false;
  return ADMIN_ADDRESSES.includes(address.toLowerCase());
};

/**
 * Get nonce for admin authentication
 */
const getNonce = (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Address is required'
    });
  }

  if (!isAdmin(address)) {
    return res.status(403).json({
      success: false,
      error: 'Address is not an admin'
    });
  }

  const nonce = generateNonce();
  adminSessions.set(address.toLowerCase(), {
    nonce,
    expiry: Date.now() + 5 * 60 * 1000 // 5 minutes to sign
  });

  res.json({
    success: true,
    nonce
  });
};

/**
 * Verify admin signature and create session
 */
const verifyAdmin = async (req, res) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({
      success: false,
      error: 'Address and signature are required'
    });
  }

  const lowerAddress = address.toLowerCase();
  
  if (!isAdmin(lowerAddress)) {
    return res.status(403).json({
      success: false,
      error: 'Address is not an admin'
    });
  }

  const session = adminSessions.get(lowerAddress);
  if (!session || Date.now() > session.expiry) {
    return res.status(400).json({
      success: false,
      error: 'Nonce expired or not found. Please request a new nonce.'
    });
  }

  try {
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(session.nonce, signature);
    
    if (recoveredAddress.toLowerCase() !== lowerAddress) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Create a session token (simple approach - in production use JWT)
    const sessionToken = `${lowerAddress}:${Date.now()}:${Math.random().toString(36).substr(2, 16)}`;
    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    adminSessions.set(lowerAddress, {
      token: sessionToken,
      expiry: sessionExpiry
    });

    res.json({
      success: true,
      token: sessionToken,
      expiresAt: sessionExpiry
    });
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid signature'
    });
  }
};

/**
 * Middleware to protect admin routes
 */
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Admin authentication required'
    });
  }

  const token = authHeader.substring(7);
  const [address] = token.split(':');

  if (!address || !isAdmin(address)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid admin token'
    });
  }

  const session = adminSessions.get(address);
  if (!session || session.token !== token || Date.now() > session.expiry) {
    return res.status(401).json({
      success: false,
      error: 'Session expired. Please authenticate again.'
    });
  }

  // Attach admin address to request
  req.adminAddress = address;
  next();
};

/**
 * Check admin status (public endpoint)
 */
const checkAdminStatus = (req, res) => {
  const { address } = req.query;
  
  res.json({
    success: true,
    isAdmin: isAdmin(address),
    adminCount: ADMIN_ADDRESSES.length
  });
};

/**
 * Logout admin
 */
const logoutAdmin = (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const [address] = token.split(':');
    if (address) {
      adminSessions.delete(address);
    }
  }

  res.json({ success: true });
};

module.exports = {
  isAdmin,
  getNonce,
  verifyAdmin,
  requireAdmin,
  checkAdminStatus,
  logoutAdmin,
  ADMIN_ADDRESSES
};
