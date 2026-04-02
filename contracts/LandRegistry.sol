// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LandRegistry is ReentrancyGuard {

    // ── STRUCTS ──────────────────────────────────────
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

    // ── STATE VARIABLES ──────────────────────────────
    address public government;
    address public bank;
    mapping(uint256 => LandParcel) public lands;
    mapping(uint256 => OwnershipRecord[]) public history;
    mapping(uint256 => address) public lienHolder;

    // ── EVENTS ───────────────────────────────────────
    event LandRegistered(uint256 landId, address owner);
    event OwnershipTransferred(uint256 landId, address from, address to);
    event LienAdded(uint256 landId, address bank);
    event LienRemoved(uint256 landId);
    event DisputeFiled(uint256 landId);
    event DisputeResolved(uint256 landId, address rightfulOwner);

    // ── MODIFIERS ────────────────────────────────────
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

    // ── CONSTRUCTOR ──────────────────────────────────
    constructor(address _gov, address _bank) {
        government = _gov;
        bank = _bank;
    }

    function registerLand(
        
        uint256 landId,
        address _owner,
        string memory gpsCoordinates,
        uint256 areaSqMeters,
        string memory documentHash

) public onlyGov{

   require(!lands[landId].isRegistered, "Land already registered");
   require(_owner != address(0), "Invalid owner");  

   lands[landId] = LandParcel({
            landId: landId,
            owner: _owner,
            gpsCoordinates: gpsCoordinates,
            areaSqMeters: areaSqMeters,
            documentHash: documentHash,
            isRegistered: true,
            isForSale: false,
            salePrice: 0,
            hasLien: false,
            isDisputed: false,
            registeredAt: block.timestamp
        });


        history[landId].push(OwnershipRecord({
            previousOwner: address(0),
            newOwner: _owner,
            price: 0,
            timestamp: block.timestamp
        }));

        emit LandRegistered(landId, _owner);
    }

    function getLandDetails(uint256 landId) public view landExists(landId) returns (LandParcel memory)
    {
        return lands[landId];
    }

    // Day 3: listForSale() + buyLand()
    // Day 3: getLandHistory() + verifyLand()
    // Day 3: addLien() + removeLien()
    // Day 3: fileDispute() + resolveDispute()
}