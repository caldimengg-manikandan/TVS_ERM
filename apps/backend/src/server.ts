import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeSocket } from './config/socket';
import { logger } from './utils/logger';

const httpServer = createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

const startServer = async () => {
  try {
    // Connect to database and Redis
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    httpServer.listen(env.PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════╗
║          TVS Enterprise Resource Management           ║
╠══════════════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(36)}║
║  Port        : ${String(env.PORT).padEnd(36)}║
║  API Base    : http://localhost:${env.PORT}/api${' '.repeat(20)}║
║  Health      : http://localhost:${env.PORT}/health${' '.repeat(16)}║
╚══════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      httpServer.close(async () => {
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Server shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
