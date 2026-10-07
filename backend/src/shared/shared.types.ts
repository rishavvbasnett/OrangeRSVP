import z from "zod";
import type { IdParamSchema } from "./shared.validation.js";

export type IdParam = z.infer<typeof IdParamSchema>;
