import { Request, Response, NextFunction } from "express";
import type { role } from "../../features/users/users.types.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

const requireRole = (...allowedRoles: role[]) => {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      const userRole = request?.user?.role;
      if (!userRole) throw new UnauthorizedError("Unauthorized access");
      if (!allowedRoles.includes(userRole))
        throw new ForbiddenError("Forbidden");
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requireRole;
