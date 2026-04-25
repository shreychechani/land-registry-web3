import { ethers } from "ethers";

// ─────────────────────────────────────────────────────────────────────────────
// ENS ROOT FIX — staticNetwork prevents any resolveName() / ENS lookup
// ─────────────────────────────────────────────────────────────────────────────
const CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID || "31337");
const STATIC_NETWORK = new ethers.Network("land-registry", CHAIN_ID);

// ─────────────────────────────────────────────────────────────────────────────
// ABI — matches the rewritten LandRegistry.sol exactly
// ─────────────────────────────────────────────────────────────────────────────
const CONTRACT_ABI = [
  // ── Module 1: Registration ──────────────────────────────────────────────
  // 5-param version (tests): registerLand(id, owner, gps, area, docHash)
  "function registerLand(uint256 _landId, address _owner, string _gps, uint256 _area, string _docHash)",
  // 6-param version (frontend Register.jsx): adds title
  "function registerLandFull(uint256 _landId, address _owner, string _gps, uint256 _area, string _docHash, string _title)",
  "function updateDocument(uint256 _id, string _newHash)",

  // ── Module 2: Marketplace ───────────────────────────────────────────────
  "function listForSale(uint256 _id, uint256 _price)",
  "function cancelListing(uint256 _id)",
  "function cancelSale(uint256 _id)",          // alias — same as cancelListing
  "function buyLand(uint256 _id) payable",

  // ── Module 3: Read / History ────────────────────────────────────────────
  "function getLandHistory(uint256 _id) view returns (tuple(address previousOwner, address newOwner, uint256 price, uint256 timestamp, string transferType)[])",
  "function getLandsByOwner(address _owner) view returns (uint256[])",
  "function getAllLands() view returns (uint256[])",
  "function getTotalLands() view returns (uint256)",
  "function getForSaleLands() view returns (uint256[])",

  // ── Module 4: Verify ────────────────────────────────────────────────────
  "function getLandDetails(uint256 _id) view returns (tuple(uint256 landId, address owner, string gpsCoordinates, uint256 areaSqMeters, string documentHash, string title, bool isRegistered, bool isForSale, uint256 salePrice, bool hasLien, bool isDisputed, uint256 registeredAt, uint256 updatedAt))",
  "function verifyLand(uint256 _id) view returns (tuple(bool isRegistered, bool hasCleanTitle, bool hasLien, bool isDisputed, bool isForSale, address currentOwner, uint256 registeredAt, uint256 totalTransfers, string status))",

  // ── Module 5: Lien ──────────────────────────────────────────────────────
  "function addLien(uint256 _id)",             // bank address = msg.sender
  "function removeLien(uint256 _id)",
  "function lienHolder(uint256) view returns (address)",

  // ── Module 6: Dispute ───────────────────────────────────────────────────
  "function fileDispute(uint256 _id, string _evidenceHash)",
  "function resolveDispute(uint256 _id, address _rightfulOwner, string _resolution)",
  "function getDispute(uint256 _id) view returns (tuple(address filer, string evidenceHash, uint256 filedAt, bool resolved, string resolution))",

  // ── Governance ──────────────────────────────────────────────────────────
  "function government() view returns (address)",
  "function bank() view returns (address)",
  "function platformFeePercent() view returns (uint256)",

  // ── Events ──────────────────────────────────────────────────────────────
  "event LandRegistered(uint256 indexed landId, address indexed owner)",
  "event OwnershipTransferred(uint256 indexed landId, address indexed from, address indexed to, uint256 price)",
  "event ListedForSale(uint256 indexed landId, uint256 price)",
  "event SaleCancelled(uint256 indexed landId)",
  "event LandBought(uint256 indexed landId, address indexed buyer, uint256 price)",
  "event LienAdded(uint256 indexed landId, address indexed bankAddr)",
  "event LienRemoved(uint256 indexed landId)",
  "event DisputeFiled(uint256 indexed landId, address indexed claimant)",
  "event DisputeResolved(uint256 indexed landId, address indexed rightfulOwner)"
];

// ─────────────────────────────────────────────────────────────────────────────
// Contract address — reads contractAddresses.json or falls back to .env
// ─────────────────────────────────────────────────────────────────────────────
const getContractAddress = () => {
  try {
    // eslint-disable-next-line
    const addresses = require("./contractAddresses.json");
    const networkMap = { "31337": "localhost", "80001": "polygon_mumbai", "137": "polygon_mainnet" };
    const net = networkMap[String(window.__chainId__ || CHAIN_ID)] || "localhost";
    return addresses[net]?.LandRegistry || process.env.REACT_APP_CONTRACT_ADDRESS || "";
  } catch {
    return process.env.REACT_APP_CONTRACT_ADDRESS || "";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY provider — no MetaMask needed
// ─────────────────────────────────────────────────────────────────────────────
const _makeReadProvider = () =>
  new ethers.JsonRpcProvider(
    process.env.REACT_APP_RPC_URL || "http://127.0.0.1:8545",
    STATIC_NETWORK,
    { staticNetwork: STATIC_NETWORK }
  );

export const getReadContract = () => {
  const address = getContractAddress();
  if (!address || address.startsWith("PASTE"))
    throw new Error("Contract address not set — paste it into contractAddresses.json");
  return new ethers.Contract(address, CONTRACT_ABI, _makeReadProvider());
};

// ─────────────────────────────────────────────────────────────────────────────
// WRITE provider — BrowserProvider (MetaMask)
// ─────────────────────────────────────────────────────────────────────────────
export const getContract = async () => {
  if (!window.ethereum)
    throw new Error("MetaMask not installed — get it at metamask.io");

  await window.ethereum.request({ method: "eth_requestAccounts" });

  const rawChain = await window.ethereum.request({ method: "eth_chainId" });
  const parsedChainId = parseInt(rawChain, 16);
  window.__chainId__ = String(parsedChainId);

  const net = new ethers.Network("land-registry", parsedChainId);

  const provider = new ethers.BrowserProvider(
    window.ethereum,
    net,
    { staticNetwork: net }
  );

  const signer  = await provider.getSigner();
  const address = getContractAddress();

  if (!address || address.startsWith("PASTE"))
    throw new Error("Contract address not configured — check contractAddresses.json or .env");

  return new ethers.Contract(address, CONTRACT_ABI, signer);
};

// ─────────────────────────────────────────────────────────────────────────────
// Wallet helpers
// ─────────────────────────────────────────────────────────────────────────────
export const getCurrentWallet = async () => {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: "eth_accounts" });
  return accounts[0] || null;
};

export const connectWallet = async () => {
  if (!window.ethereum) throw new Error("MetaMask not found");
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  return accounts[0];
};

export const getBalance = async (address) => {
  try {
    const provider = _makeReadProvider();
    const balance  = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch {
    return "0";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Event listeners
// ─────────────────────────────────────────────────────────────────────────────
export const onAccountChange = (cb) => {
  window.ethereum?.on("accountsChanged", (accs) => cb(accs[0] || null));
};

export const onNetworkChange = (cb) => {
  window.ethereum?.on("chainChanged", (id) => cb(parseInt(id, 16)));
};

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers
// ─────────────────────────────────────────────────────────────────────────────
export const shortAddr = (addr) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

export const formatDate = (timestamp) => {
  if (!timestamp) return "—";
  const ms = Number(timestamp) * 1000;
  if (!ms || isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
};

export const formatEth = (wei) => {
  if (wei === undefined || wei === null || wei === "" || wei === 0n || wei === "0") return "—";
  try {
    return ethers.formatEther(wei.toString()) + " MATIC";
  } catch {
    return String(wei) + " wei";
  }
};