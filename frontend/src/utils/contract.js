// utils/contract.js
// This file connects your React frontend to the deployed smart contract.
// After you deploy LandRegistry.sol, paste the address in CONTRACT_ADDRESS.

import { ethers } from 'ethers';

// ── PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE AFTER RUNNING deploy.js ──
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// ── PASTE YOUR CONTRACT ABI HERE AFTER RUNNING: npx hardhat compile ──
// The ABI is in: artifacts/contracts/LandRegistry.sol/LandRegistry.json
export const CONTRACT_ABI = [
 
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "addLien",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "buyLand",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "cancelListing",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "evidenceHash",
				"type": "string"
			}
		],
		"name": "fileDispute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gov",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_bank",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "filer",
				"type": "address"
			}
		],
		"name": "DisputeFiled",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "rightfulOwner",
				"type": "address"
			}
		],
		"name": "DisputeResolved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "LandBought",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "LandRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "bank",
				"type": "address"
			}
		],
		"name": "LienAdded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "LienRemoved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "ListedForSale",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "listForSale",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "to",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "gpsCoordinates",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "areaSqMeters",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "documentHash",
				"type": "string"
			}
		],
		"name": "registerLand",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "removeLien",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "rightfulOwner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "resolutionNotes",
				"type": "string"
			}
		],
		"name": "resolveDispute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "SaleCancelled",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "bank",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "disputes",
		"outputs": [
			{
				"internalType": "address",
				"name": "filer",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "evidenceHash",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "filedAt",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "resolved",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "resolution",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "getDispute",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "filer",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "evidenceHash",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "filedAt",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "resolved",
						"type": "bool"
					},
					{
						"internalType": "string",
						"name": "resolution",
						"type": "string"
					}
				],
				"internalType": "struct LandRegistry.Dispute",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "getLandDetails",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "landId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "owner",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "gpsCoordinates",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "areaSqMeters",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "documentHash",
						"type": "string"
					},
					{
						"internalType": "bool",
						"name": "isRegistered",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isForSale",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "salePrice",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "hasLien",
						"type": "bool"
					},
					{
						"internalType": "bool",
						"name": "isDisputed",
						"type": "bool"
					},
					{
						"internalType": "uint256",
						"name": "registeredAt",
						"type": "uint256"
					}
				],
				"internalType": "struct LandRegistry.LandParcel",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "getLandHistory",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "previousOwner",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "newOwner",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "price",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct LandRegistry.OwnershipRecord[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "government",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "history",
		"outputs": [
			{
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "lands",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "gpsCoordinates",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "areaSqMeters",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "documentHash",
				"type": "string"
			},
			{
				"internalType": "bool",
				"name": "isRegistered",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isForSale",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "salePrice",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "hasLien",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isDisputed",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "registeredAt",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "lienHolder",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "landId",
				"type": "uint256"
			}
		],
		"name": "verifyLand",
		"outputs": [
			{
				"internalType": "bool",
				"name": "isRegistered",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "hasCleanTitle",
				"type": "bool"
			},
			{
				"internalType": "address",
				"name": "currentOwner",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "totalTransfers",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "status",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}

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