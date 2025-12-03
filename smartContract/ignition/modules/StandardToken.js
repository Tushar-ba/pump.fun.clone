const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StandardToken", (m) => {
  // Token parameters
  const name = m.getParameter("name", "Test Token");
  const symbol = m.getParameter("symbol", "TEST");
  const initialSupply = m.getParameter("initialSupply", 1_000_000n);
  const maxSupply = m.getParameter("maxSupply", 10_000_000n);
  const mintable = m.getParameter("mintable", true);
  const buyTax = m.getParameter("buyTax", 0n);
  const sellTax = m.getParameter("sellTax", 0n);
  const taxReceiver = m.getParameter("taxReceiver", "0x49f51e3C94B459677c3B1e611DB3E44d4E6b1D55");
  const owner = m.getParameter("owner", m.getAccount(0));

  const token = m.contract("StandardToken", [
    name,
    symbol,
    initialSupply,
    maxSupply,
    mintable,
    buyTax,
    sellTax,
    taxReceiver,
    owner
  ]);

  return { token };
});
