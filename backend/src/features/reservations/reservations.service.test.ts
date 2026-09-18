import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import Reservation from "./reservations.model.js";
import * as reservationService from "./reservations.service.js";
import type { ReservationInput } from "./reservations.types.js";
import mongoServer from "../../shared/test/mongoServer.setup.js";
import { ItemNotFoundError } from "../../shared/utils/errors.js";

const createReservationPayload = (
  overrides: Partial<ReservationInput> = {},
): ReservationInput => ({
  name: "reservation1",
  partySize: 2,
  reservationTime: "2026-09-10T19:00:00.000Z",
  phone: "415-555-2671",
  email: "jordan.lee@example.com",
  status: "unconfirmed",
  ...overrides,
});

let reservation1;
let reservation2;

beforeAll(async () => {
  await mongoServer.connect();
});

afterAll(async () => {
  await mongoServer.disconnect();
});

beforeEach(async () => {
  await Reservation.deleteMany({});

  reservation1 = await Reservation.create(
    createReservationPayload({
      name: "reservation1",
      partySize: 1,
    }),
  );
  reservation2 = await Reservation.create(
    createReservationPayload({
      name: "reservation2",
      partySize: 2,
    }),
  );
});

describe("createOne", () => {
  it("creates & persists Reservation with VALID INPUT", async () => {
    const validReservationInput = createReservationPayload({
      specialOccasion: "birthday",
      specialRequest: "booth table",
    });
    const createdReservation = await reservationService.createOne(
      validReservationInput,
    );

    expect(createdReservation).toMatchObject({
      name: validReservationInput.name,
      partySize: validReservationInput.partySize,
      reservationTime: validReservationInput.reservationTime,
      phone: validReservationInput.phone,
      email: validReservationInput.email,
      status: "unconfirmed",
      specialOccasion: "birthday",
      specialRequest: "booth table",
    });
    expect(await Reservation.findById(createdReservation.id)).toMatchObject({
      name: validReservationInput.name,
      partySize: validReservationInput.partySize,
      reservationTime: validReservationInput.reservationTime,
      phone: validReservationInput.phone,
      email: validReservationInput.email,
      status: "unconfirmed",
      specialOccasion: "birthday",
      specialRequest: "booth table",
    });
  });
});

describe("getAll", () => {
  it("gets all the reservations on the db", async () => {
    const allReservations = await reservationService.getAll();

    expect(allReservations).toHaveLength(2);
    expect(allReservations).toMatchObject([
      {
        name: reservation1.name,
        partySize: reservation1.partySize,
        phone: reservation1.phone,
        email: reservation1.email,
        status: reservation1.status,
      },
      {
        name: reservation2.name,
        partySize: reservation2.partySize,
        phone: reservation2.phone,
        email: reservation2.email,
        status: reservation2.status,
      },
    ]);
  });
  it("gets an empty array when no reservations in the db", async () => {
    await Reservation.deleteMany({});
    const allReservations = await reservationService.getAll();

    expect(allReservations).toEqual([]);
    expect(allReservations).toHaveLength(0);
  });
});

describe("getOne", () => {
  it("gets a reservation with Valid ID", async () => {
    const foundReservation = await reservationService.getOne(reservation1.id);

    expect(foundReservation).toMatchObject({
      name: reservation1.name,
      partySize: reservation1.partySize,
      phone: reservation1.phone,
      email: reservation1.email,
      status: reservation1.status,
    });
  });

  it("returns null when reservation doesn't exist in the db", async () => {
    await Reservation.findByIdAndDelete(reservation1.id);
    await expect(reservationService.getOne(reservation1.id)).rejects.toThrow(
      ItemNotFoundError,
    );
  });
});

describe("deleteOne", () => {
  it("deletes a reservation with Valid ID", async () => {
    const deletedReservation = await reservationService.deleteOne(
      reservation1.id,
    );

    expect(deletedReservation).toMatchObject({
      name: reservation1.name,
      partySize: reservation1.partySize,
      phone: reservation1.phone,
      email: reservation1.email,
      status: reservation1.status,
    });
    await expect(reservationService.getOne(reservation1.id)).rejects.toThrow(
      ItemNotFoundError,
    );
  });

  it("throws ItemNotFoundError when reservation doesn't exists", async () => {
    await Reservation.findByIdAndDelete(reservation1.id);
    await expect(reservationService.getOne(reservation1.id)).rejects.toThrow(
      ItemNotFoundError,
    );
  });
});

describe("updateOne", () => {
  it("updates a reservation with Valid ID", async () => {
    const updatedReservation = await reservationService.updateOne(
      reservation1.id,
      {
        name: "reservation3",
        partySize: 3,
        status: "seated",
      },
    );

    expect(updatedReservation).toMatchObject({
      name: "reservation3",
      partySize: 3,
      status: "seated",
      phone: reservation1.phone,
      email: reservation1.email,
    });
    expect(await Reservation.findById(reservation1.id)).toMatchObject({
      name: "reservation3",
      partySize: 3,
      status: "seated",
      phone: reservation1.phone,
      email: reservation1.email,
    });
  });

  it("throws ItemNotFoundError when reservation doesn't exist", async () => {
    await Reservation.findByIdAndDelete(reservation1.id);
    await expect(
      reservationService.updateOne(reservation1.id, {
        name: "reservation3",
        status: "seated",
      }),
    ).rejects.toThrow(ItemNotFoundError);
  });
});
