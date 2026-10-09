import z from "zod";

export const IdParamSchema = z.coerce.number().int().positive();
