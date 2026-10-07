import mongoose from 'mongoose';
import { env } from './env.js';

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
