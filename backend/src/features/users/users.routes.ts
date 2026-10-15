import { Router, type Request } from "express";
import userController from "./users.controller.js";
import authenticate from "../../shared/middleware/authenticate.js";
import requireRole from "../../shared/middleware/requireRole.js";
import loadActor from "../../shared/middleware/loadActor.js";
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

userRouter.post("/", signupRateLimit, userController.createUser);

userRouter.get(
  "/",
  authenticate,
  loadActor,
  requireRole("admin"),
  userController.getAllUsers,
);
userRouter.get(
  "/:id",
  authenticate,
  loadActor,
  requireRole("admin", "customer"),
  userController.getUser,
);
userRouter.patch(
  "/:id",
  authenticate,
  loadActor,
  requireRole("admin", "customer"),
  userController.updateProfile,
);
userRouter.post(
  "/:id/deactivate",
  authenticate,
  loadActor,
  requireRole("admin"),
  userController.deactivateUser,
);

export default userRouter;
