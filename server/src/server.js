import http from 'http';
import app from './app.js';
import { config } from './config/config.js';
import { connectDB } from './config/db.js';
import { startAuctionSweeper } from './services/auctionCloser.js';
import { initSockets } from './sockets/index.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    initSockets(server);

    const PORT = config.port;
    server.listen(PORT, () => {
      console.log(`===========================================`);
      console.log(`  CampusBid API & Socket Server running on port ${PORT}`);
      console.log(`  API Base URL: http://localhost:${PORT}/api/v1`);
      console.log(`  Socket.IO: ws://localhost:${PORT}`);
      console.log(`  OpenAPI Specification: ./contracts/openapi.yaml`);
      console.log(`===========================================`);

      // Start the auction closer sweeper (only in server.js)
      startAuctionSweeper();
      console.log(`[Sweeper] Auction closer active (interval: ${config.auctionSweepMs}ms)`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
