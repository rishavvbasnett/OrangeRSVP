import * as authService from "./auth.service.js";
import { Request, Response, NextFunction } from "express";
import { LoginUserSchema } from "./auth.validation.js";

export const login = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const credentials = LoginUserSchema.parse(request.body);
    const userInfo = await authService.login(credentials);
    return response.json(userInfo);
  } catch (error) {
    next(error);
  }
};

export default login;
