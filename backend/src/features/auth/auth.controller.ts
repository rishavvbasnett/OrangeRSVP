import type { Request, Response, NextFunction } from "express";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import { CredentialSchema, RefreshTokenSchema } from "./auth.validation.js";
import authService from "./auth.service.js";
import { extractBearerToken } from "./auth.tokens.js";

const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const credential = CredentialSchema.parse(req.body);
    const userAndTokenPair = await authService.login(credential);
    res.json(userAndTokenPair);
  },
);

const refresh = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken } = RefreshTokenSchema.parse(req.body);
    const userAndTokenPair = await authService.refresh(refreshToken);
    res.json(userAndTokenPair);
  },
);

const logout = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken } = RefreshTokenSchema.parse(req.body);
    const accessToken = extractBearerToken(req.headers.authorization);
    await authService.logout(refreshToken, accessToken);
    res.status(204).end();
  },
);

const authController = {
  login,
  logout,
  refresh,
};

export default authController;
