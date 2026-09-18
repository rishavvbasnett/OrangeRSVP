import { Request, Response, NextFunction } from "express";
import type { role } from "../../features/users/users.types.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
import asyncHandler from "./asyncHandler.js";

const requireRole = (...allowedRoles: role[]) => {
  return asyncHandler(
    (request: Request, _response: Response, next: NextFunction) => {
      const userRole = request?.user?.role;
      if (!userRole) throw new UnauthorizedError("Unauthorized access");
      if (!allowedRoles.includes(userRole))
        throw new ForbiddenError("Forbidden");
      next();
    },
  );
};

export default requireRole;
