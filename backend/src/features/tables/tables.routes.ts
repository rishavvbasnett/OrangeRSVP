import express from "express";
import authenticate from "../../shared/middleware/authenticate.js";
import requireRole from "../../shared/middleware/requireRole.js";
import * as tableController from "./tables.controller.js";

const tablesRouter = express.Router();

tablesRouter.get(
  "/",
  authenticate,
  requireRole("manager", "customer", "admin"),
  tableController.getAllForRestaurant,
);
tablesRouter.get(
  "/:id",
  authenticate,
  requireRole("manager", "customer", "admin"),
  tableController.getOne,
);
tablesRouter.post(
  "/",
  authenticate,
  requireRole("manager", "admin"),
  tableController.createOne,
);
tablesRouter.patch(
  "/:id",
  authenticate,
  requireRole("manager", "admin"),
  tableController.updateOne,
);
tablesRouter.delete(
  "/:id",
  authenticate,
  requireRole("manager", "admin"),
  tableController.deleteOne,
);
tablesRouter.patch(
  "/:id/overload",
  authenticate,
  requireRole("manager", "admin"),
  tableController.setOverload,
);
tablesRouter.patch(
  "/:id/overload/clear",
  authenticate,
  requireRole("manager", "admin"),
  tableController.clearOverload,
);

export default tablesRouter;