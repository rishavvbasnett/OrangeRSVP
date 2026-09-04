import z from "zod";
import { timeStringSchema } from "../../shared/shared.validation.js";

export const businessHourSchema = z.discriminatedUnion("closed", [
  z.object({
    closed: z.literal(false),
    day: z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]),
    opensAt: timeStringSchema,
    closesAt: timeStringSchema,
  }),
  z.object({
    closed: z.literal(true),
    day: z
      .enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
      .optional(),
  }),
]);

export const businessHoursSchema = z.array(businessHourSchema);

export const RestaurantZodSchema = z.object({
  name: z.string().min(1, { message: "name is required" }),
  address: z.string().min(1, { message: "address is required" }),
  isActive: z.boolean().default(true),
  businessHours: businessHoursSchema,
});
