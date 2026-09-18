import { Request, Response } from "express";
import * as userService from "./users.service.js";
import { UserInputSchema } from "./users.validation.js";
import { IdParamSchema } from "../../shared/shared.validation.js";
import { ItemNotFoundError } from "../../shared/utils/errors.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";

export const createUser = asyncHandler(
  async (request: Request, response: Response) => {
    const validUserObject = UserInputSchema.parse(request.body);
    const createdUser = await userService.createOne(validUserObject);
    return response.status(201).json(createdUser);
  },
);

export const getAllUsers = asyncHandler(
  async (_request: Request, response: Response) => {
    const allUsers = await userService.getAll();
    return response.json(allUsers);
  },
);

export const deleteUser = asyncHandler(
  async (request: Request, response: Response) => {
    const rawId = request.params.id;
    const parsedId = IdParamSchema.safeParse(rawId);
    if (!parsedId.success) {
      throw new ItemNotFoundError(parsedId.error.issues[0].message);
    }

    const deletedUser = await userService.deleteOne(parsedId.data);
    return response.status(200).json(deletedUser);
  },
);
