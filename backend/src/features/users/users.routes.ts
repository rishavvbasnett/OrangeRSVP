import { Router } from "express";
import userController from "./users.controller.js";

const userRouter = Router();

userRouter.post("/", userController.createUser);
userRouter.get("/", userController.getAllUsers);
userRouter.get("/:id", userController.getUser);
userRouter.patch("/:id", userController.updateProfile);
userRouter.post("/:id/deactivate", userController.deactivateUser);

export default userRouter;
