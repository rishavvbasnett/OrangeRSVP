import type { ReservationInput } from "../../features/reservations/reservations.types.js";
import type { RestaurantInput } from "../../features/restaurants/restaurants.types.js";
import mongoose from "mongoose";

export const createRestaurantPayload = (
  overrides: Partial<RestaurantInput> = {},
): RestaurantInput => {
  return {
    name: "Prime",
    address: "Steinway street",
    isActive: true,
    businessHours: [
      {
        day: "monday",
        closed: false,
        opensAt: "09:00",
        closesAt: "22:00",
      },
      {
        day: "tuesday",
        closed: false,
        opensAt: "09:00",
        closesAt: "22:00",
      },
      {
        day: "sunday",
        closed: true,
      },
    ],
    ...overrides,
  };
};

export const createReservationPayload = (
  overrides: Partial<ReservationInput> = {},
) => {
  return {
    name: "reservation1",
    partySize: 1,
    reservationTime: "2026-09-10T19:00:00.000Z",
    phone: "415-555-2671",
    email: "jordan.lee@example.com",
    status: "unconfirmed",
    userId: new mongoose.Types.ObjectId().toString(),
    restaurantId: new mongoose.Types.ObjectId().toString(),
    ...overrides,
  };
};
