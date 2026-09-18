import { Request, Response } from "express";
import * as restaurantService from "./restaurants.service.js";
import { RestaurantZodSchema } from "./restaurants.validation.js";
import { IdParamSchema } from "../../shared/shared.validation.js";
import asyncHandler from "../../shared/middleware/asyncHandler.js";

export const createOne = asyncHandler(
  async (request: Request, response: Response) => {
    const validRestaurant = RestaurantZodSchema.parse(request.body);
    const savedRestaurant = await restaurantService.createOne(validRestaurant);
    return response.status(201).json(savedRestaurant);
  },
);

export const getOne = asyncHandler(
  async (request: Request, response: Response) => {
    const validId = IdParamSchema.parse(request.params.id);
    const foundRestaurant = await restaurantService.getOne(validId);
    return response.json(foundRestaurant);
  },
);

export const getAll = asyncHandler(
  async (_request: Request, response: Response) => {
    const allRestaurants = await restaurantService.getAll();
    return response.json(allRestaurants);
  },
);

export const deleteOne = asyncHandler(
  async (request: Request, response: Response) => {
    const restaurantId = IdParamSchema.parse(request.params.id);
    const deletedRestaurant = await restaurantService.deleteOne(restaurantId);
    return response.json(deletedRestaurant);
  },
);
