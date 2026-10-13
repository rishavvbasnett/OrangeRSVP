import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errorClasses.js";
import { PlatformRole } from "../../features/users/users.types.js";

const requireRole = (...allowedRoles: PlatformRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const actor = req.actor;
    if (!actor) throw new UnauthorizedError("Authentication required");

    const roleIsAllowed = allowedRoles.includes(actor.platformRole);
    if (!roleIsAllowed) throw new ForbiddenError("Forbidden");

    next();
  };
};

export default requireRole;
