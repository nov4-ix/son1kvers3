import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { UserTier, TIER_LEVELS } from '../constants/tiers';

export interface UserPayload {
  userId: string;
  email: string;
  tier: UserTier;
  exp?: number;
}

// JWT verification middleware
export async function authenticateRequest(req: FastifyRequest, res: FastifyReply) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).send({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as UserPayload;
    // Attach user to request
    (req as any).user = decoded;
  } catch (error) {
    return res.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
}

// Tier verification middleware
export function requireTier(minimumTier: UserTier) {
  return async (req: FastifyRequest, res: FastifyReply) => {
    const user = (req as any).user as UserPayload;
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized: Authentication required' });
    }
    if (TIER_LEVELS[user.tier] < TIER_LEVELS[minimumTier]) {
      return res.status(403).send({
        error: 'Access denied',
        message: `This feature requires ${minimumTier} clearance or higher`,
        currentTier: user.tier,
        requiredTier: minimumTier,
        upgradeUrl: '/pricing'
      });
    }
  };
}

// Socket.io authentication middleware
export function authenticateSocket(socket: any, next: Function) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as UserPayload;
    // Attach user to socket
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
}

// Socket.io tier check
export function validateSocketTier(socket: any, minimumTier: UserTier): boolean {
  const user = socket.user as UserPayload;
  if (!user) return false;
  return TIER_LEVELS[user.tier] >= TIER_LEVELS[minimumTier];
}
