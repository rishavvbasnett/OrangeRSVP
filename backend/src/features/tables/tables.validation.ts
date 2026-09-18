import z from "zod";

export const TableInputSchema = z
  .object({
    restaurantId: z.string(),
    tableName: z.string().min(1),
    seats: z.number().int().min(1),
    status: z.enum(["available", "reserved", "occupied", "unavailable"]),
    overload: z.boolean().default(false),
    maximumCapacity: z.number().int().min(1).optional(),
  })
  .transform((data) => ({
    ...data,
    maximumCapacity: data.maximumCapacity ?? data.seats,
  }));

export const TableUpdateSchema = z.object({
  restaurantId: z.string().optional(),
  tableName: z.string().min(1).optional(),
  seats: z.number().int().min(1).optional(),
  status: z
    .enum(["available", "reserved", "occupied", "unavailable"])
    .optional(),
  overload: z.boolean().optional(),
  maximumCapacity: z.number().int().min(1).optional(),
});

export const SetOverloadSchema = z.object({
  newCapacity: z.number().int().min(1),
});
