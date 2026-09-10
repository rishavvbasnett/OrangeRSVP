import z from "zod";
import type { Document } from "mongoose";
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
}
