import { Request, Response, NextFunction } from "express";
import * as userService from "./users.service.js";
import { RegisterUserSchema } from "./users.validation.js";
import { IdParamSchema } from "../../shared/shared.validation.js";
import { ItemNotFoundError } from "../../shared/utils/errors.js";
import { ZodError } from "zod";

export const createUser = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validUserObject = RegisterUserSchema.parse(request.body);
    const createdUser = await userService.createOne(validUserObject);
    return response.status(201).json(createdUser);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const allUsers = await userService.getAll();
    return response.json(allUsers);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const rawId = request.params.id;
    const validId = IdParamSchema.parse(rawId);

    const deletedUser = await userService.deleteOne(validId);
    return response.status(200).json(deletedUser);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ItemNotFoundError(error.issues[0].message);
    }
    next(error);
  }
};
