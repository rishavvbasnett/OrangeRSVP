import z from "zod";
import type {
  businessHourSchema,
  businessHoursSchema,
  RestaurantZodSchema,
} from "./restaurants.validation.js";
import type { timeStringSchema } from "@/shared/shared.validation.js";
import { Document } from "mongoose";

export type RestaurantInput = z.infer<typeof RestaurantZodSchema>;
export type timeString = z.infer<typeof timeStringSchema>;
export type businessHour = z.infer<typeof businessHourSchema>;
export type businessHours = z.infer<typeof businessHoursSchema>;

export interface RestaurantDocument extends Document {
  name: string;
  address: string;
  isActive: boolean;
  businessHours: businessHours;
}
