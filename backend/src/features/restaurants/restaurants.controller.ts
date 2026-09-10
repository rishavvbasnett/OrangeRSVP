import { Request, Response, NextFunction } from "express";
import * as restaurantService from "./restaurants.service.js";
import { RestaurantZodSchema } from "./restaurants.validation.js";
import { IdParamSchema } from "../../shared/shared.validation.js";

export const createOne = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validRestaurant = RestaurantZodSchema.parse(request.body);
    const savedRestaurant = await restaurantService.createOne(validRestaurant);
    return response.status(201).json(savedRestaurant);
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validId = IdParamSchema.parse(request.params.id);
    const foundRestaurant = await restaurantService.getOne(validId);
    return response.json(foundRestaurant);
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const allRestaurants = await restaurantService.getAll();
    return response.json(allRestaurants);
  } catch (error) {
    next(error);
  }
};

export const deleteOne = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const restaurantId = IdParamSchema.parse(request.params.id);
    const deletedRestaurant = await restaurantService.deleteOne(restaurantId);
    return response.json(deletedRestaurant);
  } catch (error) {
    next(error);
  }
};
