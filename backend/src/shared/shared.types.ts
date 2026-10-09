import z from "zod";
import { IdParamSchema } from "./shared.validation.js";

export type IdParam = z.infer<typeof IdParamSchema>;
