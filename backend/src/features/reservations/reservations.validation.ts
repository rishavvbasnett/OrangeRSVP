import z from "zod";

export const ReservationInputSchema = z.object({
  name: z.string(),
  partySize: z.number(),
  reservationTime: z.iso.datetime(),
  phone: z
    .string()
    .regex(
      /^(?:\+1[-. ]?)?(?:\(\d{3}\)|\d{3})[-. ]?\d{3}[-. ]?\d{4}$/,
      "Invalid US phone number",
    ),
  email: z.email("Invalid email format"),
  status: z
    .enum(["confirmed", "unconfirmed", "seated", "arrived", "cancelled"])
    .default("unconfirmed"),
  specialRequest: z.string().optional(),
  specialOccasion: z.string().optional(),
});
