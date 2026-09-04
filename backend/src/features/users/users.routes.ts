import { createUser, getAllUsers, deleteUser } from "./users.controller.js";
import express from "express";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.get("/", getAllUsers);
userRouter.delete("/:id", deleteUser);

export default userRouter;
