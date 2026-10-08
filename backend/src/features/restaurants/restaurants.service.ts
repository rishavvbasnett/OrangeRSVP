import type { RestaurantInput } from "./restaurants.types.js";
import type { RestaurantDocument } from "./restaurants.types.js";
import Restaurant from "./restaurants.model.js";
import { ResourceNotFoundError } from "../../shared/utils/errorClasses.js";

export const createOne = async (
  restaurantInput: RestaurantInput,
): Promise<RestaurantDocument> => {
  const restaurantDocument: RestaurantDocument =
    await Restaurant.create(restaurantInput);
  return restaurantDocument;
};

export const deleteOne = async (
  restaurantId: string,
): Promise<RestaurantDocument> => {
  const deletedRestaurant = await Restaurant.findByIdAndDelete(restaurantId);
  if (!deletedRestaurant) {
    throw new ResourceNotFoundError("Restaurant not found");
  }
  return deletedRestaurant;
};

export const getAll = async (): Promise<RestaurantDocument[]> => {
  const allRestaurants = await Restaurant.find({})
    .sort({ name: 1, _id: 1 })
    .lean();
  return allRestaurants;
};

export const getOne = async (
  restaurantId: string,
): Promise<RestaurantDocument> => {
  const foundRestaurant = await Restaurant.findById(restaurantId).lean();
  if (!foundRestaurant) throw new ResourceNotFoundError("Restaurant not found");
  return foundRestaurant;
};
