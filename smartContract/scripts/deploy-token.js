const hre = require("hardhat");

async function main() {
  console.log("Deploying StandardToken to", hre.network.name, "...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Token configuration - modify these values as needed
  const tokenConfig = {
    name: "Test Token",
    symbol: "TEST",
    initialSupply: 1_000_000n,     // 1 million tokens
    maxSupply: 10_000_000n,        // 10 million max
    mintable: true,
    buyTax: 0n,                    // 0%
    sellTax: 0n,                   // 0%
    taxReceiver: deployer.address,
    owner: deployer.address
  };

  console.log("Token Configuration:");
  console.log("  Name:", tokenConfig.name);
  console.log("  Symbol:", tokenConfig.symbol);
  console.log("  Initial Supply:", tokenConfig.initialSupply.toLocaleString());
  console.log("  Max Supply:", tokenConfig.maxSupply.toLocaleString());
  console.log("  Mintable:", tokenConfig.mintable);
  console.log("  Buy Tax:", tokenConfig.buyTax.toString() + "%");
  console.log("  Sell Tax:", tokenConfig.sellTax.toString() + "%");
  console.log("");

  // Deploy StandardToken
  const StandardToken = await hre.ethers.getContractFactory("StandardToken");
  const token = await StandardToken.deploy(
    tokenConfig.name,
    tokenConfig.symbol,
    tokenConfig.initialSupply,
    tokenConfig.maxSupply,
    tokenConfig.mintable,
    tokenConfig.buyTax,
    tokenConfig.sellTax,
    tokenConfig.taxReceiver,
    tokenConfig.owner
  );
  await token.waitForDeployment();

  const tokenAddress = await token.getAddress();
  console.log("✅ StandardToken deployed to:", tokenAddress);

  // Get token info
  const totalSupply = await token.totalSupply();
  const decimals = await token.decimals();
  console.log("   Total Supply:", hre.ethers.formatUnits(totalSupply, decimals), tokenConfig.symbol);

  console.log("\n📋 Deployment Summary:");
  console.log("========================");
  console.log("Network:", hre.network.name);
  console.log("Token:", tokenAddress);
  console.log("Name:", tokenConfig.name);
  console.log("Symbol:", tokenConfig.symbol);
  console.log("Deployer:", deployer.address);

  // Verify instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 To verify on Etherscan:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress} "${tokenConfig.name}" "${tokenConfig.symbol}" ${tokenConfig.initialSupply} ${tokenConfig.maxSupply} ${tokenConfig.mintable} ${tokenConfig.buyTax} ${tokenConfig.sellTax} "${tokenConfig.taxReceiver}" "${tokenConfig.owner}"`);
  }

  return { token: tokenAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
