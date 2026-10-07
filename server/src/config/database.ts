import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

// Set public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Fallback to default DNS configuration
}

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`[Database] MongoDB connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database connection error';
    console.error(`[Database Error] Connection failed: ${errorMessage}`);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error closing database connection';
    console.error(`[Database Error] ${errorMessage}`);
  }
}
