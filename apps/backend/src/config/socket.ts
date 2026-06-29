import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { env } from './env';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.ALLOWED_ORIGINS.split(','),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      (socket as Socket & { userId?: string; userRole?: string }).userId = decoded.userId;
      (socket as Socket & { userId?: string; userRole?: string }).userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId?: string }).userId;
    logger.info(`Socket connected: ${socket.id} | User: ${userId}`);

    if (userId) {
      // Join user's personal room for targeted notifications
      socket.join(`user:${userId}`);
    }

    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getSocketServer = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// ============================================
// Socket Emission Helpers
// ============================================
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

export const emitToProject = (projectId: string, event: string, data: unknown): void => {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, data);
};

export const emitToAll = (event: string, data: unknown): void => {
  if (!io) return;
  io.emit(event, data);
};

export const SOCKET_EVENTS = {
  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  // Projects
  PROJECT_UPDATED: 'project:updated',
  PROJECT_STATUS_CHANGED: 'project:status_changed',
  // Tasks
  TASK_ASSIGNED: 'task:assigned',
  TASK_STATUS_CHANGED: 'task:status_changed',
  // Timesheets
  TIMESHEET_STATUS_CHANGED: 'timesheet:status_changed',
  TIMESHEET_SUBMITTED: 'timesheet:submitted',
  // Resources
  ALLOCATION_CHANGED: 'allocation:changed',
  // Attendance
  CHECKIN: 'attendance:checkin',
  CHECKOUT: 'attendance:checkout',
} as const;
