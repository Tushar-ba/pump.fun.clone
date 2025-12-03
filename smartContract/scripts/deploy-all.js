const hre = require("hardhat");

// Sepolia configuration
const SEPOLIA_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";
const SEPOLIA_FACTORY = "0xF62c03E08ada871A0bEb309762E260a7a6a880E6";

async function main() {
  console.log("🚀 Full Deployment to", hre.network.name, "\n");
  console.log("=".repeat(50));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  const deployedContracts = {};

  // 1. Deploy MockUSDT
  console.log("1️⃣  Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  deployedContracts.mockUSDT = await mockUSDT.getAddress();
  console.log("   ✅ MockUSDT:", deployedContracts.mockUSDT);

  // 2. Deploy LiquidityHelper
  console.log("\n2️⃣  Deploying LiquidityHelper...");
  const LiquidityHelper = await hre.ethers.getContractFactory("LiquidityHelper");
  const liquidityHelper = await LiquidityHelper.deploy(SEPOLIA_ROUTER);
  await liquidityHelper.waitForDeployment();
  deployedContracts.liquidityHelper = await liquidityHelper.getAddress();
  console.log("   ✅ LiquidityHelper:", deployedContracts.liquidityHelper);

  // 3. Deploy a sample StandardToken
  console.log("\n3️⃣  Deploying Sample Token...");
  const StandardToken = await hre.ethers.getContractFactory("StandardToken");
  const sampleToken = await StandardToken.deploy(
    "Sample Token",
    "SAMPLE",
    1_000_000n,      // 1M initial supply
    10_000_000n,     // 10M max supply
    true,            // mintable
    0n,              // no buy tax
    0n,              // no sell tax
    deployer.address,
    deployer.address
  );
  await sampleToken.waitForDeployment();
  deployedContracts.sampleToken = await sampleToken.getAddress();
  console.log("   ✅ Sample Token:", deployedContracts.sampleToken);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(50));
  console.log("\nNetwork:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("Deployer:", deployer.address);
  console.log("\n📦 Deployed Contracts:");
  console.log("  MockUSDT:        ", deployedContracts.mockUSDT);
  console.log("  LiquidityHelper: ", deployedContracts.liquidityHelper);
  console.log("  Sample Token:    ", deployedContracts.sampleToken);
  console.log("\n🔗 DEX Contracts (Pre-existing):");
  console.log("  Router:          ", SEPOLIA_ROUTER);
  console.log("  Factory:         ", SEPOLIA_FACTORY);

  // Get remaining balance
  const remainingBalance = await hre.ethers.provider.getBalance(deployer.address);
  const gasUsed = balance - remainingBalance;
  console.log("\n⛽ Gas Used:", hre.ethers.formatEther(gasUsed), "ETH");
  console.log("💰 Remaining Balance:", hre.ethers.formatEther(remainingBalance), "ETH");

  // Verification commands
  console.log("\n" + "=".repeat(50));
  console.log("🔍 VERIFICATION COMMANDS");
  console.log("=".repeat(50));
  
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log(`\n# MockUSDT`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedContracts.mockUSDT}`);
    
    console.log(`\n# LiquidityHelper`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedContracts.liquidityHelper} "${SEPOLIA_ROUTER}"`);
    
    console.log(`\n# Sample Token`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${deployedContracts.sampleToken} "Sample Token" "SAMPLE" 1000000 10000000 true 0 0 "${deployer.address}" "${deployer.address}"`);
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
    dex: {
      router: SEPOLIA_ROUTER,
      factory: SEPOLIA_FACTORY
    }
  };

  const fileName = `deployment-${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    `./deployments/${fileName}`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n💾 Deployment info saved to: deployments/${fileName}`);

  return deployedContracts;
}

// Create deployments directory if it doesn't exist
const fs = require("fs");
if (!fs.existsSync("./deployments")) {
  fs.mkdirSync("./deployments");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
