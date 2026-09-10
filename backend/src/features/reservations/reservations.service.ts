import { IdParam } from "../../shared/shared.types.js";
import { ItemNotFoundError } from "../../shared/utils/errors.js";
import Reservation from "./reservations.model.js";
import type {
  ReservationDocument,
  ReservationInput,
} from "./reservations.types.js";

export const createOne = async (
  validReservation: ReservationInput,
): Promise<ReservationDocument> => {
  return await Reservation.create(validReservation);
};

export const getAll = async (): Promise<ReservationDocument[]> => {
  return await Reservation.find({}).sort({ name: 1, _id: 1 }).lean();
};

export const getOne = async (
  reservationId: IdParam,
): Promise<ReservationDocument> => {
  const foundReservation = await Reservation.findById(reservationId).lean();
  if (!foundReservation) throw new ItemNotFoundError("Reservation not found");
  return foundReservation;
};

export const deleteOne = async (
  reservationId: IdParam,
): Promise<ReservationDocument | null> => {
  return await Reservation.findByIdAndDelete(reservationId);
};

export const updateOne = async (
  reservationId: IdParam,
  newReservation: ReservationInput,
): Promise<ReservationDocument> => {
  const updatedReservation = await Reservation.findByIdAndUpdate(
    reservationId,
    newReservation,
    {
      new: true,
      runValidators: true,
    },
  );
  if (!updatedReservation) throw new ItemNotFoundError("Reservation not found");
  return updatedReservation;
};
