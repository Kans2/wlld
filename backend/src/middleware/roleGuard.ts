import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

/**
 * Role-based access control middleware.
 * Must be used AFTER authenticate middleware.
 */
export const roleGuard = (...allowedRoles: Array<'brand' | 'creator'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
    }

    next();
  };
};
