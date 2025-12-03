const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("MockUSDT", (m) => {
  const mockUSDT = m.contract("MockUSDT");

  return { mockUSDT };
});
