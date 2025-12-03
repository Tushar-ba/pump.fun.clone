const hre = require("hardhat");

// Configuration - UPDATE THESE ADDRESSES AFTER DEPLOYMENT
const CONFIG = {
  sepolia: {
    router: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
    factory: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6",
    mockUSDT: "", // Fill after deploying MockUSDT
    token: "",    // Fill after deploying your token
  }
};

async function main() {
  const networkName = hre.network.name;
  const config = CONFIG[networkName];
  
  if (!config) {
    throw new Error(`Network ${networkName} not configured`);
  }

  console.log("🔄 Creating Liquidity Pool on", networkName, "\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  if (!config.token || !config.mockUSDT) {
    throw new Error("Please update CONFIG with deployed token and MockUSDT addresses");
  }

  // Get contract instances
  const token = await hre.ethers.getContractAt("StandardToken", config.token);
  const usdt = await hre.ethers.getContractAt("MockUSDT", config.mockUSDT);
  
  const tokenSymbol = await token.symbol();
  const tokenDecimals = await token.decimals();
  const usdtDecimals = await usdt.decimals();

  console.log("Token:", tokenSymbol, "at", config.token);
  console.log("USDT at:", config.mockUSDT);

  // Amounts for liquidity
  const tokenAmount = hre.ethers.parseUnits("100000", tokenDecimals); // 100k tokens
  const usdtAmount = hre.ethers.parseUnits("1000", usdtDecimals);     // 1000 USDT

  console.log("\nLiquidity amounts:");
  console.log("  Token:", hre.ethers.formatUnits(tokenAmount, tokenDecimals), tokenSymbol);
  console.log("  USDT:", hre.ethers.formatUnits(usdtAmount, usdtDecimals), "USDT");

  // Check balances
  const tokenBalance = await token.balanceOf(deployer.address);
  const usdtBalance = await usdt.balanceOf(deployer.address);

  console.log("\nYour balances:");
  console.log("  Token:", hre.ethers.formatUnits(tokenBalance, tokenDecimals), tokenSymbol);
  console.log("  USDT:", hre.ethers.formatUnits(usdtBalance, usdtDecimals), "USDT");

  if (tokenBalance < tokenAmount) {
    throw new Error("Insufficient token balance");
  }

  // Mint USDT if needed (it's a mock token)
  if (usdtBalance < usdtAmount) {
    console.log("\n⏳ Minting USDT...");
    const mintTx = await usdt.mint(deployer.address, usdtAmount - usdtBalance);
    await mintTx.wait();
    console.log("   ✅ USDT minted");
  }

  // Approve router
  console.log("\n⏳ Approving tokens for router...");
  
  const tokenAllowance = await token.allowance(deployer.address, config.router);
  if (tokenAllowance < tokenAmount) {
    const approveTx1 = await token.approve(config.router, hre.ethers.MaxUint256);
    await approveTx1.wait();
    console.log("   ✅ Token approved");
  }

  const usdtAllowance = await usdt.allowance(deployer.address, config.router);
  if (usdtAllowance < usdtAmount) {
    const approveTx2 = await usdt.approve(config.router, hre.ethers.MaxUint256);
    await approveTx2.wait();
    console.log("   ✅ USDT approved");
  }

  // Add liquidity
  console.log("\n⏳ Adding liquidity...");
  
  const routerABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
    "function factory() external view returns (address)"
  ];
  
  const router = new hre.ethers.Contract(config.router, routerABI, deployer);
  
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
  
  const tx = await router.addLiquidity(
    config.token,
    config.mockUSDT,
    tokenAmount,
    usdtAmount,
    tokenAmount * 95n / 100n,  // 5% slippage
    usdtAmount * 95n / 100n,
    deployer.address,
    deadline
  );

  console.log("   Transaction hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("   ✅ Liquidity added! Gas used:", receipt.gasUsed.toString());

  // Get pair address
  const factoryABI = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)"
  ];
  const factory = new hre.ethers.Contract(config.factory, factoryABI, deployer);
  const pairAddress = await factory.getPair(config.token, config.mockUSDT);
  
  console.log("\n📋 Summary:");
  console.log("========================");
  console.log("Pair Address:", pairAddress);
  console.log("Token:", config.token);
  console.log("USDT:", config.mockUSDT);
  console.log("Transaction:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
