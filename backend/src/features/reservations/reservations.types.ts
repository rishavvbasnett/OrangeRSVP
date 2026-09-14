import z from "zod";
import type { Document, Types } from "mongoose";
import { ReservationInputSchema } from "./reservations.validation.js";

export type ReservationInput = z.infer<typeof ReservationInputSchema>;
export type ReservationStatus =
  | "confirmed"
  | "unconfirmed"
  | "seated"
  | "arrived"
  | "cancelled";

export interface ReservationDocument extends Document {
  name: string;
  partySize: number;
  reservationTime: string;
  phone: string;
  email: string;
  status: ReservationStatus;
  specialRequest?: string;
  specialOccasion?: string;
  userId: Types.ObjectId;
  restaurantId: Types.ObjectId;
}

export type ReservationDto = {
  id: string;
  name: string;
  partySize: number;
  reservationTime: string;
  phone: string;
  email: string;
  status: ReservationStatus;
  specialRequest?: string;
  specialOccasion?: string;
  userId: string;
  restaurantId: string;
};
