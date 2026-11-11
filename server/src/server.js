import app from './app.js';
import { config } from './config/config.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`  CampusBid API Server running on port ${PORT}`);
  console.log(`  API Base URL: http://localhost:${PORT}/api/v1`);
  console.log(`  OpenAPI Specification: ./contracts/openapi.yaml`);
  console.log(`===========================================`);
});
