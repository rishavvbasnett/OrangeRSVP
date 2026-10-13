import type { Request, Response, NextFunction } from "express";
import asyncHandler from "./asyncHandler.js";
import { UnauthorizedError } from "../utils/errorClasses.js";
import { getActor } from "../../features/auth/auth.actor.js";

const loadActor = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authenticatedUser = req.user;
    if (!authenticatedUser)
      throw new UnauthorizedError("Authentication required");

    const actor = await getActor(authenticatedUser.id);

    if (!actor || !actor.isActive) throw new UnauthorizedError("Invalid token");

    req.actor = actor;
    next();
  },
);

export default loadActor;
