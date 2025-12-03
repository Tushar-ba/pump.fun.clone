const hre = require("hardhat");

async function main() {
  console.log("Deploying MockUSDT to", hre.network.name, "...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy MockUSDT
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();

  const usdtAddress = await mockUSDT.getAddress();
  console.log("✅ MockUSDT deployed to:", usdtAddress);
  
  // Get deployer balance
  const balance = await mockUSDT.balanceOf(deployer.address);
  console.log("   Deployer USDT balance:", hre.ethers.formatUnits(balance, 6), "USDT");

  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log("Network:", hre.network.name);
  console.log("MockUSDT:", usdtAddress);
  console.log("Deployer:", deployer.address);
  
  // Verify instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify on Etherscan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${usdtAddress}`);
  }

  return { mockUSDT: usdtAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
