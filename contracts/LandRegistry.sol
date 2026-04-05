// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract LandRegistry is ReentrancyGuard {

    // ── STRUCTS ──────────────────────────────────────────────
    struct LandParcel {
        uint256 landId;
        address owner;
        string  gpsCoordinates;
        uint256 areaSqMeters;
        string  documentHash;
        bool    isRegistered;
        bool    isForSale;
        uint256 salePrice;
        bool    hasLien;
        bool    isDisputed;
        uint256 registeredAt;
    }

    struct OwnershipRecord {
        address previousOwner;
        address newOwner;
        uint256 price;
        uint256 timestamp;
    }

    struct Dispute {
        address filer;
        string  evidenceHash;
        uint256 filedAt;
        bool    resolved;
        string  resolution;
    }

    // ── STATE VARIABLES ──────────────────────────────────────
    address public government;
    address public bank;
    mapping(uint256 => LandParcel)       public lands;
    mapping(uint256 => OwnershipRecord[]) public history;
    mapping(uint256 => address)          public lienHolder;
    mapping(uint256 => Dispute)          public disputes;

    // ── EVENTS ───────────────────────────────────────────────
    event LandRegistered(uint256 landId, address owner);
    event OwnershipTransferred(uint256 landId, address from, address to);
    event LandListedForSale(uint256 landId, uint256 price);
    event LienAdded(uint256 landId, address bank);
    event LienRemoved(uint256 landId);
    event DisputeFiled(uint256 landId, address filer);
    event DisputeResolved(uint256 landId, address rightfulOwner);

    // ── MODIFIERS ────────────────────────────────────────────
    modifier onlyGov() {
        require(msg.sender == government, "Not government");
        _;
    }
    modifier onlyBank() {
        require(msg.sender == bank, "Not bank");
        _;
    }
    modifier onlyOwner(uint256 id) {
        require(msg.sender == lands[id].owner, "Not owner");
        _;
    }
    // YOU WERE MISSING THIS — fixes getLandDetails error
    modifier landExists(uint256 id) {
        require(lands[id].isRegistered, "Land not found");
        _;
    }

    // ── CONSTRUCTOR ──────────────────────────────────────────
    constructor(address _gov, address _bank) {
        government = _gov;
        bank = _bank;
    }

    // ════════════════════════════════════════════════════════
    // MODULE 1 — REGISTER LAND 
    // ════════════════════════════════════════════════════════
    function registerLand(
        uint256 landId,
        address _owner,
        string memory gpsCoordinates,
        uint256 areaSqMeters,
        string memory documentHash
    ) public onlyGov {
        require(!lands[landId].isRegistered, "Land already registered");
        require(_owner != address(0), "Invalid owner");

        lands[landId] = LandParcel({
            landId:        landId,
            owner:         _owner,
            gpsCoordinates: gpsCoordinates,
            areaSqMeters:  areaSqMeters,
            documentHash:  documentHash,
            isRegistered:  true,
            isForSale:     false,
            salePrice:     0,
            hasLien:       false,
            isDisputed:    false,
            registeredAt:  block.timestamp
        });

        history[landId].push(OwnershipRecord({
            previousOwner: address(0),
            newOwner:      _owner,
            price:         0,
            timestamp:     block.timestamp
        }));

        emit LandRegistered(landId, _owner);
    }

    // Get full land details 
    function getLandDetails(uint256 landId)
        public view landExists(landId)
        returns (LandParcel memory)
    {
        return lands[landId];
    }

    // ════════════════════════════════════════════════════════
    // MODULE 2 — BUY / SELL
    // ════════════════════════════════════════════════════════

    // Owner lists their land for sale at a price
    function listForSale(uint256 landId, uint256 price)
        public onlyOwner(landId) landExists(landId)
    {
        // Cannot sell if mortgage is active
        require(!lands[landId].hasLien,    "Cannot sell: active mortgage");
        // Cannot sell if dispute is active
        require(!lands[landId].isDisputed, "Cannot sell: active dispute");
        // Price must be more than zero
        require(price > 0, "Price must be greater than zero");

        lands[landId].isForSale = true;
        lands[landId].salePrice = price;

        emit LandListedForSale(landId, price);
    }

    // Buyer purchases land — ownership transfers instantly
    // nonReentrant = security protection against hack attacks
    function buyLand(uint256 landId)
        public payable nonReentrant landExists(landId)
    {
        LandParcel storage land = lands[landId];

        require(land.isForSale,               "Land is not for sale");
        require(msg.value >= land.salePrice,  "Not enough payment sent");
        require(msg.sender != land.owner,     "You already own this land");
        require(!land.isDisputed,             "Land is under dispute");

        address previousOwner = land.owner;

        // Save to ownership history BEFORE changing owner
        history[landId].push(OwnershipRecord({
            previousOwner: previousOwner,
            newOwner:      msg.sender,
            price:         msg.value,
            timestamp:     block.timestamp
        }));

        // Transfer ownership on blockchain
        land.owner     = msg.sender;
        land.isForSale = false;
        land.salePrice = 0;

        // Send payment to seller automatically — no middleman
        payable(previousOwner).transfer(msg.value);

        emit OwnershipTransferred(landId, previousOwner, msg.sender);
    }

    // ════════════════════════════════════════════════════════
    // MODULE 3 — LAND HISTORY
    // ════════════════════════════════════════════════════════

    // Returns every ownership record ever for this land
    function getLandHistory(uint256 landId)
        public view landExists(landId)
        returns (OwnershipRecord[] memory)
    {
        return history[landId];
    }

    // ════════════════════════════════════════════════════════
    // MODULE 4 — VERIFICATION
    // ════════════════════════════════════════════════════════

    // Banks and lawyers call this — instant title check
    function verifyLand(uint256 landId)
        public view
        returns (
            bool   isRegistered,
            bool   hasCleanTitle,
            address currentOwner,
            uint256 totalTransfers,
            string memory status
        )
    {
        // If land doesn't exist return false
        if (!lands[landId].isRegistered) {
            return (false, false, address(0), 0, "NOT REGISTERED");
        }

        LandParcel memory land = lands[landId];

        // Clean title = no mortgage AND no dispute
        bool clean = !land.hasLien && !land.isDisputed;

        string memory statusMsg;
        if      (land.isDisputed)  statusMsg = "DISPUTED - DO NOT TRANSACT";
        else if (land.hasLien)     statusMsg = "ENCUMBERED - MORTGAGE ACTIVE";
        else if (land.isForSale)   statusMsg = "REGISTERED - CLEAN TITLE - FOR SALE";
        else                       statusMsg = "REGISTERED - CLEAN TITLE";

        return (
            true,
            clean,
            land.owner,
            history[landId].length,
            statusMsg
        );
    }

    // ════════════════════════════════════════════════════════
    // MODULE 5 — MORTGAGE / LIEN
    // ════════════════════════════════════════════════════════

    // Bank records a mortgage against the land
    function addLien(uint256 landId)
        public onlyBank landExists(landId)
    {
        require(!lands[landId].hasLien,    "Lien already exists");
        require(!lands[landId].isDisputed, "Land is disputed");

        lands[landId].hasLien  = true;
        lands[landId].isForSale = false; // Freeze from sale immediately
        lienHolder[landId]     = msg.sender;

        emit LienAdded(landId, msg.sender);
    }

    // Bank removes mortgage when loan is fully repaid
    function removeLien(uint256 landId)
        public onlyBank landExists(landId)
    {
        require(lands[landId].hasLien,       "No active lien");
        require(lienHolder[landId] == msg.sender, "Only lien holder can remove");

        lands[landId].hasLien = false;
        delete lienHolder[landId];

        emit LienRemoved(landId);
    }

    // ════════════════════════════════════════════════════════
    // MODULE 6 — DISPUTE RESOLUTION
    // ════════════════════════════════════════════════════════

    // Anyone can file a dispute with evidence
    function fileDispute(uint256 landId, string memory evidenceHash)
        public landExists(landId)
    {
        require(!disputes[landId].resolved || !lands[landId].isDisputed,
            "Dispute already active");

        // Freeze land immediately — no transfers during dispute
        lands[landId].isDisputed = true;
        lands[landId].isForSale  = false;

        disputes[landId] = Dispute({
            filer:       msg.sender,
            evidenceHash: evidenceHash,
            filedAt:     block.timestamp,
            resolved:    false,
            resolution:  ""
        });

        emit DisputeFiled(landId, msg.sender);
    }

    // Only government can resolve — decision is final and on-chain
    function resolveDispute(
        uint256 landId,
        address rightfulOwner,
        string memory resolutionNotes
    ) public onlyGov landExists(landId) {
        require(lands[landId].isDisputed, "No active dispute");
        require(rightfulOwner != address(0), "Invalid owner address");

        // If owner needs to change, transfer ownership
        if (rightfulOwner != lands[landId].owner) {
            address previousOwner = lands[landId].owner;

            history[landId].push(OwnershipRecord({
                previousOwner: previousOwner,
                newOwner:      rightfulOwner,
                price:         0,
                timestamp:     block.timestamp
            }));

            lands[landId].owner = rightfulOwner;
            emit OwnershipTransferred(landId, previousOwner, rightfulOwner);
        }

        lands[landId].isDisputed        = false;
        disputes[landId].resolved       = true;
        disputes[landId].resolution     = resolutionNotes;

        emit DisputeResolved(landId, rightfulOwner);
    }

    // Get dispute details for any land
    function getDispute(uint256 landId)
        public view landExists(landId)
        returns (Dispute memory)
    {
        return disputes[landId];
    }
}