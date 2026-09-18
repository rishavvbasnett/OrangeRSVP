import { model, Schema } from "mongoose";
import type { TableDocument } from "./tables.types.js";

const TableSchema = new Schema<TableDocument>({
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: [true, "restaurnatId is required"],
  },
  tableName: {
    type: String,
    required: [true, "Table name is required"],
  },
  seats: {
    type: Number,
    required: [true, "Seats are required"],
  },
  maximumCapacity: {
    type: Number,
    required: [true, "Maximum capacity is required"],
  },
  status: {
    type: String,
    enum: ["available", "reserved", "occupied", "unavailable"],
    default: "available",
  },
  overload: {
    type: Boolean,
    default: false,
  },
});

const Table = model<TableDocument>("Table", TableSchema);

export default Table;
