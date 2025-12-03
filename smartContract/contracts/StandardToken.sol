// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StandardToken
 * @dev A customizable ERC-20 token with optional minting, burning, and tax features
 */
contract StandardToken is ERC20, ERC20Burnable, Ownable {
    uint256 public maxSupply;
    bool public mintable;
    
    // Tax configuration
    uint256 public buyTaxPercent;
    uint256 public sellTaxPercent;
    address public taxReceiver;
    
    // DEX pair addresses for tax calculation
    mapping(address => bool) public isDexPair;
    
    // Addresses excluded from tax
    mapping(address => bool) public isExcludedFromTax;

    event TaxUpdated(uint256 buyTax, uint256 sellTax);
    event TaxReceiverUpdated(address newReceiver);
    event DexPairUpdated(address pair, bool status);
    event ExcludedFromTax(address account, bool excluded);

    /**
     * @dev Constructor to initialize the token
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param initialSupply_ Initial supply to mint (in whole tokens, will be multiplied by decimals)
     * @param maxSupply_ Maximum supply allowed (0 for unlimited)
     * @param mintable_ Whether additional tokens can be minted
     * @param buyTaxPercent_ Buy tax percentage (e.g., 5 for 5%)
     * @param sellTaxPercent_ Sell tax percentage (e.g., 5 for 5%)
     * @param taxReceiver_ Address to receive tax
     * @param owner_ Owner of the contract
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        uint256 maxSupply_,
        bool mintable_,
        uint256 buyTaxPercent_,
        uint256 sellTaxPercent_,
        address taxReceiver_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        require(buyTaxPercent_ <= 25, "Buy tax too high");
        require(sellTaxPercent_ <= 25, "Sell tax too high");
        require(maxSupply_ == 0 || initialSupply_ <= maxSupply_, "Initial supply exceeds max");
        
        maxSupply = maxSupply_ * 10 ** decimals();
        mintable = mintable_;
        buyTaxPercent = buyTaxPercent_;
        sellTaxPercent = sellTaxPercent_;
        taxReceiver = taxReceiver_ == address(0) ? owner_ : taxReceiver_;
        
        // Exclude owner and this contract from tax
        isExcludedFromTax[owner_] = true;
        isExcludedFromTax[address(this)] = true;
        
        // Mint initial supply to owner
        if (initialSupply_ > 0) {
            _mint(owner_, initialSupply_ * 10 ** decimals());
        }
    }

    /**
     * @dev Mint new tokens (only if mintable is enabled)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(mintable, "Minting disabled");
        if (maxSupply > 0) {
            require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        }
        _mint(to, amount);
    }

    /**
     * @dev Override _update to implement tax logic
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        // Skip tax for mint/burn operations or excluded addresses
        if (from == address(0) || to == address(0) || 
            isExcludedFromTax[from] || isExcludedFromTax[to]) {
            super._update(from, to, amount);
            return;
        }

        uint256 taxAmount = 0;
        
        // Buy tax (transfer from DEX pair to user)
        if (isDexPair[from] && buyTaxPercent > 0) {
            taxAmount = (amount * buyTaxPercent) / 100;
        }
        // Sell tax (transfer from user to DEX pair)
        else if (isDexPair[to] && sellTaxPercent > 0) {
            taxAmount = (amount * sellTaxPercent) / 100;
        }

        if (taxAmount > 0) {
            super._update(from, taxReceiver, taxAmount);
            amount -= taxAmount;
        }
        
        super._update(from, to, amount);
    }

    /**
     * @dev Update tax percentages
     */
    function setTaxPercent(uint256 buyTax_, uint256 sellTax_) external onlyOwner {
        require(buyTax_ <= 25, "Buy tax too high");
        require(sellTax_ <= 25, "Sell tax too high");
        buyTaxPercent = buyTax_;
        sellTaxPercent = sellTax_;
        emit TaxUpdated(buyTax_, sellTax_);
    }

    /**
     * @dev Update tax receiver address
     */
    function setTaxReceiver(address receiver_) external onlyOwner {
        require(receiver_ != address(0), "Invalid address");
        taxReceiver = receiver_;
        emit TaxReceiverUpdated(receiver_);
    }

    /**
     * @dev Set DEX pair address for tax calculation
     */
    function setDexPair(address pair_, bool status_) external onlyOwner {
        isDexPair[pair_] = status_;
        emit DexPairUpdated(pair_, status_);
    }

    /**
     * @dev Exclude or include address from tax
     */
    function setExcludedFromTax(address account_, bool excluded_) external onlyOwner {
        isExcludedFromTax[account_] = excluded_;
        emit ExcludedFromTax(account_, excluded_);
    }

    /**
     * @dev Disable minting permanently
     */
    function disableMinting() external onlyOwner {
        mintable = false;
    }
}
