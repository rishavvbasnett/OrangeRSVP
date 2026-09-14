import authenticate from "../../shared/middleware/authenticate.js";
import requireRole from "../../shared/middleware/requireRole.js";
import reservationController from "./reservations.controller.js";
import express from "express";
const reservationRouter = express.Router();

reservationRouter.post(
  "/",
  authenticate,
  requireRole("admin", "customer", "manager"),
  reservationController.createOne,
);

reservationRouter.get(
  "/",
  authenticate,
  requireRole("admin", "customer", "manager"),
  reservationController.getAll,
);

reservationRouter.get(
  "/:id",
  authenticate,
  requireRole("admin", "customer", "manager"),
  reservationController.getOne,
);

reservationRouter.delete(
  "/:id",
  authenticate,
  requireRole("admin", "customer", "manager"),
  reservationController.deleteOne,
);

reservationRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin", "customer", "manager"),
  reservationController.updateOne,
);

export default reservationRouter;
