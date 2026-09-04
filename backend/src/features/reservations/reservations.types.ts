import z from "zod";
import { ReservationInputSchema } from "./reservations.validation.js";

export type status = "unconfirmed" | "confirmed";
export type ReservationInput = z.infer<typeof ReservationInputSchema>;
