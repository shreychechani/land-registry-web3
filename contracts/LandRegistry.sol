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
        string  documentHash;
        string  title;
        bool    isRegistered;
        bool    isForSale;
        uint256 salePrice;
        bool    hasLien;
        bool    isDisputed;
        uint256 registeredAt;
        uint256 updatedAt;
    }

    struct OwnershipRecord {
        address previousOwner;
        address newOwner;
        uint256 price;
        uint256 timestamp;
        string  transferType;
    }

    struct Dispute {
        address filer;
        string  evidenceHash;
        uint256 filedAt;
        bool    resolved;
        string  resolution;
    }

    struct VerifyResult {
        bool    isRegistered;
        bool    hasCleanTitle;
        bool    hasLien;
        bool    isDisputed;
        bool    isForSale;
        address currentOwner;
        uint256 registeredAt;
        uint256 totalTransfers;
        string  status;
    }

    // ════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ════════════════════════════════════════════════════════

    address public government;
    address public bank;
    uint256 public platformFeePercent = 2;

    mapping(uint256 => LandParcel)        public lands;
    mapping(uint256 => OwnershipRecord[]) private _history;
    mapping(uint256 => address)           public lienHolder;
    mapping(uint256 => Dispute)           public disputes;
    mapping(address => uint256[])         private _ownerLands;

    uint256[] private _allLandIds;
    uint256[] private _forSaleLandIds;

    // ════════════════════════════════════════════════════════
    // EVENTS
    // ════════════════════════════════════════════════════════

    event LandRegistered      (uint256 indexed landId, address indexed owner);
    event OwnershipTransferred(uint256 indexed landId, address indexed from, address indexed to, uint256 price);
    event ListedForSale       (uint256 indexed landId, uint256 price);
    event SaleCancelled       (uint256 indexed landId);
    event LandBought          (uint256 indexed landId, address indexed buyer, uint256 price);
    event LienAdded           (uint256 indexed landId, address indexed bankAddr);
    event LienRemoved         (uint256 indexed landId);
    event DisputeFiled        (uint256 indexed landId, address indexed claimant);
    event DisputeResolved     (uint256 indexed landId, address indexed rightfulOwner);

    // ════════════════════════════════════════════════════════
    // MODIFIERS
    // ════════════════════════════════════════════════════════

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

    modifier landExists(uint256 id) {
        require(lands[id].isRegistered, "Land not found");
        _;
    }

    // ════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ════════════════════════════════════════════════════════

    constructor(address _gov, address _bank) {
        require(_gov  != address(0), "Invalid government address");
        require(_bank != address(0), "Invalid bank address");
        government = _gov;
        bank       = _bank;
    }

    // ════════════════════════════════════════════════════════
    // MODULE 1 — LAND REGISTRATION
    // Takes explicit landId (matches test: registerLand(1, owner, gps, area, hash))
    // ════════════════════════════════════════════════════════

    function registerLand(
        uint256       _landId,
        address       _owner,
        string memory _gps,
        uint256       _area,
        string memory _docHash
    ) public onlyGov {
        require(!lands[_landId].isRegistered,  "Land already registered");
        require(_owner != address(0),          "Invalid owner address");
        require(_area > 0,                     "Area must be greater than 0");
        require(bytes(_gps).length > 0,        "GPS coordinates required");

        lands[_landId] = LandParcel({
            landId:         _landId,
            owner:          _owner,
            gpsCoordinates: _gps,
            areaSqMeters:   _area,
            documentHash:   _docHash,
            title:          "",
            isRegistered:   true,
            isForSale:      false,
            salePrice:      0,
            hasLien:        false,
            isDisputed:     false,
            registeredAt:   block.timestamp,
            updatedAt:      block.timestamp
        });

        _allLandIds.push(_landId);
        _ownerLands[_owner].push(_landId);

        _history[_landId].push(OwnershipRecord({
            previousOwner: address(0),
            newOwner:      _owner,
            price:         0,
            timestamp:     block.timestamp,
            transferType:  "REGISTRATION"
        }));

        emit LandRegistered(_landId, _owner);
    }

    // Overload: accepts title as well (used by frontend Register.jsx)
    function registerLandFull(
        uint256       _landId,
        address       _owner,
        string memory _gps,
        uint256       _area,
        string memory _docHash,
        string memory _title
    ) public onlyGov {
        require(!lands[_landId].isRegistered,  "Land already registered");
        require(_owner != address(0),          "Invalid owner address");
        require(_area > 0,                     "Area must be greater than 0");
        require(bytes(_gps).length > 0,        "GPS coordinates required");
        require(bytes(_title).length > 0,      "Title required");

        lands[_landId] = LandParcel({
            landId:         _landId,
            owner:          _owner,
            gpsCoordinates: _gps,
            areaSqMeters:   _area,
            documentHash:   _docHash,
            title:          _title,
            isRegistered:   true,
            isForSale:      false,
            salePrice:      0,
            hasLien:        false,
            isDisputed:     false,
            registeredAt:   block.timestamp,
            updatedAt:      block.timestamp
        });

        _allLandIds.push(_landId);
        _ownerLands[_owner].push(_landId);

        _history[_landId].push(OwnershipRecord({
            previousOwner: address(0),
            newOwner:      _owner,
            price:         0,
            timestamp:     block.timestamp,
            transferType:  "REGISTRATION"
        }));

        emit LandRegistered(_landId, _owner);
    }

    function updateDocument(uint256 _id, string memory _newHash)
        public onlyGov landExists(_id)
    {
        lands[_id].documentHash = _newHash;
        lands[_id].updatedAt    = block.timestamp;
    }

    // ════════════════════════════════════════════════════════
    // MODULE 2 — BUY / SELL
    // ════════════════════════════════════════════════════════

    function listForSale(uint256 _id, uint256 _price)
        public landExists(_id) onlyOwner(_id)
    {
        require(!lands[_id].isDisputed, "Cannot list: land is disputed");
        require(!lands[_id].hasLien,    "Cannot list: active mortgage exists");
        require(!lands[_id].isForSale,  "Already listed for sale");
        require(_price > 0,             "Price must be greater than 0");

        lands[_id].isForSale = true;
        lands[_id].salePrice = _price;
        lands[_id].updatedAt = block.timestamp;

        _forSaleLandIds.push(_id);
        emit ListedForSale(_id, _price);
    }

    // cancelListing — name used in tests
    function cancelListing(uint256 _id)
        public landExists(_id) onlyOwner(_id)
    {
        require(lands[_id].isForSale, "Land is not listed for sale");

        lands[_id].isForSale = false;
        lands[_id].salePrice = 0;
        lands[_id].updatedAt = block.timestamp;

        _removeFromForSale(_id);
        emit SaleCancelled(_id);
    }

    // cancelSale alias for frontend compatibility
    function cancelSale(uint256 _id) public { cancelListing(_id); }

    function buyLand(uint256 _id)
        public payable nonReentrant landExists(_id)
    {
        LandParcel storage land = lands[_id];

        require(land.isForSale,              "Land is not for sale");
        require(msg.value >= land.salePrice, "Payment is not enough");
        require(msg.sender != land.owner,    "You already own this land");
        require(!land.isDisputed,            "Land is under active dispute");

        address previousOwner = land.owner;
        uint256 salePrice     = land.salePrice;

        _history[_id].push(OwnershipRecord({
            previousOwner: previousOwner,
            newOwner:      msg.sender,
            price:         msg.value,
            timestamp:     block.timestamp,
            transferType:  "SALE"
        }));

        _removeFromOwner(previousOwner, _id);
        _ownerLands[msg.sender].push(_id);

        land.owner     = msg.sender;
        land.isForSale = false;
        land.salePrice = 0;
        land.updatedAt = block.timestamp;

        _removeFromForSale(_id);

        payable(previousOwner).transfer(salePrice);

        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }

        emit LandBought(_id, msg.sender, salePrice);
        emit OwnershipTransferred(_id, previousOwner, msg.sender, salePrice);
    }

    // ════════════════════════════════════════════════════════
    // MODULE 3 — READ / HISTORY
    // ════════════════════════════════════════════════════════

    function getLandHistory(uint256 _id)
        public view landExists(_id)
        returns (OwnershipRecord[] memory)
    {
        return _history[_id];
    }

    function getLandsByOwner(address _owner)
        public view returns (uint256[] memory)
    {
        return _ownerLands[_owner];
    }

    function getAllLands() public view returns (uint256[] memory) {
        return _allLandIds;
    }

    function getTotalLands() public view returns (uint256) {
        return _allLandIds.length;
    }

    function getForSaleLands() public view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < _forSaleLandIds.length; i++) {
            if (lands[_forSaleLandIds[i]].isForSale) count++;
        }
        uint256[] memory result = new uint256[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < _forSaleLandIds.length; i++) {
            if (lands[_forSaleLandIds[i]].isForSale) {
                result[j++] = _forSaleLandIds[i];
            }
        }
        return result;
    }

    // ════════════════════════════════════════════════════════
    // MODULE 4 — VERIFY
    // Returns rich struct matching tests (verifyLand(id).status etc.)
    // ════════════════════════════════════════════════════════

    function getLandDetails(uint256 _id)
        public view landExists(_id)
        returns (LandParcel memory)
    {
        return lands[_id];
    }

    function verifyLand(uint256 _id)
        public view
        returns (VerifyResult memory result)
    {
        if (!lands[_id].isRegistered) {
            result.isRegistered = false;
            result.status = "NOT REGISTERED";
            return result;
        }

        LandParcel memory land = lands[_id];
        result.isRegistered  = true;
        result.hasLien       = land.hasLien;
        result.isDisputed    = land.isDisputed;
        result.isForSale     = land.isForSale;
        result.currentOwner  = land.owner;
        result.registeredAt  = land.registeredAt;
        result.totalTransfers = uint256(_history[_id].length);
        result.hasCleanTitle = !land.hasLien && !land.isDisputed;

        if (land.isDisputed) {
            result.status = "DISPUTED - DO NOT TRANSACT";
        } else if (land.hasLien) {
            result.status = "ENCUMBERED - MORTGAGE ACTIVE";
        } else if (land.isForSale) {
            result.status = "REGISTERED - CLEAN TITLE - FOR SALE";
        } else {
            result.status = "REGISTERED - CLEAN TITLE";
        }
    }

    // ════════════════════════════════════════════════════════
    // MODULE 5 — LIEN
    // addLien(id) — bank address inferred from msg.sender
    // ════════════════════════════════════════════════════════

    function addLien(uint256 _id)
        public onlyBank landExists(_id)
    {
        require(!lands[_id].hasLien,    "Lien already active on this land");
        require(!lands[_id].isDisputed, "Cannot add lien: land is disputed");

        lands[_id].hasLien   = true;
        lands[_id].isForSale = false;
        lands[_id].updatedAt = block.timestamp;
        lienHolder[_id]      = msg.sender;

        _removeFromForSale(_id);
        emit LienAdded(_id, msg.sender);
    }

    function removeLien(uint256 _id)
        public onlyBank landExists(_id)
    {
        require(lands[_id].hasLien, "No active lien on this land");

        lands[_id].hasLien   = false;
        lands[_id].updatedAt = block.timestamp;
        delete lienHolder[_id];

        emit LienRemoved(_id);
    }

    // ════════════════════════════════════════════════════════
    // MODULE 6 — DISPUTE RESOLUTION
    // ════════════════════════════════════════════════════════

    function fileDispute(uint256 _id, string memory _evidenceHash)
        public landExists(_id)
    {
        require(!lands[_id].isDisputed, "Dispute already active on this land");

        lands[_id].isDisputed = true;
        lands[_id].isForSale  = false;
        lands[_id].updatedAt  = block.timestamp;

        disputes[_id] = Dispute({
            filer:        msg.sender,
            evidenceHash: _evidenceHash,
            filedAt:      block.timestamp,
            resolved:     false,
            resolution:   ""
        });

        _removeFromForSale(_id);
        emit DisputeFiled(_id, msg.sender);
    }

    function resolveDispute(
        uint256       _id,
        address       _rightfulOwner,
        string memory _resolution
    ) public onlyGov landExists(_id) {
        require(lands[_id].isDisputed,        "No active dispute on this land");
        require(_rightfulOwner != address(0), "Invalid rightful owner address");

        if (_rightfulOwner != lands[_id].owner) {
            address prev = lands[_id].owner;
            _removeFromOwner(prev, _id);
            _ownerLands[_rightfulOwner].push(_id);

            _history[_id].push(OwnershipRecord({
                previousOwner: prev,
                newOwner:      _rightfulOwner,
                price:         0,
                timestamp:     block.timestamp,
                transferType:  "DISPUTE_RESOLUTION"
            }));

            lands[_id].owner = _rightfulOwner;
            emit OwnershipTransferred(_id, prev, _rightfulOwner, 0);
        }

        lands[_id].isDisputed      = false;
        lands[_id].updatedAt       = block.timestamp;
        disputes[_id].resolved     = true;
        disputes[_id].resolution   = _resolution;

        emit DisputeResolved(_id, _rightfulOwner);
    }

    function getDispute(uint256 _id)
        public view landExists(_id)
        returns (Dispute memory)
    {
        return disputes[_id];
    }

    // ════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ════════════════════════════════════════════════════════

    function _removeFromForSale(uint256 _id) internal {
        for (uint256 i = 0; i < _forSaleLandIds.length; i++) {
            if (_forSaleLandIds[i] == _id) {
                _forSaleLandIds[i] = _forSaleLandIds[_forSaleLandIds.length - 1];
                _forSaleLandIds.pop();
                break;
            }
        }
    }

    function _removeFromOwner(address _owner, uint256 _id) internal {
        uint256[] storage arr = _ownerLands[_owner];
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                arr[i] = arr[arr.length - 1];
                arr.pop();
                break;
            }
        }
    }
}
