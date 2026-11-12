import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('FATAL: MONGO_URI environment variable is required in production');
  }
}

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.warn('WARNING: JWT_SECRET is not set. Using insecure development default secret.');
  jwtSecret = 'dev-insecure-jwt-secret-campusbid';
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri:
    process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/campusbid_test'
      : process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusbid',
  mongoUriTest: process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/campusbid_test',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@ves.ac.in',
  adminPassword: process.env.ADMIN_PASSWORD || 'change-me-admin',
  auctionSweepMs: parseInt(process.env.AUCTION_SWEEP_MS, 10) || 10000,
  cloudinaryUrl: process.env.CLOUDINARY_URL || ''
};
