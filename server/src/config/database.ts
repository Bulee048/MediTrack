import { databaseLookup } from './databaseLookup.js';
import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

// Set public DNS servers to resolve MongoDB Atlas SRV records reliably on Windows
try {
  const dnsServers = (process.env.TEST_DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',');
  dns.setServers(dnsServers);
  const resolver = new dns.promises.Resolver();
  resolver.setServers(dnsServers);
  dns.promises.resolveSrv = resolver.resolveSrv.bind(resolver);
  dns.promises.resolveTxt = resolver.resolveTxt.bind(resolver);
} catch {
  // Fallback to default DNS configuration
}

export async function connectDatabase(): Promise<typeof mongoose> {
  if (env.NODE_ENV === 'production' && env.MONGODB_DB_NAME) throw new Error('Demo database cannot be used in production mode');
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, { ...(env.MONGODB_DB_NAME ? {dbName:env.MONGODB_DB_NAME} : {}), lookup: databaseLookup });
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.name} on host ${conn.connection.host}`);
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
