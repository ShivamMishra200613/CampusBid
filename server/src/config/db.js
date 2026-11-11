import mongoose from 'mongoose';
import { config } from './config.js';

export const connectDB = async (customUri) => {
  const uri = customUri || config.mongoUri;

  const tryConnect = async () => {
    return await mongoose.connect(uri);
  };

  try {
    const conn = await tryConnect();
    console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`MongoDB connection attempt failed: ${err.message}. Retrying once in 2s...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const conn = await tryConnect();
      console.log(`MongoDB Connected (retry): ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
      return conn;
    } catch (retryErr) {
      console.error(`MongoDB connection failed after retry: ${retryErr.message}`);
      throw retryErr;
    }
  }
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
