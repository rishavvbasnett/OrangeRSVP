import { Router, type Request } from "express";
import { rateLimit } from "../../shared/middleware/rateLimit.js";
import authController from "./auth.controller.js";

const authRouter = Router();

const identifyByIp = (req: Request): string => {
  const clientIp = req.ip ?? "unknown";
  return clientIp;
};

const loginRateLimit = rateLimit({
  feature: "login",
  maxRequests: 5,
  resetWindowSeconds: 60,
  keyGenerator: identifyByIp,
});

const refreshRateLimit = rateLimit({
  feature: "refresh",
  maxRequests: 20,
  resetWindowSeconds: 60,
  keyGenerator: identifyByIp,
});

authRouter.post("/login", loginRateLimit, authController.login);
authRouter.post("/refresh", refreshRateLimit, authController.refresh);
authRouter.post("/logout", authController.logout);

export default authRouter;
