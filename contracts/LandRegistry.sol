// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LandRegistry is ReentrancyGuard {

    // ════════════════════════════════════════════════════════
    // STRUCTS
    // ════════════════════════════════════════════════════════

    struct LandParcel {
        uint256 landId;
        address owner;
        string  gpsCoordinates;
        uint256 areaSqMeters;
        string  documentHash;      // IPFS hash of title deed
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
        string  evidenceHash;      // IPFS hash of evidence document
        uint256 filedAt;
        bool    resolved;
        string  resolution;
    }

    // ════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════

    address public government;     // can register land + resolve disputes
    address public bank;           // can add / remove liens

    mapping(uint256 => LandParcel)        public lands;
    mapping(uint256 => OwnershipRecord[]) public history;
    mapping(uint256 => address)           public lienHolder;
    mapping(uint256 => Dispute)           public disputes;

    // ════════════════════════════════════════════════════════
    // EVENTS  — frontend listens to these for real-time updates
    // ════════════════════════════════════════════════════════

    event LandRegistered      (uint256 landId, address owner);
    event OwnershipTransferred(uint256 landId, address from, address to);
    event ListedForSale       (uint256 landId, uint256 price);
    event SaleCancelled       (uint256 landId);
    event LandBought          (uint256 landId, address buyer, uint256 price);
    event LienAdded           (uint256 landId, address bank);
    event LienRemoved         (uint256 landId);
    event DisputeFiled        (uint256 landId, address filer);
    event DisputeResolved     (uint256 landId, address rightfulOwner);

    // ════════════════════════════════════════════════════════
    // MODIFIERS  — security gates on functions
    // ════════════════════════════════════════════════════════

    // Only the government wallet can call this function
    modifier onlyGov() {
        require(msg.sender == government, "Only government can do this");
        _;
    }

    // Only the bank wallet can call this function
    modifier onlyBank() {
        require(msg.sender == bank, "Only bank can do this");
        _;
    }

    // Only the current owner of that land can call this function
    modifier onlyOwner(uint256 id) {
        require(msg.sender == lands[id].owner, "You are not the owner");
        _;
    }

    // Land must already be registered — prevents acting on non-existent land
    modifier landExists(uint256 id) {
        require(lands[id].isRegistered, "Land not found");
        _;
    }

    // ════════════════════════════════════════════════════════
    // CONSTRUCTOR  — runs once when contract is deployed
    // ════════════════════════════════════════════════════════

    constructor(address _gov, address _bank) {
        // FROM YOUR FILE: validates both addresses on deploy
        require(_gov  != address(0), "Invalid government address");
        require(_bank != address(0), "Invalid bank address");
        government = _gov;
        bank       = _bank;
    }

    // ════════════════════════════════════════════════════════
    // MODULE 1 — LAND REGISTRATION
    // Only government can register a new land parcel
    // ════════════════════════════════════════════════════════

    function registerLand(
        uint256       landId,
        address       _owner,
        string memory gpsCoordinates,
        uint256       areaSqMeters,
        string memory documentHash
    ) public onlyGov {
        require(!lands[landId].isRegistered,          "Land already registered");
        require(_owner != address(0),                 "Invalid owner address");
        require(areaSqMeters > 0,                     "Area must be greater than 0");
        // FROM YOUR FILE: validates GPS is not empty
        require(bytes(gpsCoordinates).length > 0,     "GPS coordinates required");

        lands[landId] = LandParcel({
            landId:         landId,
            owner:          _owner,
            gpsCoordinates: gpsCoordinates,
            areaSqMeters:   areaSqMeters,
            documentHash:   documentHash,
            isRegistered:   true,
            isForSale:      false,
            salePrice:      0,
            hasLien:        false,
            isDisputed:     false,
            registeredAt:   block.timestamp
        });

        // First history entry — from zero address = government registration
        history[landId].push(OwnershipRecord({
            previousOwner: address(0),
            newOwner:      _owner,
            price:         0,
            timestamp:     block.timestamp
        }));

        emit LandRegistered(landId, _owner);
    }

    // Returns full details of a land parcel
    function getLandDetails(uint256 landId)
        public view landExists(landId)
        returns (LandParcel memory)
    {
        return lands[landId];
    }

    // ════════════════════════════════════════════════════════
    // MODULE 2 — BUY / SELL
    // Smart contract handles escrow — no middleman needed
    // ════════════════════════════════════════════════════════

    // Owner lists their land for sale at a set price
    function listForSale(uint256 landId, uint256 price)
        public landExists(landId) onlyOwner(landId)
    {
        require(!lands[landId].isDisputed, "Cannot list: land is disputed");
        require(!lands[landId].hasLien,    "Cannot list: active mortgage exists");
        require(!lands[landId].isForSale,  "Already listed for sale");
        require(price > 0,                 "Price must be greater than 0");

        lands[landId].isForSale = true;
        lands[landId].salePrice = price;

        emit ListedForSale(landId, price);
    }

    // FROM YOUR FILE: Owner can cancel their listing at any time
    function cancelListing(uint256 landId)
        public landExists(landId) onlyOwner(landId)
    {
        require(lands[landId].isForSale, "Land is not listed for sale");

        lands[landId].isForSale = false;
        lands[landId].salePrice = 0;

        emit SaleCancelled(landId);
    }

    // Buyer purchases land — instant atomic ownership transfer
    // nonReentrant protects against reentrancy hack attacks
    function buyLand(uint256 landId)
        public payable nonReentrant landExists(landId)
    {
        LandParcel storage land = lands[landId];

        require(land.isForSale,              "Land is not for sale");
        require(msg.value >= land.salePrice, "Payment is not enough");
        require(msg.sender != land.owner,    "You already own this land");
        require(!land.isDisputed,            "Land is under active dispute");

        address previousOwner = land.owner;

        // Record history BEFORE changing owner
        history[landId].push(OwnershipRecord({
            previousOwner: previousOwner,
            newOwner:      msg.sender,
            price:         msg.value,
            timestamp:     block.timestamp
        }));

        // Transfer ownership on-chain
        land.owner     = msg.sender;
        land.isForSale = false;
        land.salePrice = 0;

        // Release payment to seller — automatic, no bank needed
        payable(previousOwner).transfer(msg.value);

        emit LandBought(landId, msg.sender, msg.value);
        emit OwnershipTransferred(landId, previousOwner, msg.sender);
    }

    // ════════════════════════════════════════════════════════
    // MODULE 3 — OWNERSHIP HISTORY
    // Every transfer ever recorded — immutable and tamper-proof
    // ════════════════════════════════════════════════════════

    function getLandHistory(uint256 landId)
        public view landExists(landId)
        returns (OwnershipRecord[] memory)
    {
        return history[landId];
    }

    // ════════════════════════════════════════════════════════
    // MODULE 4 — VERIFICATION
    // Banks and lawyers call this for instant title check
    // ════════════════════════════════════════════════════════

    function verifyLand(uint256 landId)
        public view
        returns (
            bool    isRegistered,
            bool    hasCleanTitle,
            address currentOwner,
            uint256 totalTransfers,
            string memory status
        )
    {
        // If land does not exist at all
        if (!lands[landId].isRegistered) {
            return (false, false, address(0), 0, "NOT REGISTERED");
        }

        LandParcel memory land = lands[landId];

        // Clean title = no mortgage AND no dispute
        bool clean = !land.hasLien && !land.isDisputed;

        string memory statusMsg;
        if      (land.isDisputed) statusMsg = "DISPUTED - DO NOT TRANSACT";
        else if (land.hasLien)    statusMsg = "ENCUMBERED - MORTGAGE ACTIVE";
        else if (land.isForSale)  statusMsg = "REGISTERED - CLEAN TITLE - FOR SALE";
        else                      statusMsg = "REGISTERED - CLEAN TITLE";

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
    // Bank records and removes mortgages on-chain
    // ════════════════════════════════════════════════════════

    // Bank adds a mortgage — land is frozen from sale
    function addLien(uint256 landId)
        public onlyBank landExists(landId)
    {
        require(!lands[landId].hasLien,    "Lien already active on this land");
        require(!lands[landId].isDisputed, "Cannot add lien: land is disputed");

        lands[landId].hasLien   = true;
        lands[landId].isForSale = false;   // Freeze immediately
        lienHolder[landId]      = msg.sender;

        emit LienAdded(landId, msg.sender);
    }

    // Bank removes mortgage when loan is fully repaid
    function removeLien(uint256 landId)
        public onlyBank landExists(landId)
    {
        require(lands[landId].hasLien,            "No active lien on this land");
        require(lienHolder[landId] == msg.sender, "Only the lien holder can remove it");

        lands[landId].hasLien = false;
        delete lienHolder[landId];

        emit LienRemoved(landId);
    }

    // ════════════════════════════════════════════════════════
    // MODULE 6 — DISPUTE RESOLUTION
    // Anyone files, government resolves — all on-chain
    // ════════════════════════════════════════════════════════

    // Anyone can file a dispute against a land parcel
    function fileDispute(uint256 landId, string memory evidenceHash)
        public landExists(landId)
    {
        require(!lands[landId].isDisputed, "Dispute already active on this land");

        // Freeze land immediately — no transfers during dispute
        lands[landId].isDisputed = true;
        lands[landId].isForSale  = false;

        disputes[landId] = Dispute({
            filer:        msg.sender,
            evidenceHash: evidenceHash,
            filedAt:      block.timestamp,
            resolved:     false,
            resolution:   ""
        });

        emit DisputeFiled(landId, msg.sender);
    }

    // Only government can resolve — final decision written on-chain forever
    function resolveDispute(
        uint256       landId,
        address       rightfulOwner,
        string memory resolutionNotes
    ) public onlyGov landExists(landId) {
        require(lands[landId].isDisputed,    "No active dispute on this land");
        require(rightfulOwner != address(0), "Invalid rightful owner address");

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

        // Close the dispute permanently
        lands[landId].isDisputed    = false;
        disputes[landId].resolved   = true;
        disputes[landId].resolution = resolutionNotes;

        emit DisputeResolved(landId, rightfulOwner);
    }

    // Get full dispute record for any land
    function getDispute(uint256 landId)
        public view landExists(landId)
        returns (Dispute memory)
    {
        return disputes[landId];
    }

}
