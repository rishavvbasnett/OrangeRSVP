import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import { ProfileUpdateSchema, UserInputSchema } from "./users.validation.js";
import userService from "./users.service.js";
import { IdParamSchema } from "../../shared/shared.validation.js";

const createUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const parsedUser = UserInputSchema.parse(req.body);
    const savedUser = await userService.createUser(parsedUser);
    return res.status(201).json(savedUser);
  },
);

const getAllUsers = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const allUsers = await userService.getAllUsers();
    return res.json(allUsers);
  },
);

const getUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = IdParamSchema.parse(req.params.id);
    const foundUser = await userService.getUser(id);
    return res.json(foundUser);
  },
);

const updateProfile = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = IdParamSchema.parse(req.params.id);
    const parsedUpdates = ProfileUpdateSchema.parse(req.body);
    const updatedUser = await userService.updateProfile(id, parsedUpdates);
    return res.json(updatedUser);
  },
);

const deactivateUser = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction) => {
    const id = IdParamSchema.parse(req.params.id);
    const deactivatedUser = await userService.deactivateUser(id);
    return res.json(deactivatedUser);
  },
);

const userController = {
  createUser,
  getUser,
  getAllUsers,
  updateProfile,
  deactivateUser,
};

export default userController;
