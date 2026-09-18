import { TableInputSchema } from "./tables.validation.js";
import z from "zod";
import { Document, Types } from "mongoose";

export type tableStatus = "available" | "reserved" | "occupied" | "unavailable";

export type TableInput = z.infer<typeof TableInputSchema>;

export interface TableDocument extends Document {
  restaurantId: Types.ObjectId;
  tableName: string;
  seats: number;
  maximumCapacity: number;
  status: tableStatus;
  overload: boolean;
}
