import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors.js";
import { JWT_SECRET } from "../config/env.js";
import jwt from "jsonwebtoken";
import asyncHandler from "./asyncHandler.js";

const authenticate = asyncHandler(
  (request: Request, _response: Response, next: NextFunction): void => {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) throw new UnauthorizedError("Token not provided");
    const decodedToken = jwt.verify(token, JWT_SECRET);
    request.user = decodedToken;
    next();
  },
);

export default authenticate;
