import { Schema, model } from "mongoose";
import type { UserDocument } from "./users.types.js";

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "manager", "kitchen", "admin"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = model<UserDocument>("User", UserSchema);

export default User;
