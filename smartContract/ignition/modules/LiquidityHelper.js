const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Sepolia Uniswap V2 Router address
const SEPOLIA_ROUTER = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

module.exports = buildModule("LiquidityHelper", (m) => {
  const routerAddress = m.getParameter("routerAddress", SEPOLIA_ROUTER);
  
  const liquidityHelper = m.contract("LiquidityHelper", [routerAddress]);

  return { liquidityHelper };
});
