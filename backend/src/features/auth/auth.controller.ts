import authService from "./auth.service.js";
import { Request, Response } from "express";
import { LoginUserSchema } from "./auth.validation.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";

export const login = asyncHandler(
  async (request: Request, response: Response) => {
    const credentials = LoginUserSchema.parse(request.body);
    const userInfo = await authService.login(credentials);
    return response.json(userInfo);
  },
);

const authController = {
  login,
};

export default authController;
