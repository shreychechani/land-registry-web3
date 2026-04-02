# 🏛️ Blockchain Land Registry

A decentralized land registry system built on Polygon blockchain, 
inspired by IBM's Ghana blockchain land registry project.
Eliminates paper-based title deeds, fraud, and slow verification 
by recording land ownership permanently on-chain.

---

## 🚀 Live Demo
> Coming soon — deploying to Polygon Mumbai testnet

---

## 🧠 The Problem We're Solving
Traditional land registries are:
- Paper-based and easy to forge
- Siloed across multiple government departments
- Slow to verify (weeks for title search)
- Vulnerable to fraud and duplicate titles

This project fixes all of that with blockchain.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20 |
| Blockchain Network | Polygon Mumbai (testnet) |
| Development Environment | Hardhat |
| Frontend | React + Ethers.js |
| Wallet | MetaMask |
| Document Storage | IPFS via Pinata |
| Document Analysis | IBM Watson NLU |
| Security Library | OpenZeppelin |

---

## 📦 Modules

| # | Module | Description |
|---|---|---|
| 1 | Land Registration | Government registers parcels on-chain with GPS + IPFS document hash |
| 2 | Buy / Sell | Smart contract escrow — instant atomic ownership transfer |
| 3 | Ownership History | Immutable chain of title — every owner since registration |
| 4 | Verification | Instant clean/encumbered title check for banks and lawyers |
| 5 | Mortgage / Lien | Bank records lien on-chain — auto-releases on repayment |
| 6 | Dispute Resolution | File, evidence, resolve — all on-chain with government authority |

---

## 🗂️ Project Structure
```
land-registry-web3/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deploy and seed scripts
├── test/               # Automated contract tests
├── frontend/           # React application
│   └── src/
│       ├── pages/      # Register, Buy, History, Verify, Dashboard
│       └── utils/      # contract.js, ipfs.js, ibmApi.js
├── backend/            # Optional Node.js API server
├── hardhat.config.js
└── .env.example
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Alchemy account (free) — alchemy.com
- Pinata account (free) — pinata.cloud
- IBM Cloud account (free) — cloud.ibm.com

### Installation
```bash
git clone https://github.com/tusharparihar05/land-registry-web3.git
cd land-registry-web3
npm install
cp .env.example .env

```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Local Blockchain
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Polygon Testnet
```bash
npx hardhat run scripts/deploy.js --network polygon_mumbai
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in:
```
PRIVATE_KEY=           # MetaMask wallet private key
ALCHEMY_URL=           # Alchemy Polygon Mumbai RPC URL  
PINATA_JWT=            # Pinata API JWT token
IBM_API_KEY=           # IBM Cloud API key
```

---

## 📡 IBM API Integration

This project uses **IBM Watson Natural Language Understanding** to automatically extract owner name, GPS coordinates, and land area from uploaded title deed PDFs — reducing manual data entry errors during registration.

Reference project: IBM & Ghana Government blockchain land registry (2019)

---

## 👥 Team

| Name | Role |
|---|---|
| [Tushar Parihar] | Smart Contract + IBM API Integration |
| [Shrey Chechani] | Frontend + UI/UX |

---

## 📚 References
- IBM Blockchain for Government Registries
- Nakamoto, S. (2008) — Bitcoin White Paper
- OpenZeppelin Contracts Documentation
- Hyperledger Fabric Documentation

---

## 📄 License
MIT License
```
