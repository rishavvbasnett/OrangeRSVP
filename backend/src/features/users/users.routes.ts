import { Router, type Request } from "express";
import userController from "./users.controller.js";
import authenticate from "../../shared/middleware/authenticate.js";
import requireRole from "../../shared/middleware/requireRole.js";
import { rateLimit } from "../../shared/middleware/rateLimit.js";

const userRouter = Router();

const identifyByIp = (req: Request): string => {
  const clientIp = req.ip ?? "unknown";
  return clientIp;
};

const signupRateLimit = rateLimit({
  feature: "signup",
  maxRequests: 5,
  resetWindowSeconds: 60,
  keyGenerator: identifyByIp,
});

const adminOnly = [authenticate, requireRole("admin")];

userRouter.post("/", signupRateLimit, userController.createUser);

userRouter.get("/", adminOnly, userController.getAllUsers);
userRouter.get("/:id", adminOnly, userController.getUser);
userRouter.patch("/:id", adminOnly, userController.updateProfile);
userRouter.post("/:id/deactivate", adminOnly, userController.deactivateUser);

export default userRouter;
