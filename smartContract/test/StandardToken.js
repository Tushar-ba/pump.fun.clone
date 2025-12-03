const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StandardToken", function () {
  let StandardToken;
  let token;
  let owner;
  let addr1;
  let addr2;
  let taxReceiver;

  const TOKEN_NAME = "Test Token";
  const TOKEN_SYMBOL = "TEST";
  const INITIAL_SUPPLY = 1000000n; // 1 million tokens
  const MAX_SUPPLY = 10000000n; // 10 million tokens
  const BUY_TAX = 5n; // 5%
  const SELL_TAX = 5n; // 5%

  beforeEach(async function () {
    [owner, addr1, addr2, taxReceiver] = await ethers.getSigners();
    
    StandardToken = await ethers.getContractFactory("StandardToken");
    token = await StandardToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY,
      MAX_SUPPLY,
      true, // mintable
      BUY_TAX,
      SELL_TAX,
      taxReceiver.address,
      owner.address
    );
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await token.name()).to.equal(TOKEN_NAME);
      expect(await token.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should mint initial supply to owner", async function () {
      const expectedSupply = INITIAL_SUPPLY * 10n ** 18n;
      expect(await token.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should set correct max supply", async function () {
      const expectedMaxSupply = MAX_SUPPLY * 10n ** 18n;
      expect(await token.maxSupply()).to.equal(expectedMaxSupply);
    });

    it("Should set correct tax configuration", async function () {
      expect(await token.buyTaxPercent()).to.equal(BUY_TAX);
      expect(await token.sellTaxPercent()).to.equal(SELL_TAX);
      expect(await token.taxReceiver()).to.equal(taxReceiver.address);
    });

    it("Should set owner as excluded from tax", async function () {
      expect(await token.isExcludedFromTax(owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint when mintable is true", async function () {
      const mintAmount = 1000n * 10n ** 18n;
      await token.mint(addr1.address, mintAmount);
      expect(await token.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow minting beyond max supply", async function () {
      const excessAmount = (MAX_SUPPLY + 1n) * 10n ** 18n;
      await expect(token.mint(addr1.address, excessAmount))
        .to.be.revertedWith("Exceeds max supply");
    });

    it("Should not allow non-owner to mint", async function () {
      const mintAmount = 1000n * 10n ** 18n;
      await expect(token.connect(addr1).mint(addr1.address, mintAmount))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should allow disabling minting permanently", async function () {
      await token.disableMinting();
      const mintAmount = 1000n * 10n ** 18n;
      await expect(token.mint(addr1.address, mintAmount))
        .to.be.revertedWith("Minting disabled");
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const burnAmount = 100n * 10n ** 18n;
      const initialBalance = await token.balanceOf(owner.address);
      
      await token.burn(burnAmount);
      
      expect(await token.balanceOf(owner.address))
        .to.equal(initialBalance - burnAmount);
    });
  });

  describe("Tax Configuration", function () {
    it("Should allow owner to update tax percentages", async function () {
      await token.setTaxPercent(3n, 4n);
      expect(await token.buyTaxPercent()).to.equal(3n);
      expect(await token.sellTaxPercent()).to.equal(4n);
    });

    it("Should not allow tax higher than 25%", async function () {
      await expect(token.setTaxPercent(26n, 5n))
        .to.be.revertedWith("Buy tax too high");
      await expect(token.setTaxPercent(5n, 26n))
        .to.be.revertedWith("Sell tax too high");
    });

    it("Should allow owner to update tax receiver", async function () {
      await token.setTaxReceiver(addr1.address);
      expect(await token.taxReceiver()).to.equal(addr1.address);
    });

    it("Should allow owner to set DEX pair", async function () {
      await token.setDexPair(addr1.address, true);
      expect(await token.isDexPair(addr1.address)).to.be.true;
    });

    it("Should allow owner to exclude addresses from tax", async function () {
      await token.setExcludedFromTax(addr1.address, true);
      expect(await token.isExcludedFromTax(addr1.address)).to.be.true;
    });
  });

  describe("Tax on Transfers", function () {
    beforeEach(async function () {
      // Setup: Set addr1 as DEX pair for testing buy/sell tax
      await token.setDexPair(addr1.address, true);
      
      // Transfer tokens to addr1 (simulating DEX pair having tokens)
      const amount = 10000n * 10n ** 18n;
      await token.transfer(addr1.address, amount);
    });

    it("Should apply buy tax when buying from DEX", async function () {
      // addr1 is DEX pair, sending to addr2 is a "buy"
      const transferAmount = 1000n * 10n ** 18n;
      const expectedTax = (transferAmount * BUY_TAX) / 100n;
      const expectedReceived = transferAmount - expectedTax;
      
      const initialTaxReceiverBalance = await token.balanceOf(taxReceiver.address);
      
      await token.connect(addr1).transfer(addr2.address, transferAmount);
      
      expect(await token.balanceOf(addr2.address)).to.equal(expectedReceived);
      expect(await token.balanceOf(taxReceiver.address))
        .to.equal(initialTaxReceiverBalance + expectedTax);
    });

    it("Should apply sell tax when selling to DEX", async function () {
      // First give addr2 some tokens
      await token.transfer(addr2.address, 2000n * 10n ** 18n);
      
      // addr2 sending to addr1 (DEX pair) is a "sell"
      const transferAmount = 1000n * 10n ** 18n;
      const expectedTax = (transferAmount * SELL_TAX) / 100n;
      
      const initialTaxReceiverBalance = await token.balanceOf(taxReceiver.address);
      const initialDexBalance = await token.balanceOf(addr1.address);
      
      await token.connect(addr2).transfer(addr1.address, transferAmount);
      
      expect(await token.balanceOf(addr1.address))
        .to.equal(initialDexBalance + transferAmount - expectedTax);
      expect(await token.balanceOf(taxReceiver.address))
        .to.equal(initialTaxReceiverBalance + expectedTax);
    });

    it("Should not apply tax for excluded addresses", async function () {
      // Exclude addr2 from tax
      await token.setExcludedFromTax(addr2.address, true);
      
      // Transfer from DEX to excluded address (no buy tax)
      const transferAmount = 1000n * 10n ** 18n;
      
      await token.connect(addr1).transfer(addr2.address, transferAmount);
      
      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should not apply tax for regular transfers", async function () {
      // addr2 is not a DEX pair, so no tax should apply
      await token.transfer(addr2.address, 1000n * 10n ** 18n);
      
      const transferAmount = 500n * 10n ** 18n;
      const addr2InitialBalance = await token.balanceOf(addr2.address);
      
      // Create addr3
      const [, , , , addr3] = await ethers.getSigners();
      
      await token.connect(addr2).transfer(addr3.address, transferAmount);
      
      // No tax should be applied
      expect(await token.balanceOf(addr3.address)).to.equal(transferAmount);
      expect(await token.balanceOf(addr2.address))
        .to.equal(addr2InitialBalance - transferAmount);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero initial supply", async function () {
      const zeroSupplyToken = await StandardToken.deploy(
        "Zero Token",
        "ZERO",
        0n,
        MAX_SUPPLY,
        true,
        0n,
        0n,
        taxReceiver.address,
        owner.address
      );
      await zeroSupplyToken.waitForDeployment();
      
      expect(await zeroSupplyToken.totalSupply()).to.equal(0n);
    });

    it("Should handle unlimited max supply (0)", async function () {
      const unlimitedToken = await StandardToken.deploy(
        "Unlimited Token",
        "UNL",
        INITIAL_SUPPLY,
        0n, // unlimited
        true,
        0n,
        0n,
        taxReceiver.address,
        owner.address
      );
      await unlimitedToken.waitForDeployment();
      
      expect(await unlimitedToken.maxSupply()).to.equal(0n);
      
      // Should be able to mint any amount
      const hugeAmount = 1000000000n * 10n ** 18n;
      await unlimitedToken.mint(addr1.address, hugeAmount);
      expect(await unlimitedToken.balanceOf(addr1.address)).to.equal(hugeAmount);
    });

    it("Should handle non-mintable token", async function () {
      const nonMintableToken = await StandardToken.deploy(
        "Non Mintable",
        "NMINT",
        INITIAL_SUPPLY,
        MAX_SUPPLY,
        false, // not mintable
        0n,
        0n,
        taxReceiver.address,
        owner.address
      );
      await nonMintableToken.waitForDeployment();
      
      await expect(nonMintableToken.mint(addr1.address, 1000n))
        .to.be.revertedWith("Minting disabled");
    });
  });
});
