import { Schema, model } from "mongoose";
import type { RestaurantDocument } from "./restaurants.types.js";

const RestaurantDbSchema = new Schema<RestaurantDocument>({
  name: {
    type: String,
    required: [true, "Name is required"],
    unique: true,
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  businessHours: {
    type: [
      {
        day: { type: String, required: true },
        opensAt: { type: String, required: true },
        closesAt: { type: String, required: true },
      },
    ],
    required: [true, "Business hours is required"],
  },
});

const Restaurant = model<RestaurantDocument>("Restaurant", RestaurantDbSchema);

export default Restaurant;
