import { MONGODB_URI } from "./env.js";
import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(MONGODB_URI);
};
