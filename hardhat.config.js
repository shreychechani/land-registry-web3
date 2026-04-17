require("@nomicfoundation/hardhat-toolbox");
//  hardhat-toolbox already includes hardhat-chai-matchers,
//    hardhat-ethers, and hardhat-network-helpers — this single
//    import is all you need. Do NOT import them separately.

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
  },
};