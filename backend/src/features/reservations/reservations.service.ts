import { IdParam } from "../../shared/shared.types.js";
import { ItemNotFoundError } from "../../shared/utils/errors.js";
import { ensureRestaurantExists } from "../../shared/utils/helpers.js";
import Reservation from "./reservations.model.js";
import type {
  ReservationDocument,
  ReservationDto,
  ReservationInput,
} from "./reservations.types.js";

const createOne = async (
  validReservation: ReservationInput,
): Promise<ReservationDto> => {
  await ensureRestaurantExists(validReservation.restaurantId);
  const createdReservation = await Reservation.create(validReservation);
  return toReservationDto(createdReservation);
};

const getAll = async (): Promise<ReservationDto[]> => {
  const allReservations = await Reservation.find({})
    .sort({ name: 1, _id: 1 })
    .lean();
  return allReservations.map((reservation) => toReservationDto(reservation));
};

const getOne = async (reservationId: IdParam): Promise<ReservationDto> => {
  const foundReservation = await Reservation.findById(reservationId).lean();
  if (!foundReservation) throw new ItemNotFoundError("Reservation not found");
  return toReservationDto(foundReservation);
};

const deleteOne = async (reservationId: IdParam): Promise<ReservationDto> => {
  const deletedReservation = await Reservation.findByIdAndDelete(reservationId);
  if (!deletedReservation) throw new ItemNotFoundError("Reservation not found");
  return toReservationDto(deletedReservation);
};

const updateOne = async (
  reservationId: IdParam,
  newReservation: Partial<ReservationInput>,
): Promise<ReservationDto> => {
  if (newReservation.restaurantId)
    await ensureRestaurantExists(newReservation.restaurantId);
  const updatedReservation = await Reservation.findByIdAndUpdate(
    reservationId,
    newReservation,
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
  if (!updatedReservation) throw new ItemNotFoundError("Reservation not found");
  return toReservationDto(updatedReservation);
};

const toReservationDto = (
  reservationDocument: ReservationDocument,
): ReservationDto => {
  return {
    id: reservationDocument._id.toString(),
    name: reservationDocument.name,
    partySize: reservationDocument.partySize,
    reservationTime: reservationDocument.reservationTime,
    phone: reservationDocument.phone,
    email: reservationDocument.email,
    status: reservationDocument.status,
    specialRequest: reservationDocument.specialRequest,
    specialOccasion: reservationDocument.specialOccasion,
    userId: reservationDocument.userId.toString(),
    restaurantId: reservationDocument.restaurantId.toString(),
  };
};

const reservationService = {
  createOne,
  getOne,
  deleteOne,
  updateOne,
  getAll,
};

export default reservationService;
