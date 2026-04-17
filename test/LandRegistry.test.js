// test/LandRegistry.test.js
// Run with: npx hardhat test

const { expect } = require("chai");
const { ethers }  = require("hardhat");
// ✅ FIX 1: Import hardhat-chai-matchers — this enables .revertedWith(), .emit(), .reverted
require("@nomicfoundation/hardhat-chai-matchers");

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const ETH  = (n) => ethers.parseEther(String(n));
const ZERO = ethers.ZeroAddress;

describe("LandRegistry — Full Test Suite", function () {

  let contract;
  let gov, bank, owner1, owner2, buyer, stranger, attacker;

  // Deploy a fresh contract before every test
  beforeEach(async () => {
    [gov, bank, owner1, owner2, buyer, stranger, attacker] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("LandRegistry");
    contract = await Factory.deploy(gov.address, bank.address);
    await contract.waitForDeployment();
  });

  // ═══════════════════════════════════════════
  // 1. DEPLOYMENT
  // ═══════════════════════════════════════════
  describe("1. Deployment", () => {

    it("1.1 sets government address correctly", async () => {
      expect(await contract.government()).to.equal(gov.address);
    });

    it("1.2 sets bank address correctly", async () => {
      expect(await contract.bank()).to.equal(bank.address);
    });

    it("1.3 reverts if government address is zero", async () => {
      const Factory = await ethers.getContractFactory("LandRegistry");
      await expect(Factory.deploy(ZERO, bank.address))
        .to.be.revertedWith("Invalid government address");
    });

    it("1.4 reverts if bank address is zero", async () => {
      const Factory = await ethers.getContractFactory("LandRegistry");
      await expect(Factory.deploy(gov.address, ZERO))
        .to.be.revertedWith("Invalid bank address");
    });
  });

  // ═══════════════════════════════════════════
  // 2. LAND REGISTRATION
  // ═══════════════════════════════════════════
  describe("2. Land Registration", () => {

    it("2.1 government can register a land parcel", async () => {
      await expect(
        contract.connect(gov).registerLand(
          1, owner1.address, "26.9124,75.7873", 500, "ipfs://docHash1"
        )
      ).to.emit(contract, "LandRegistered")
       .withArgs(1, owner1.address);

      const land = await contract.getLandDetails(1);
      expect(land.owner).to.equal(owner1.address);
      // ✅ FIX 2: Compare BigInt properly — use Number() or BigInt literal
      expect(Number(land.areaSqMeters)).to.equal(500);
      expect(land.isRegistered).to.be.true;
      expect(land.isForSale).to.be.false;
      expect(land.hasLien).to.be.false;
      expect(land.isDisputed).to.be.false;
    });

    it("2.2 non-government cannot register land", async () => {
      await expect(
        contract.connect(stranger).registerLand(
          1, owner1.address, "26.9124,75.7873", 500, "ipfs://docHash1"
        )
      ).to.be.revertedWith("Only government can do this");
    });

    it("2.3 cannot register the same landId twice", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://docHash1"
      );
      await expect(
        contract.connect(gov).registerLand(
          1, owner2.address, "27.0,76.0", 600, "ipfs://docHash2"
        )
      ).to.be.revertedWith("Land already registered");
    });

    it("2.4 same land registered by different users with same ID is blocked", async () => {
      await contract.connect(gov).registerLand(
        10, owner1.address, "26.9124,75.7873", 500, "ipfs://hash1"
      );
      await expect(
        contract.connect(gov).registerLand(
          10, owner2.address, "26.9124,75.7873", 500, "ipfs://hash2"
        )
      ).to.be.revertedWith("Land already registered");
    });

    it("2.5 different land IDs can be registered independently", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash1"
      );
      await contract.connect(gov).registerLand(
        2, owner2.address, "27.0000,76.0000", 800, "ipfs://hash2"
      );

      const land1 = await contract.getLandDetails(1);
      const land2 = await contract.getLandDetails(2);

      expect(land1.owner).to.equal(owner1.address);
      expect(land2.owner).to.equal(owner2.address);
    });

    it("2.6 reverts if owner address is zero", async () => {
      await expect(
        contract.connect(gov).registerLand(
          1, ZERO, "26.9124,75.7873", 500, "ipfs://hash"
        )
      ).to.be.revertedWith("Invalid owner address");
    });

    it("2.7 reverts if area is zero", async () => {
      await expect(
        contract.connect(gov).registerLand(
          1, owner1.address, "26.9124,75.7873", 0, "ipfs://hash"
        )
      ).to.be.revertedWith("Area must be greater than 0");
    });

    it("2.8 reverts if GPS coordinates are empty", async () => {
      await expect(
        contract.connect(gov).registerLand(
          1, owner1.address, "", 500, "ipfs://hash"
        )
      ).to.be.revertedWith("GPS coordinates required");
    });

    it("2.9 getLandDetails reverts for unregistered land", async () => {
      await expect(contract.getLandDetails(999))
        .to.be.revertedWith("Land not found");
    });

    it("2.10 first history entry is recorded on registration", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
      const hist = await contract.getLandHistory(1);
      // ✅ FIX 2: hist.length is a JS number, hist[0].price is BigInt
      expect(hist.length).to.equal(1);
      expect(hist[0].previousOwner).to.equal(ZERO);
      expect(hist[0].newOwner).to.equal(owner1.address);
      expect(hist[0].price).to.equal(0n); // ✅ Use BigInt literal 0n
    });
  });

  // ═══════════════════════════════════════════
  // 3. LISTING FOR SALE
  // ═══════════════════════════════════════════
  describe("3. Listing For Sale", () => {

    beforeEach(async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
    });

    it("3.1 owner can list land for sale", async () => {
      await expect(
        contract.connect(owner1).listForSale(1, ETH(1))
      ).to.emit(contract, "ListedForSale").withArgs(1, ETH(1));

      const land = await contract.getLandDetails(1);
      expect(land.isForSale).to.be.true;
      expect(land.salePrice).to.equal(ETH(1));
    });

    it("3.2 non-owner cannot list land for sale", async () => {
      await expect(
        contract.connect(stranger).listForSale(1, ETH(1))
      ).to.be.revertedWith("You are not the owner");
    });

    it("3.3 cannot list with zero price", async () => {
      await expect(
        contract.connect(owner1).listForSale(1, 0)
      ).to.be.revertedWith("Price must be greater than 0");
    });

    it("3.4 cannot list if already listed", async () => {
      await contract.connect(owner1).listForSale(1, ETH(1));
      await expect(
        contract.connect(owner1).listForSale(1, ETH(2))
      ).to.be.revertedWith("Already listed for sale");
    });

    it("3.5 cannot list a disputed land", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await expect(
        contract.connect(owner1).listForSale(1, ETH(1))
      ).to.be.revertedWith("Cannot list: land is disputed");
    });

    it("3.6 cannot list land with active lien", async () => {
      await contract.connect(bank).addLien(1);
      await expect(
        contract.connect(owner1).listForSale(1, ETH(1))
      ).to.be.revertedWith("Cannot list: active mortgage exists");
    });

    it("3.7 owner can cancel a listing", async () => {
      await contract.connect(owner1).listForSale(1, ETH(1));
      await expect(
        contract.connect(owner1).cancelListing(1)
      ).to.emit(contract, "SaleCancelled").withArgs(1);

      const land = await contract.getLandDetails(1);
      expect(land.isForSale).to.be.false;
      expect(land.salePrice).to.equal(0n); // ✅ BigInt literal
    });

    it("3.8 cannot cancel a listing that doesn't exist", async () => {
      await expect(
        contract.connect(owner1).cancelListing(1)
      ).to.be.revertedWith("Land is not listed for sale");
    });

    it("3.9 non-owner cannot cancel listing", async () => {
      await contract.connect(owner1).listForSale(1, ETH(1));
      await expect(
        contract.connect(stranger).cancelListing(1)
      ).to.be.revertedWith("You are not the owner");
    });
  });

  // ═══════════════════════════════════════════
  // 4. BUYING LAND
  // ═══════════════════════════════════════════
  describe("4. Buying Land", () => {

    beforeEach(async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
      await contract.connect(owner1).listForSale(1, ETH(1));
    });

    it("4.1 buyer can purchase listed land", async () => {
      await expect(
        contract.connect(buyer).buyLand(1, { value: ETH(1) })
      ).to.emit(contract, "LandBought")
       .withArgs(1, buyer.address, ETH(1));

      const land = await contract.getLandDetails(1);
      expect(land.owner).to.equal(buyer.address);
      expect(land.isForSale).to.be.false;
    });

    it("4.2 seller receives payment after sale", async () => {
      const before = await ethers.provider.getBalance(owner1.address);
      await contract.connect(buyer).buyLand(1, { value: ETH(1) });
      const after = await ethers.provider.getBalance(owner1.address);
      expect(after - before).to.equal(ETH(1));
    });

    it("4.3 ownership history is updated after purchase", async () => {
      await contract.connect(buyer).buyLand(1, { value: ETH(1) });
      const hist = await contract.getLandHistory(1);
      expect(hist.length).to.equal(2);
      expect(hist[1].previousOwner).to.equal(owner1.address);
      expect(hist[1].newOwner).to.equal(buyer.address);
      expect(hist[1].price).to.equal(ETH(1));
    });

    it("4.4 cannot buy land that is not listed", async () => {
      await contract.connect(owner1).cancelListing(1);
      await expect(
        contract.connect(buyer).buyLand(1, { value: ETH(1) })
      ).to.be.revertedWith("Land is not for sale");
    });

    it("4.5 cannot buy with insufficient payment", async () => {
      await expect(
        contract.connect(buyer).buyLand(1, { value: ETH(0.5) })
      ).to.be.revertedWith("Payment is not enough");
    });

    it("4.6 owner cannot buy their own land", async () => {
      await expect(
        contract.connect(owner1).buyLand(1, { value: ETH(1) })
      ).to.be.revertedWith("You already own this land");
    });

    it("4.7 cannot buy disputed land", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await expect(
        contract.connect(buyer).buyLand(1, { value: ETH(1) })
      ).to.be.revertedWith("Land is under active dispute");
    });

    it("4.8 new owner can re-list and resell after purchase", async () => {
      await contract.connect(buyer).buyLand(1, { value: ETH(1) });
      await contract.connect(buyer).listForSale(1, ETH(2));
      await contract.connect(owner2).buyLand(1, { value: ETH(2) });

      const land = await contract.getLandDetails(1);
      expect(land.owner).to.equal(owner2.address);

      const hist = await contract.getLandHistory(1);
      expect(hist.length).to.equal(3);
    });

    it("4.9 simultaneous registration of same landId — second is blocked", async () => {
      await contract.connect(gov).registerLand(
        99, owner1.address, "28.0,77.0", 300, "ipfs://A"
      );
      await expect(
        contract.connect(gov).registerLand(
          99, owner2.address, "28.0,77.0", 300, "ipfs://B"
        )
      ).to.be.revertedWith("Land already registered");
    });

    it("4.10 buyer with exact payment succeeds", async () => {
      await expect(
        contract.connect(buyer).buyLand(1, { value: ETH(1) })
      ).to.not.be.reverted;
    });

    it("4.11 buyer can pay more than asking price", async () => {
      await expect(
        contract.connect(buyer).buyLand(1, { value: ETH(2) })
      ).to.not.be.reverted;

      const land = await contract.getLandDetails(1);
      expect(land.owner).to.equal(buyer.address);
    });
  });

  // ═══════════════════════════════════════════
  // 5. LIEN / MORTGAGE
  // ═══════════════════════════════════════════
  describe("5. Lien / Mortgage", () => {

    beforeEach(async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
    });

    it("5.1 bank can add a lien", async () => {
      await expect(
        contract.connect(bank).addLien(1)
      ).to.emit(contract, "LienAdded").withArgs(1, bank.address);

      const land = await contract.getLandDetails(1);
      expect(land.hasLien).to.be.true;
      expect(land.isForSale).to.be.false;
    });

    it("5.2 non-bank cannot add a lien", async () => {
      await expect(
        contract.connect(stranger).addLien(1)
      ).to.be.revertedWith("Only bank can do this");
    });

    it("5.3 cannot add lien if one already exists", async () => {
      await contract.connect(bank).addLien(1);
      await expect(
        contract.connect(bank).addLien(1)
      ).to.be.revertedWith("Lien already active on this land");
    });

    it("5.4 cannot add lien on disputed land", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await expect(
        contract.connect(bank).addLien(1)
      ).to.be.revertedWith("Cannot add lien: land is disputed");
    });

    it("5.5 bank can remove a lien", async () => {
      await contract.connect(bank).addLien(1);
      await expect(
        contract.connect(bank).removeLien(1)
      ).to.emit(contract, "LienRemoved").withArgs(1);

      const land = await contract.getLandDetails(1);
      expect(land.hasLien).to.be.false;
    });

    it("5.6 non-bank cannot remove a lien", async () => {
      await contract.connect(bank).addLien(1);
      await expect(
        contract.connect(stranger).removeLien(1)
      ).to.be.revertedWith("Only bank can do this");
    });

    it("5.7 cannot remove lien that doesn't exist", async () => {
      await expect(
        contract.connect(bank).removeLien(1)
      ).to.be.revertedWith("No active lien on this land");
    });

    it("5.8 adding lien freezes active listing", async () => {
      await contract.connect(owner1).listForSale(1, ETH(1));
      await contract.connect(bank).addLien(1);

      const land = await contract.getLandDetails(1);
      expect(land.isForSale).to.be.false;
    });

    it("5.9 after lien removed, owner can list again", async () => {
      await contract.connect(bank).addLien(1);
      await contract.connect(bank).removeLien(1);
      await expect(
        contract.connect(owner1).listForSale(1, ETH(1))
      ).to.not.be.reverted;
    });
  });

  // ═══════════════════════════════════════════
  // 6. DISPUTE RESOLUTION
  // ═══════════════════════════════════════════
  describe("6. Dispute Resolution", () => {

    beforeEach(async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
    });

    it("6.1 anyone can file a dispute", async () => {
      await expect(
        contract.connect(stranger).fileDispute(1, "ipfs://evidence")
      ).to.emit(contract, "DisputeFiled").withArgs(1, stranger.address);

      const land = await contract.getLandDetails(1);
      expect(land.isDisputed).to.be.true;
    });

    it("6.2 filing dispute freezes land from sale", async () => {
      await contract.connect(owner1).listForSale(1, ETH(1));
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");

      const land = await contract.getLandDetails(1);
      expect(land.isDisputed).to.be.true;
      expect(land.isForSale).to.be.false;
    });

    it("6.3 cannot file duplicate dispute on same land", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence1");
      await expect(
        contract.connect(attacker).fileDispute(1, "ipfs://evidence2")
      ).to.be.revertedWith("Dispute already active on this land");
    });

    it("6.4 government can resolve dispute — same owner", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await expect(
        contract.connect(gov).resolveDispute(1, owner1.address, "Owner confirmed")
      ).to.emit(contract, "DisputeResolved").withArgs(1, owner1.address);

      const land = await contract.getLandDetails(1);
      expect(land.isDisputed).to.be.false;
      expect(land.owner).to.equal(owner1.address);
    });

    it("6.5 government can resolve dispute — transfers to new owner", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await contract.connect(gov).resolveDispute(
        1, owner2.address, "Fraud detected — owner changed"
      );

      const land = await contract.getLandDetails(1);
      expect(land.owner).to.equal(owner2.address);
      expect(land.isDisputed).to.be.false;

      const hist = await contract.getLandHistory(1);
      expect(hist[hist.length - 1].newOwner).to.equal(owner2.address);
    });

    it("6.6 non-government cannot resolve dispute", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await expect(
        contract.connect(attacker).resolveDispute(1, owner1.address, "notes")
      ).to.be.revertedWith("Only government can do this");
    });

    it("6.7 cannot resolve dispute that doesn't exist", async () => {
      await expect(
        contract.connect(gov).resolveDispute(1, owner1.address, "notes")
      ).to.be.revertedWith("No active dispute on this land");
    });

    it("6.8 cannot resolve with zero address as rightful owner", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await expect(
        contract.connect(gov).resolveDispute(1, ZERO, "notes")
      ).to.be.revertedWith("Invalid rightful owner address");
    });

    it("6.9 dispute record is stored correctly", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      const dispute = await contract.getDispute(1);

      expect(dispute.filer).to.equal(stranger.address);
      expect(dispute.evidenceHash).to.equal("ipfs://evidence");
      expect(dispute.resolved).to.be.false;
    });

    it("6.10 after resolution, dispute is marked resolved", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await contract.connect(gov).resolveDispute(1, owner1.address, "All good");

      const dispute = await contract.getDispute(1);
      expect(dispute.resolved).to.be.true;
      expect(dispute.resolution).to.equal("All good");
    });

    it("6.11 after resolution, owner can list land again", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");
      await contract.connect(gov).resolveDispute(1, owner1.address, "Confirmed");

      await expect(
        contract.connect(owner1).listForSale(1, ETH(1))
      ).to.not.be.reverted;
    });
  });

  // ═══════════════════════════════════════════
  // 7. VERIFY LAND
  // ═══════════════════════════════════════════
  describe("7. Verify Land", () => {

    it("7.1 returns NOT REGISTERED for unknown landId", async () => {
      const result = await contract.verifyLand(999);
      expect(result.isRegistered).to.be.false;
      expect(result.status).to.equal("NOT REGISTERED");
    });

    it("7.2 returns clean title for registered land", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
      const result = await contract.verifyLand(1);
      expect(result.isRegistered).to.be.true;
      expect(result.hasCleanTitle).to.be.true;
      expect(result.status).to.equal("REGISTERED - CLEAN TITLE");
    });

    it("7.3 returns ENCUMBERED when lien is active", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
      await contract.connect(bank).addLien(1);

      const result = await contract.verifyLand(1);
      expect(result.hasCleanTitle).to.be.false;
      expect(result.status).to.equal("ENCUMBERED - MORTGAGE ACTIVE");
    });

    it("7.4 returns DISPUTED status when under dispute", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");

      const result = await contract.verifyLand(1);
      expect(result.hasCleanTitle).to.be.false;
      expect(result.status).to.equal("DISPUTED - DO NOT TRANSACT");
    });

    it("7.5 returns FOR SALE status when listed", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
      await contract.connect(owner1).listForSale(1, ETH(1));

      const result = await contract.verifyLand(1);
      expect(result.status).to.equal("REGISTERED - CLEAN TITLE - FOR SALE");
    });

    it("7.6 totalTransfers increases with each sale", async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
      await contract.connect(owner1).listForSale(1, ETH(1));
      await contract.connect(buyer).buyLand(1, { value: ETH(1) });

      const result = await contract.verifyLand(1);
      // ✅ FIX 2: totalTransfers is BigInt — compare with 2n or Number()
      expect(Number(result.totalTransfers)).to.equal(2);
      expect(result.currentOwner).to.equal(buyer.address);
    });
  });

  // ═══════════════════════════════════════════
  // 8. EDGE CASES & ATTACK SCENARIOS
  // ═══════════════════════════════════════════
  describe("8. Edge Cases & Attack Scenarios", () => {

    beforeEach(async () => {
      await contract.connect(gov).registerLand(
        1, owner1.address, "26.9124,75.7873", 500, "ipfs://hash"
      );
    });

    it("8.1 attacker cannot steal ownership by calling registerLand", async () => {
      await expect(
        contract.connect(gov).registerLand(
          1, attacker.address, "0,0", 1, "ipfs://fake"
        )
      ).to.be.revertedWith("Land already registered");

      const land = await contract.getLandDetails(1);
      expect(land.owner).to.equal(owner1.address);
    });

    it("8.2 attacker cannot remove someone else's lien", async () => {
      await contract.connect(bank).addLien(1);
      await expect(
        contract.connect(attacker).removeLien(1)
      ).to.be.revertedWith("Only bank can do this");
    });

    it("8.3 attacker cannot buy non-listed land by sending ETH", async () => {
      await expect(
        contract.connect(attacker).buyLand(1, { value: ETH(100) })
      ).to.be.revertedWith("Land is not for sale");
    });

    it("8.4 attacker cannot cancel someone else's listing", async () => {
      await contract.connect(owner1).listForSale(1, ETH(1));
      await expect(
        contract.connect(attacker).cancelListing(1)
      ).to.be.revertedWith("You are not the owner");
    });

    it("8.5 multiple land parcels are isolated from each other", async () => {
      await contract.connect(gov).registerLand(
        2, owner2.address, "27.0,76.0", 800, "ipfs://hash2"
      );

      await contract.connect(stranger).fileDispute(1, "ipfs://evidence");

      const land2 = await contract.getLandDetails(2);
      expect(land2.isDisputed).to.be.false;

      await contract.connect(bank).addLien(2);
      const land1 = await contract.getLandDetails(1);
      expect(land1.hasLien).to.be.false;
    });

    it("8.6 complete lifecycle: register → list → buy → lien → remove lien → sell again", async () => {
      await contract.connect(owner1).listForSale(1, ETH(1));
      await contract.connect(buyer).buyLand(1, { value: ETH(1) });
      expect((await contract.getLandDetails(1)).owner).to.equal(buyer.address);

      await contract.connect(bank).addLien(1);
      expect((await contract.getLandDetails(1)).hasLien).to.be.true;

      await contract.connect(bank).removeLien(1);
      expect((await contract.getLandDetails(1)).hasLien).to.be.false;

      await contract.connect(buyer).listForSale(1, ETH(3));
      await contract.connect(owner2).buyLand(1, { value: ETH(3) });
      expect((await contract.getLandDetails(1)).owner).to.equal(owner2.address);

      const hist = await contract.getLandHistory(1);
      expect(hist.length).to.equal(3);
    });

    it("8.7 complete dispute lifecycle: register → dispute → resolve → sell", async () => {
      await contract.connect(stranger).fileDispute(1, "ipfs://fraud-evidence");

      await contract.connect(owner1).listForSale(1, ETH(1)).catch(() => {});
      await expect(
        contract.connect(buyer).buyLand(1, { value: ETH(1) })
      ).to.be.reverted;

      await contract.connect(gov).resolveDispute(
        1, owner1.address, "Owner verified"
      );

      await contract.connect(owner1).listForSale(1, ETH(1));
      await contract.connect(buyer).buyLand(1, { value: ETH(1) });

      expect((await contract.getLandDetails(1)).owner).to.equal(buyer.address);
    });

    it("8.8 getDispute reverts for land not registered", async () => {
      await expect(contract.getDispute(999))
        .to.be.revertedWith("Land not found");
    });

    it("8.9 getLandHistory reverts for unregistered land", async () => {
      await expect(contract.getLandHistory(999))
        .to.be.revertedWith("Land not found");
    });

    it("8.10 100 land parcels can be registered independently", async () => {
      for (let i = 2; i <= 100; i++) {
        await contract.connect(gov).registerLand(
          i, owner1.address, `${i}.0,${i}.0`, i * 100, `ipfs://hash${i}`
        );
      }

      const land50 = await contract.getLandDetails(50);
   
      expect(Number(land50.landId)).to.equal(50);
      expect(Number(land50.areaSqMeters)).to.equal(5000);
    });
  });
});