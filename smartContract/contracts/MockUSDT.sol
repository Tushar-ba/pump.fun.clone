// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing purposes on testnets
 */
contract MockUSDT is ERC20 {
    uint8 private _decimals = 6; // USDT uses 6 decimals

    constructor() ERC20("Mock Tether USD", "USDT") {
        // Mint 1 billion USDT to deployer
        _mint(msg.sender, 1_000_000_000 * 10 ** _decimals);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Allows anyone to mint tokens for testing
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in smallest units)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Faucet function - mint 10,000 USDT to caller
     */
    function faucet() external {
        _mint(msg.sender, 10_000 * 10 ** _decimals);
    }
}
