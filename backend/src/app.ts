import express from "express";
import userRouter from "./features/users/users.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import cors from "cors";
import { rateLimit } from "./shared/middleware/rateLimit.js";
import authRouter from "./features/auth/auth.routes.js";

const app = express();

app.use(express.json());
app.use(cors());
app.set("trust proxy", true);

app.use(
  rateLimit({
    feature: "api",
    maxRequests: 300,
    resetWindowSeconds: 60,
    keyGenerator: (request) => request.ip ?? "unknown",
  }),
);

app.use("/users", userRouter);
app.use("/auth", authRouter);

app.use(errorHandler);

export default app;
