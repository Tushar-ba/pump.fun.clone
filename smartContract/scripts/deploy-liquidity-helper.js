const hre = require("hardhat");

// Network-specific router addresses
const ROUTERS = {
  sepolia: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3",
  mainnet: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  bsc: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  polygon: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
};

async function main() {
  const networkName = hre.network.name;
  console.log("Deploying LiquidityHelper to", networkName, "...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Get router address for network
  const routerAddress = ROUTERS[networkName];
  if (!routerAddress) {
    throw new Error(`No router configured for network: ${networkName}. Add it to the ROUTERS object.`);
  }
  console.log("Using Router:", routerAddress);

  // Deploy LiquidityHelper
  const LiquidityHelper = await hre.ethers.getContractFactory("LiquidityHelper");
  const liquidityHelper = await LiquidityHelper.deploy(routerAddress);
  await liquidityHelper.waitForDeployment();

  const helperAddress = await liquidityHelper.getAddress();
  console.log("\n✅ LiquidityHelper deployed to:", helperAddress);

  // Get factory address from router
  const factory = await liquidityHelper.factory();
  console.log("   Factory:", factory);

  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log("Network:", networkName);
  console.log("LiquidityHelper:", helperAddress);
  console.log("Router:", routerAddress);
  console.log("Factory:", factory);
  console.log("Deployer:", deployer.address);

  // Verify instructions
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("\n🔍 To verify on Etherscan:");
    console.log(`npx hardhat verify --network ${networkName} ${helperAddress} "${routerAddress}"`);
  }

  return { liquidityHelper: helperAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
