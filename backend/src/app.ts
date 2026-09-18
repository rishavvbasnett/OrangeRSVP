import express from "express";
import userRouter from "./features/users/users.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import authRouter from "./features/auth/auth.routes.js";
import cors from "cors";
import restaurantRouter from "./features/restaurants/restaurants.routes.js";
import reservationRouter from "./features/reservations/reservations.routes.js";
import tablesRouter from "./features/tables/tables.routes.js";
import { rateLimit } from "./shared/middleware/rateLimit.js";

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
app.use("/login", authRouter);
app.use("/restaurants", restaurantRouter);
app.use("/reservations", reservationRouter);
app.use("/tables", tablesRouter);

app.use(errorHandler);

export default app;
