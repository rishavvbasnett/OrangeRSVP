import z from "zod";

export const UserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  phone: z.e164().optional(),
  password: z.string().min(1),
});

export const ProfileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    phone: z.e164().optional(),
  })
  .refine(
    (data) => {
      const hasAtLeastOneField =
        data.name !== undefined || data.phone !== undefined;
      return hasAtLeastOneField;
    },
    { error: "Provide at least one field to update" },
  );
