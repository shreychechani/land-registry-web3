// utils/contract.js
// This file connects your React frontend to the deployed smart contract.
// After you deploy LandRegistry.sol, paste the address in CONTRACT_ADDRESS.

import { ethers } from 'ethers';

// ── PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE AFTER RUNNING deploy.js ──
export const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';

// ── PASTE YOUR CONTRACT ABI HERE AFTER RUNNING: npx hardhat compile ──
// The ABI is in: artifacts/contracts/LandRegistry.sol/LandRegistry.json
export const CONTRACT_ABI = [
  "function registerLand(uint256 landId, address owner, string gps, uint256 area, string docHash) public",
  "function listForSale(uint256 landId, uint256 price) public",
  "function buyLand(uint256 landId) public payable",
  "function getLandDetails(uint256 landId) public view returns (address owner, string memory gps, uint256 area, string memory docHash, bool isForSale, bool hasLien, bool isDisputed)",
  "function getLandHistory(uint256 landId) public view returns (tuple(address previousOwner, address newOwner, uint256 price, uint256 timestamp)[])",
  "function verifyLand(uint256 landId) public view returns (bool isRegistered, bool hasCleanTitle, address currentOwner, uint256 totalTransfers, string memory status)",
  "function addLien(uint256 landId, address lender) public",
  "function removeLien(uint256 landId) public",
  "function fileDispute(uint256 landId, string evidenceHash) public",
  "function resolveDispute(uint256 landId, address rightfulOwner, string resolutionNotes) public",
  "event LandRegistered(uint256 landId, address owner)",
  "event OwnershipTransferred(uint256 landId, address from, address to)",
  "event LienAdded(uint256 landId, address bank)",
  "event LienRemoved(uint256 landId)",
  "event DisputeFiled(uint256 landId)",
  "event DisputeResolved(uint256 landId, address rightfulOwner)",
];

// Connect wallet and return contract instance
export const getContract = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed. Please install MetaMask.');
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

// Get read-only contract (no wallet needed)
export const getReadContract = async () => {
  if (!window.ethereum) throw new Error('MetaMask not installed.');
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

// Get current connected wallet address
export const getCurrentWallet = async () => {
  if (!window.ethereum) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
};

// Format wei to ETH string
export const formatEth = (wei) => {
  try { return ethers.formatEther(wei) + ' ETH'; }
  catch { return '0 ETH'; }
};

// Format timestamp to readable date
export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

// Shorten wallet address for display
export const shortAddr = (addr) => {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
};