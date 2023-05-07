const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ICO", () => {
  async function tokenFixture() {
    const TOKEN_SUPPLY = 1000;

    const [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(TOKEN_SUPPLY);
    return { token, owner, addr1, addr2 };
  }
  async function icoFixture() {
    // const INITIAL_PRICE = ethers.utils.parseUnits("0.001", "ether");
    const { token, owner, addr1 } = await loadFixture(tokenFixture);
    const ICO = await ethers.getContractFactory("ICO");
    const ico = await ICO.deploy(token.address);
    const balance = await token.balanceOf(owner.address);
    await token.connect(owner).transfer(ico.address, balance);
    return { ico, owner, addr1 };
  }

  describe("ICO Deployment", async () => {
    // it("Initial price should be set to 0.001 ether", async () => {
    //   const { ico } = await loadFixture(icoFixture);
    //   const price = await ico.price();
    //   expect(price).equals(ethers.utils.parseUnits("0.001", "ether"));
    // });
    it("Initial Phase should be set to Phase 1", async () => {
      const { ico } = await loadFixture(icoFixture);
      const phase = await ico.currentPhase();
      expect(phase).to.be.equals(0);
    });
    it("Initial ICO should be have 1000 tokens as liquidity", async () => {
      const { token } = await loadFixture(tokenFixture);
      const { ico, owner } = await loadFixture(icoFixture);

      const icoBalance = await token.balanceOf(ico.address);

      expect(icoBalance).to.be.equals(ethers.utils.parseUnits("1000", "ether"));
    });
    it("Initial ICO Owner should not be Zero Address", async () => {
      const { ico } = await loadFixture(icoFixture);
      expect(await ico.owner()).not.be.equals(ethers.constants.AddressZero);
    });
  });

  describe("Buy Tokens Function", async () => {
    it("Amount should be greater than zero", async () => {
      const { ico, addr1 } = await loadFixture(icoFixture);
      await expect(ico.connect(addr1).buyToken(0)).to.be.revertedWith(
        "Invalid Amount"
      );
    });

    it("Buy 5 token in Phase One 1 token per 0.001ETH", async () => {
      const { token } = await loadFixture(tokenFixture);
      const { ico, addr1 } = await loadFixture(icoFixture);
      const tokenAmount = ethers.utils.parseUnits("5", "ether");
      const phaseOneFee = ethers.utils.parseUnits("0.001", "ether");
      const buy = await ico
        .connect(addr1)
        .buyToken(tokenAmount, { value: phaseOneFee * 5 });
      const tokenSold = await ico.tokenSold();
      const tokenBalance = await token.connect(addr1).balanceOf(addr1.address);
      expect(tokenBalance).to.be.equals(tokenAmount);
      expect(tokenSold).to.be.equals(tokenAmount);
    });
  });
});
