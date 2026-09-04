import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { HttpError } from "../utils/errors.js";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    return response.status(400).json({ error: error.issues });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({ error: error.message });
  }

  if (error instanceof mongoose.Error.CastError) {
    return response
      .status(400)
      .json({ error: `Invalid ${error.path}: ${error.value}` });
  }

  if (error instanceof TokenExpiredError) {
    return response.status(401).json({ error: "Token expired" });
  }

  if (error instanceof JsonWebTokenError) {
    return response.status(401).json({ error: "Invalid token" });
  }

  if (error instanceof Error) {
    return response.status(500).json({ error: error.message });
  }

  return response.status(500).json({ error: "An unknown error occurred" });
};
