import bcrypt from "bcrypt";
import User from "../../features/users/users.model.js";
import * as authService from "../../features/auth/auth.service.js";
import type { role } from "../../features/users/users.types.js";
import { randomUUID } from "node:crypto";
import type { IdParam } from "../shared.types.js";
import Restaurant from "../../features/restaurants/restaurants.model.js";
import { ItemNotFoundError } from "./errors.js";

const saltRounds = 12;

export const convert = async (value: string): Promise<string> => {
  return await bcrypt.hash(value, saltRounds);
};

export const compare = async (
  plainValue: string,
  hashedValue: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainValue, hashedValue);
};

export const createToken = async (role: role) => {
  const user = await User.create({
    email: `${randomUUID()}@gmail.com`,
    role,
    passwordHash: "123",
  });
  const token = authService.createToken({ id: user.id, role: user.role });
  return token;
};

export const ensureRestaurantExists = async (restaurantId: IdParam) => {
  const foundRestaurant = await Restaurant.findById(restaurantId);
  if (!foundRestaurant) throw new ItemNotFoundError("Restaurant doesn't exist");
  return foundRestaurant;
};

export const ensureUserExists = async (userId: IdParam) => {
  const foundUser = await User.findById(userId);
  if (!foundUser) throw new ItemNotFoundError("User doesn't exist");
  return foundUser;
};
