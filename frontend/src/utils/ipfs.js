// utils/ipfs.js
// Uploads documents to IPFS via Pinata and retrieves them.

const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;

// Upload a file (PDF, image) to IPFS
export const uploadToIPFS = async (file) => {
  if (!PINATA_JWT) throw new Error('Pinata JWT not set in .env');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('pinataMetadata', JSON.stringify({ name: file.name }));

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!res.ok) throw new Error('Failed to upload to IPFS');
  const data = await res.json();
  return data.IpfsHash; // Store this in smart contract as documentHash
};

// Upload JSON metadata to IPFS
export const uploadJSONToIPFS = async (jsonData) => {
  if (!PINATA_JWT) throw new Error('Pinata JWT not set in .env');

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pinataContent: jsonData }),
  });

  if (!res.ok) throw new Error('Failed to upload JSON to IPFS');
  const data = await res.json();
  return data.IpfsHash;
};

// Get public URL for any IPFS hash
export const getIPFSUrl = (hash) => {
  if (!hash || hash === '') return null;
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
};