import express from "express";
import authController from "./auth.controller.js";
import { rateLimit } from "../../shared/middleware/rateLimit.js";

const authRouter = express.Router();

authRouter.post(
  "/",
  rateLimit({
    maxRequests: 5,
    resetWindowSeconds: 60,
    feature: "login",
    keyGenerator: (request: Request) => request.ip,
  }),
  authController.login,
);

export default authRouter;
