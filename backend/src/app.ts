import express from "express";
import userRouter from "./features/users/users.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";
import authRouter from "./features/auth/auth.routes.js";
import cors from "cors";
import restaurantRouter from "./features/restaurants/restaurants.routes.js";
import reservationRouter from "./features/reservations/reservations.routes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/users", userRouter);
app.use("/login", authRouter);
app.use("/restaurants", restaurantRouter);
app.use("/reservations", reservationRouter);

app.use(errorHandler);

export default app;
