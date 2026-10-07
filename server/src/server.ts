import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { Server } from 'http';

let server: Server;

async function startServer(): Promise<void> {
  try {
    // 1. Connect Database
    await connectDatabase();

    // 2. Start HTTP Server
    server = app.listen(env.PORT, () => {
      console.log(
        `[MediTrack Server] Listening on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
      console.log(`[MediTrack Server] CORS origin allowed: ${env.CLIENT_URL}`);
    });
  } catch (error: unknown) {
    console.error('[MediTrack Server] Failed to initialize server:', error);
    process.exit(1);
  }
}

async function shutdownGracefully(signal: string): Promise<void> {
  console.log(`\n[MediTrack Server] ${signal} signal received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[MediTrack Server] HTTP server closed');
      await disconnectDatabase();
      console.log('[MediTrack Server] Shutdown complete. Exiting.');
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdownGracefully('SIGINT'));
process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));

startServer();
