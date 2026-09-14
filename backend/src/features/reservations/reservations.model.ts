import { model, Schema } from "mongoose";
import type { ReservationDocument } from "./reservations.types.js";

const ReservationSchema = new Schema<ReservationDocument>({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  partySize: {
    type: Number,
    required: [true, "Party size is required"],
  },
  reservationTime: {
    type: String,
    required: [true, "Reservation time is required"],
  },
  phone: {
    type: String,
    required: [true, "Phone is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
  },
  status: {
    type: String,
    enum: ["confirmed", "unconfirmed", "seated", "arrived", "cancelled"],
    default: "unconfirmed",
  },
  specialRequest: {
    type: String,
  },
  specialOccasion: {
    type: String,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  restaurantId: {
    type: Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
});

const Reservation = model<ReservationDocument>(
  "Reservation",
  ReservationSchema,
);

export default Reservation;
