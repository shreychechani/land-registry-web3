const { ethers } = require("hardhat");

async function main() {
  const [gov, bank] = await ethers.getSigners();

  console.log("Deploying with government:", gov.address);
  console.log("Bank address:", bank.address);

  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  const contract = await LandRegistry.deploy(gov.address, bank.address);

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log(" Contract deployed to:", address);
  console.log("Government:", gov.address);
  console.log("Bank:", bank.address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});