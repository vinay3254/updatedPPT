import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class IPFSService {
  constructor() {
    this.apiKey = process.env.IPFS_API_KEY;
    this.secret = process.env.IPFS_SECRET;
    this.jwt = process.env.IPFS_JWT;
    this.baseURL = 'https://api.pinata.cloud';
  }

  async uploadFile(fileBuffer, fileName) {
    const formData = new FormData();
    formData.append('file', fileBuffer, fileName);

    const response = await fetch(`${this.baseURL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secret,
        ...formData.getHeaders()
      },
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('File upload response status:', response.status);
      console.error('File upload response body:', result);
      throw new Error(`IPFS upload failed: ${JSON.stringify(result)}`);
    }
    return result;
  }

  async uploadJSON(jsonData) {
    if (!this.apiKey || !this.secret) {
      throw new Error('IPFS credentials not configured. Please set IPFS_API_KEY and IPFS_SECRET in .env file');
    }

    const response = await fetch(`${this.baseURL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secret
      },
      body: JSON.stringify({
        pinataContent: jsonData
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Response status:', response.status);
      console.error('Response body:', result);
      throw new Error(`IPFS JSON upload failed: ${JSON.stringify(result)}`);
    }
    return result;
  }
}

export default new IPFSService();