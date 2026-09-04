import express from "express";
import authenticate from "../../shared/middleware/authenticate.js";
import requireRole from "../../shared/middleware/requireRole.js";
import * as restaurantController from "./restaurants.controller.js";

const restaurantRouter = express.Router();

restaurantRouter.post(
  "/",
  authenticate,
  requireRole("admin"),
  restaurantController.createOne,
);

restaurantRouter.get(
  "/:id",
  authenticate,
  requireRole("manager", "customer", "admin"),
  restaurantController.getOne,
);

restaurantRouter.get(
  "/",
  authenticate,
  requireRole("manager", "customer", "admin"),
  restaurantController.getAll,
);

restaurantRouter.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  restaurantController.deleteOne,
);

export default restaurantRouter;
