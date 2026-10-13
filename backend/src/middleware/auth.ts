import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { User } from '../models/User';

export interface AuthPayload {
  userId: string;
  role: 'brand' | 'creator';
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token from Authorization header.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    // Verify user still exists in DB
    const user = await User.findById(decoded.userId).select('_id role');
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expired'));
    } else {
      next(ApiError.unauthorized());
    }
  }
};
