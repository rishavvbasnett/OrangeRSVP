import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errorClasses.js";
import { PlatformRole } from "../../features/users/users.types.js";

const requireRole = (...allowedRoles: PlatformRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.user;
    if (!currentUser) throw new UnauthorizedError("Authentication required");

    const roleIsAllowed = allowedRoles.includes(currentUser.platformRole);
    if (!roleIsAllowed) throw new ForbiddenError("Forbidden");

    next();
  };
};

export default requireRole;
