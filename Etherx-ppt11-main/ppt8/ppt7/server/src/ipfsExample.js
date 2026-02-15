const ipfsService = require('./ipfsService');

// Upload JSON data
async function uploadPresentationData(presentationData) {
  try {
    const result = await ipfsService.uploadJSON(presentationData);
    console.log('IPFS Hash:', result.IpfsHash);
    return result.IpfsHash;
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

// Upload file
async function uploadFile(fileBuffer, fileName) {
  try {
    const file = new File([fileBuffer], fileName);
    const result = await ipfsService.uploadFile(file);
    console.log('File IPFS Hash:', result.IpfsHash);
    return result.IpfsHash;
  } catch (error) {
    console.error('File upload failed:', error);
  }
}

module.exports = { uploadPresentationData, uploadFile };