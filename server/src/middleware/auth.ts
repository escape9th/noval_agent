import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未登录' });
  }

  try {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    res.status(401).json({ success: false, error: '登录已过期' });
  }
}
