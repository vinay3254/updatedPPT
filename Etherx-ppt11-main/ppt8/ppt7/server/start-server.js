import { spawn } from 'child_process';
import { createServer } from 'net';

// Function to check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// Function to find available port
async function findAvailablePort(startPort = 3000) {
  let port = startPort;
  while (port < startPort + 10) {
    if (await checkPort(port)) {
      return port;
    }
    port++;
  }
  throw new Error('No available ports found');
}

async function startServer() {
  try {
    const port = await findAvailablePort(3000);
    
    if (port !== 3000) {
      console.log(`⚠️  Port 3000 is busy, using port ${port} instead`);
      process.env.PORT = port;
    }
    
    console.log(`🚀 Starting server on port ${port}...`);
    
    // Import and start the server
    await import('./src/server.js');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();