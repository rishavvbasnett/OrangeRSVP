import z from "zod";

export const IdParamSchema = z
  .string()
  .min(1, "ID is required")
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectID");

export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Time must be in HH:mm format",
  });
