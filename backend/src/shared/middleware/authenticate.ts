import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors.js";
import { JWT_SECRET } from "../config/env.js";
import jwt from "jsonwebtoken";

const authenticate = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  try {
    const token = request.headers.authorization?.split(" ")[1];
    if (!token) throw new UnauthorizedError("Token not provided");
    const decodedToken = jwt.verify(token, JWT_SECRET);
    request.user = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
