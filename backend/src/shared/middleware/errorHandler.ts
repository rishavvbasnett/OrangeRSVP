import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { DatabaseError } from "pg";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/errorClasses.js";

type PgErrorResponse = {
  status: number;
  message: string;
};

const PG_ERRORS: Record<string, PgErrorResponse> = {
  "23502": { status: 400, message: "A required field is missing" },
  "22P02": { status: 400, message: "Invalid input format" },
  "23514": { status: 400, message: "A field has an invalid value" },
  "23505": { status: 409, message: "Resource already exists" },
  "23503": { status: 409, message: "Related resource conflict" },
};

const findDatabaseError = (error: unknown): DatabaseError | undefined => {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (error instanceof Error && error.cause instanceof DatabaseError) {
    return error.cause;
  }

  return undefined;
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Zod validation errors
  if (error instanceof ZodError)
    return res.status(400).json({ error: error.issues });

  // JWT errors
  // TokenExpiredError extends JsonWebTokenError, so it must be checked first.
  if (error instanceof jwt.TokenExpiredError)
    return res.status(401).json({
      error: "Token expired",
    });
  if (error instanceof jwt.JsonWebTokenError)
    return res.status(401).json({
      error: "Invalid token",
    });

  //Custom errors
  if (error instanceof HttpError)
    return res.status(error.statusCode).json({ error: error.message });

  // Database (Drizzle + Postgres) errors
  const databaseError = findDatabaseError(error);
  if (databaseError?.code) {
    const pgErrorResponse = PG_ERRORS[databaseError.code];
    if (pgErrorResponse)
      return res
        .status(pgErrorResponse.status)
        .json({ error: pgErrorResponse.message });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
};

export default errorHandler;
