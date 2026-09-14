import { Request, Response, NextFunction, RequestHandler } from "express";

const asyncHandler = (
  fn: (
    request: Request,
    response: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return (request, response, next) => {
    Promise.resolve(fn(request, response, next)).catch(next);
  };
};

export default asyncHandler;
