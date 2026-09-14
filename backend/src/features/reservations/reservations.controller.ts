import asyncHandler from "../../shared/middleware/asyncHandler.js";
import { IdParamSchema } from "../../shared/shared.validation.js";
import reservationService from "./reservations.service.js";
import type {
  ReservationDocument,
  ReservationInput,
} from "./reservations.types.js";
import { ReservationInputSchema } from "./reservations.validation.js";
import { Request, Response, NextFunction } from "express";

const createOne = asyncHandler(
  async (request: Request, response: Response, next: NextFunction) => {
    const validReservation = ReservationInputSchema.parse(request.body);
    const createdReservation = await reservationService.createOne({
      ...validReservation,
      userId: request.user.id,
    });
    return response.status(201).json(createdReservation);
  },
);

const getAll = asyncHandler(
  async (request: Request, response: Response, next: NextFunction) => {
    const allReservations = await reservationService.getAll();
    return response.json(allReservations);
  },
);

const getOne = asyncHandler(
  async (request: Request, response: Response, next: NextFunction) => {
    const reservationId = IdParamSchema.parse(request.params.id);
    const foundReservation = await reservationService.getOne(reservationId);
    return response.json(foundReservation);
  },
);

const updateOne = asyncHandler(
  async (request: Request, response: Response, next: NextFunction) => {
    const reservationId = IdParamSchema.parse(request.params.id);
    const updateFilter = ReservationInputSchema.partial().parse(request.body);
    const updatedReservation = await reservationService.updateOne(
      reservationId,
      updateFilter,
    );
    return response.json(updatedReservation);
  },
);

const deleteOne = asyncHandler(
  async (request: Request, response: Response, next: NextFunction) => {
    const reservationId = IdParamSchema.parse(request.params.id);
    const deletedReservation =
      await reservationService.deleteOne(reservationId);
    return response.json(deletedReservation);
  },
);

const reservationController = {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
};

export default reservationController;
