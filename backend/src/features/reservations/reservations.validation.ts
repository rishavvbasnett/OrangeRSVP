import z from "zod";

export const ReservationInputSchema = z.object({
  name: z.string(),
  partySize: z.number(),
  reservationTime: z.iso.datetime(),
  status: z.enum(["confirmed", "unconfirmed"]).default("unconfirmed"),
  specialRequest: z.string().optional(),
  specialOccasion: z.string().optional(),
});
