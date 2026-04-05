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
    address public government;  // can register land
    address public bank;        // can add/remove liens

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
        require(msg.sender == government, "Only government can do this");
        _;
    }
    modifier onlyBank() {
        require(msg.sender == bank, "Only bank can do this");
        _;
    }
    modifier onlyOwner(uint256 id) {
        require(msg.sender == lands[id].owner, "You are not the owner");
        _;
    }

    // ── CONSTRUCTOR ──────────────────────────────────
    constructor(address _gov, address _bank) {
        require(_gov  != address(0), "Invalid government address");
        require(_bank != address(0), "Invalid bank address");
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
   require(areaSqMeters > 0,                  "Area must be > 0");
   require(bytes(gpsCoordinates).length > 0,  "GPS required");

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


    function listForSale(uint256 landId, uint256 price)
        public
        landExists(landId)
        onlyOwner(landId)
    {
        require(!lands[landId].isDisputed, "Cannot list disputed land");
        require(!lands[landId].hasLien,    "Cannot list land with a lien");
        require(!lands[landId].isForSale,  "Already listed for sale");
        require(price > 0,                 "Price must be > 0");

        lands[landId].isForSale = true;
        lands[landId].salePrice = price;

        emit ListedForSale(landId, price);
    }

    function cancelListing(uint256 landId)
        public
        landExists(landId)
        onlyOwner(landId)
    {
        require(lands[landId].isForSale, "Not listed for sale");

        lands[landId].isForSale = false;
        lands[landId].salePrice = 0;

        emit SaleCancelled(landId);
    }


    function getLandHistory(uint256 landId)
        public
        view
        landExists(landId)
        returns (OwnershipRecord[] memory)
    {
        return history[landId];
    }


    function verifyLand(uint256 landId)
        public
        view
        returns (
            bool    registered,
            address owner,
            bool    isForSale,
            bool    hasLien,
            bool    isDisputed
        )
    {
        LandParcel memory land = lands[landId];
        return (
            land.isRegistered,
            land.owner,
            land.isForSale,
            land.hasLien,
            land.isDisputed
        );
    }
    
    // Day 3: addLien() + removeLien()
    // Day 3: fileDispute() + resolveDispute()
}