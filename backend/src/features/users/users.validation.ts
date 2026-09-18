import z from "zod";

export const UserInputSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["manager", "customer", "admin", "kitchen"]),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  role: z.enum(["manager", "customer", "admin", "kitchen"]),
});
