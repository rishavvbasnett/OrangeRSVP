import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import * as helpers from "../../shared/utils/helpers.js";
import request from "supertest";
import app from "../../app.js";
import type {
  ReservationDocument,
  ReservationInput,
} from "./reservations.types.js";
import Reservation from "./reservations.model.js";
import mongoServer from "../../shared/utils/mongoServer.setup.js";
import { RestaurantDocument } from "../restaurants/restaurants.types.js";
import {
  createReservationPayload,
  createRestaurantPayload,
} from "../../shared/test/createPayload.js";
import Restaurant from "../restaurants/restaurants.model.js";
import { JWT_SECRET } from "../../shared/config/env.js";
import mongoose from "mongoose";

let managerToken: string;
let customerToken: string;
let adminToken: string;

let restaurant1: RestaurantDocument;
let restaurant2: RestaurantDocument;

beforeAll(async () => {
  await mongoServer.connect();
  managerToken = await helpers.createToken("manager");
  customerToken = await helpers.createToken("customer");
  adminToken = await helpers.createToken("admin");
});

afterAll(async () => {
  await mongoServer.disconnect();
});

beforeEach(async () => {
  await Reservation.deleteMany({});
  await Restaurant.deleteMany({});

  restaurant1 = await Restaurant.create(
    createRestaurantPayload({
      name: "restaurant1",
    }),
  );
  restaurant2 = await Restaurant.create(
    createRestaurantPayload({
      name: "restaurant2",
    }),
  );
});

describe("POST /reservations", () => {
  describe("HAPPY PATH with VALID PAYLOAD & ROLE", () => {
    it.each([
      {
        label: "Role: Customer",
        getToken: () => customerToken,
      },
      {
        label: "Role: Manager",
        getToken: () => managerToken,
      },
      {
        label: "Role: Admin",
        getToken: () => adminToken,
      },
    ])("creates & persists a reservation with $label", async ({ getToken }) => {
      const token = getToken();
      const payload = createReservationPayload({
        name: "reservation1",
        restaurantId: restaurant1._id.toString(),
      });
      const response = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: "reservation1",
        restaurantId: restaurant1._id.toString(),
        partySize: 1,
        reservationTime: payload.reservationTime,
        phone: payload.phone,
        email: payload.email,
        status: "unconfirmed",
      });
      expect(
        await Reservation.findOne({
          name: "reservation1",
          reservationTime: payload.reservationTime,
        }),
      ).toMatchObject({
        name: "reservation1",
        restaurantId: restaurant1._id,
        partySize: 1,
        reservationTime: payload.reservationTime,
        phone: payload.phone,
        email: payload.email,
        status: "unconfirmed",
      });
    });

    describe("VALIDATION Failures", () => {
      it.each([
        {
          label: "name undefined",
          payload: createReservationPayload({
            name: undefined,
          }),
        },
        {
          label: "restaurantId undefined",
          payload: createReservationPayload({
            restaurantId: undefined,
          }),
        },
        {
          label: "restaurantId malformatted",
          payload: createReservationPayload({
            restaurantId: "malformatted",
          }),
        },
        {
          label: "partySize undefined",
          payload: createReservationPayload({
            partySize: undefined,
          }),
        },
        {
          label: "partySize string",
          payload: createReservationPayload({
            partySize: "string",
          }),
        },
        {
          label: "phone undefined",
          payload: createReservationPayload({
            phone: undefined,
          }),
        },
        {
          label: "phone malformatted: missing area code",
          payload: createReservationPayload({
            phone: "555-2671",
          }),
        },
        {
          label: "phone malformatted: too short",
          payload: createReservationPayload({
            phone: "41555",
          }),
        },
        {
          label: "phone malformatted: contains letters",
          payload: createReservationPayload({
            phone: "415-ABC-2671",
          }),
        },
        {
          label: "phone malformatted: invalid separator",
          payload: createReservationPayload({
            phone: "415_555_2671",
          }),
        },
        {
          label: "phone malformatted: too many digits",
          payload: createReservationPayload({
            phone: "415-555-26711",
          }),
        },
        {
          label: "phone malformatted: empty string",
          payload: createReservationPayload({
            phone: "",
          }),
        },
        {
          label: "status: wrong enum value",
          payload: createReservationPayload({
            status: "not-a-valid-status",
          }),
        },
        {
          label: "reservationTime: malformatted string",
          payload: createReservationPayload({
            reservationTime: "not-a-datetime",
          }),
        },
        {
          label: "reservationTime: undefined",
          payload: createReservationPayload({
            reservationTime: undefined,
          }),
        },
      ])(
        "returns status 400 with invalid payload with $label",
        async ({ payload }) => {
          const response = await request(app)
            .post("/reservations")
            .set("Authorization", `Bearer ${customerToken}`)
            .send(payload);

          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty("error");
          expect(await Reservation.find({})).toHaveLength(0);
        },
      );
    });
    describe("AUTH/TOKEN Failures", () => {
      it.each([
        {
          label: "No token",
          getToken: () => undefined,
        },
        {
          label: "Malformatted token",
          getToken: () => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",
        },
        {
          label: "Tampered JWT SECRET",
          getToken: () =>
            jwt.sign(
              {
                id: new mongoose.Types.ObjectId().toString(),
                role: "admin",
              },
              "TamperedJwtSecret",
            ),
        },
      ])("return 401 with $label", async ({ getToken }) => {
        const token = getToken();
        const response = await request(app)
          .post("/reservations")
          .set("Authorization", `Bearer ${token}`)
          .send(createReservationPayload());

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("error");
        expect(await Reservation.find({})).toHaveLength(0);
      });

      it("return 403 with Role: Kitchen", async () => {
        const token = jwt.sign(
          {
            id: new mongoose.Types.ObjectId().toString(),
            role: "kitchen",
          },
          JWT_SECRET,
        );
        const response = await request(app)
          .post("/reservations")
          .set("Authorization", `Bearer ${token}`)
          .send(createReservationPayload());

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty("error");
        expect(await Reservation.find({})).toHaveLength(0);
      });
    });
  });
});

describe('GET "/reservations/:id"', () => {
  describe("HAPPY PATH with Valid Token & Valid Payload", () => {
    it.each([
      {
        label: "Role: Admin",
        getToken: () => adminToken,
      },
      {
        label: "Role: Manager",
        getToken: () => managerToken,
      },
      {
        label: "Role: Customer",
        getToken: () => customerToken,
      },
    ])("gets a reservation with $label", async ({ getToken }) => {
      const reservationPayload1 = createReservationPayload({
        name: "reservation1",
        partySize: 1,
        restaurantId: restaurant1._id.toString(),
      });
      const savedReservation1 = await Reservation.create({
        ...reservationPayload1,
        userId: new mongoose.Types.ObjectId(),
      });
      const token = getToken();
      const response = await request(app)
        .get(`/reservations/${savedReservation1._id.toString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(savedReservation1._id.toString()).toBe(response.body.id);
      expect(savedReservation1.name).toBe(response.body.name);
      expect(savedReservation1.email).toBe(response.body.email);
      expect(savedReservation1.reservationTime).toBe(
        response.body.reservationTime,
      );
      expect(savedReservation1.userId.toString()).toBe(response.body.userId);
      expect(savedReservation1.restaurantId.toString()).toBe(
        response.body.restaurantId,
      );
      expect(savedReservation1.partySize).toBe(response.body.partySize);
      expect(savedReservation1.phone).toBe(response.body.phone);
    });
  });

  describe("Validation Failures", () => {
    it.each([
      {
        label: "Malformatted Id",
        reservationId: "malformattedId",
      },
      {
        label: "No Id",
        reservationId: undefined,
      },
    ])("returns 400 with $label", async ({ reservationId }) => {
      const token = customerToken;
      const response = await request(app)
        .get(`/reservations/${reservationId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("returns 404 when the reservation does not exist", async () => {
      const token = customerToken;
      const response = await request(app)
        .get(`/reservations/${new mongoose.Types.ObjectId().toString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("AUTH/TOKEN Failures", () => {
    it.each([
      {
        label: "No token",
        getToken: () => undefined,
      },
      {
        label: "Malformatted Token",
        getToken: () => "malformattedToken",
      },
      {
        label: "Tampered JWT SECRET",
        getToken: () =>
          jwt.sign(
            {
              id: new mongoose.Types.ObjectId().toString(),
              role: "admin",
            },
            "TamperedJwtSecret",
          ),
      },
    ])("returns 401 with $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .get(`/reservations/${new mongoose.Types.ObjectId().toString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("returns 403 with Role: Kitchen", async () => {
      const token = jwt.sign(
        {
          id: new mongoose.Types.ObjectId().toString(),
          role: "kitchen",
        },
        JWT_SECRET,
      );
      const response = await request(app)
        .get(`/reservations/${new mongoose.Types.ObjectId().toString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
  });
});

describe("GET /reservations", () => {
  let reservationPayload1: ReservationInput & { userId: string };
  let reservationPayload2: ReservationInput & { userId: string };
  let reservationPayload3: ReservationInput & { userId: string };

  beforeEach(async () => {
    await Reservation.deleteMany({});
    reservationPayload1 = {
      ...createReservationPayload({
        name: "reservation1",
        restaurantId: new mongoose.Types.ObjectId().toString(),
      }),
      userId: new mongoose.Types.ObjectId().toString(),
    };
    reservationPayload2 = {
      ...createReservationPayload({
        name: "reservation2",
        restaurantId: new mongoose.Types.ObjectId().toString(),
      }),
      userId: new mongoose.Types.ObjectId().toString(),
    };
    reservationPayload3 = {
      ...createReservationPayload({
        name: "reservation3",
        restaurantId: new mongoose.Types.ObjectId().toString(),
      }),
      userId: new mongoose.Types.ObjectId().toString(),
    };

    await Reservation.create(reservationPayload1);
    await Reservation.create(reservationPayload2);
    await Reservation.create(reservationPayload3);
  });

  describe("HAPPY PATH with VALID TOKEN & VALID PAYLOAD", () => {
    it.each([
      {
        label: "Role: Admin",
        getToken: () => adminToken,
      },
      {
        label: "Role: Manager",
        getToken: () => managerToken,
      },
      {
        label: "Role: Customer",
        getToken: () => customerToken,
      },
    ])("gets all reservations with $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .get("/reservations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject([
        reservationPayload1,
        reservationPayload2,
        reservationPayload3,
      ]);
    });

    it("returns an Empty Array when No reservations in the DB", async () => {
      await Reservation.deleteMany({});
      const response = await request(app)
        .get("/reservations")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
      expect(response.body).toEqual([]);
    });
  });

  describe("AUTH/TOKEN Failures", () => {
    it.each([
      { label: "No Token", getToken: () => undefined },
      {
        label: "Malformatted Token",
        getToken: () => "Malformatted Token",
      },
      {
        label: "Invalid Token",
        getToken: () =>
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAxIiwicm9sZSI6ImFkbWluIn0.aW52YWxpZFNpZ25hdHVyZQ",
      },
      {
        label: "Tampared JWT SECRET",
        getToken: () =>
          jwt.sign(
            {
              id: new mongoose.Types.ObjectId().toString(),
              role: "admin",
            },
            "Tampered JWT SECRET",
          ),
      },
    ])("returns status 401 with $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .get("/reservations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
    });

    it("returns 403 with Role: Kitchen", async () => {
      const token = jwt.sign(
        {
          id: new mongoose.Types.ObjectId().toString(),
          role: "kitchen",
        },
        JWT_SECRET,
      );
      const response = await request(app)
        .get("/reservations")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});

describe("PATCH /reservations", () => {
  describe("HAPPY PATH with VALID TOKEN & VALID PAYLOAD", () => {
    it.each([
      {
        label: "Role: Admin",
        getToken: () => adminToken,
      },
      {
        label: "Role: Manager",
        getToken: () => managerToken,
      },
      {
        label: "Role: Customer",
        getToken: () => customerToken,
      },
    ])("updates a reservation with $label", async ({ getToken }) => {
      const reservationPayload1 = {
        ...createReservationPayload({
          name: "reservation1",
          partySize: 1,
          restaurantId: restaurant1._id.toString(),
        }),
        userId: new mongoose.Types.ObjectId().toString(),
      };
      const savedReservation1 = await Reservation.create(reservationPayload1);
      const token = getToken();
      const response = await request(app)
        .patch(`/reservations/${savedReservation1._id.toString()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "reservation2",
          partySize: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: savedReservation1._id.toString(),
        name: "reservation2",
        partySize: 2,
        reservationTime: reservationPayload1.reservationTime,
        phone: reservationPayload1.phone,
        email: reservationPayload1.email,
        status: reservationPayload1.status,
        userId: savedReservation1.userId.toString(),
        restaurantId: savedReservation1.restaurantId.toString(),
      });

      const persistedReservation = await Reservation.findById(
        savedReservation1._id,
      );
      expect(persistedReservation).toMatchObject({
        _id: savedReservation1._id,
        name: "reservation2",
        partySize: 2,
        reservationTime: reservationPayload1.reservationTime,
        phone: reservationPayload1.phone,
        email: reservationPayload1.email,
        status: reservationPayload1.status,
        userId: savedReservation1.userId,
        restaurantId: savedReservation1.restaurantId,
      });
    });
  });

  describe("VALIDATION Failures", () => {
    it.each([
      {
        label: "name invalid type",
        updateFilter: { name: 123 },
      },
      {
        label: "partySize invalid type",
        updateFilter: { partySize: "2" },
      },
      {
        label: "reservationTime malformed",
        updateFilter: { reservationTime: "not-a-datetime" },
      },
      {
        label: "phone malformed",
        updateFilter: { phone: "not-a-phone-number" },
      },
      {
        label: "email malformed",
        updateFilter: { email: "not-an-email" },
      },
      {
        label: "status invalid enum value",
        updateFilter: { status: "invalid-status" },
      },
      {
        label: "specialRequest invalid type",
        updateFilter: { specialRequest: 123 },
      },
      {
        label: "specialOccasion invalid type",
        updateFilter: { specialOccasion: 123 },
      },
      {
        label: "restaurantId malformed",
        updateFilter: { restaurantId: "malformattedId" },
      },
    ])("returns 400 with $label", async ({ updateFilter }) => {
      const reservation = await Reservation.create({
        ...createReservationPayload({
          name: "reservation1",
          partySize: 1,
          restaurantId: restaurant1._id.toString(),
        }),
        userId: new mongoose.Types.ObjectId(),
      });
      const response = await request(app)
        .patch(`/reservations/${reservation._id.toString()}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send(updateFilter);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it.each([
      {
        label: "malformatted ID",
        reservationId: "malformattedId",
      },
      {
        label: "missing ID",
        reservationId: undefined,
      },
    ])("returns 400 with $label", async ({ reservationId }) => {
      const response = await request(app)
        .patch(`/reservations/${reservationId}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ name: "reservation2" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("returns 404 when the reservation does not exist", async () => {
      const response = await request(app)
        .patch(`/reservations/${new mongoose.Types.ObjectId().toString()}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ name: "reservation2" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("AUTH/TOKEN Failures", () => {
    it.each([
      {
        label: "No token",
        getToken: () => undefined,
      },
      {
        label: "Malformatted token",
        getToken: () => "malformattedToken",
      },
      {
        label: "Tampered JWT SECRET",
        getToken: () =>
          jwt.sign(
            {
              id: new mongoose.Types.ObjectId().toString(),
              role: "admin",
            },
            "TamperedJwtSecret",
          ),
      },
    ])("returns 401 with $label", async ({ getToken }) => {
      const reservation = await Reservation.create({
        ...createReservationPayload({
          name: "reservation1",
          restaurantId: restaurant1._id.toString(),
        }),
        userId: new mongoose.Types.ObjectId(),
      });
      const token = getToken();
      const response = await request(app)
        .patch(`/reservations/${reservation._id.toString()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "reservation2" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("returns 403 with Role: Kitchen", async () => {
      const reservation = await Reservation.create({
        ...createReservationPayload({
          name: "reservation1",
          restaurantId: restaurant1._id.toString(),
        }),
        userId: new mongoose.Types.ObjectId(),
      });
      const token = jwt.sign(
        {
          id: new mongoose.Types.ObjectId().toString(),
          role: "kitchen",
        },
        JWT_SECRET,
      );
      const response = await request(app)
        .patch(`/reservations/${reservation._id.toString()}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "reservation2" });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
  });
});

describe("DELETE /reservations/:id", () => {
  describe("HAPPY PATH with VALID TOKEN & VALID PAYLOAD", () => {
    it.each([
      { label: "Role: Admin", getToken: () => adminToken },
      { label: "Role: Manager", getToken: () => managerToken },
      { label: "Role: Customer", getToken: () => customerToken },
    ])("deletes a reservation with $label", async ({ getToken }) => {
      const reservation = await Reservation.create({
        ...createReservationPayload({
          name: "reservation1",
          partySize: 1,
          restaurantId: restaurant1._id.toString(),
        }),
        userId: new mongoose.Types.ObjectId(),
      });
      const response = await request(app)
        .delete(`/reservations/${reservation._id.toString()}`)
        .set("Authorization", `Bearer ${getToken()}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: reservation._id.toString(),
        name: reservation.name,
        partySize: reservation.partySize,
        reservationTime: reservation.reservationTime,
        phone: reservation.phone,
        email: reservation.email,
        status: reservation.status,
        userId: reservation.userId.toString(),
        restaurantId: reservation.restaurantId.toString(),
      });
      expect(await Reservation.findById(reservation._id)).toBeNull();
    });
  });

  describe("VALIDATION Failures", () => {
    it.each([
      { label: "malformatted ID", reservationId: "malformattedId" },
      { label: "missing ID", reservationId: undefined },
    ])("returns 400 with $label", async ({ reservationId }) => {
      const response = await request(app)
        .delete(`/reservations/${reservationId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("returns 404 when the reservation does not exist", async () => {
      const response = await request(app)
        .delete(`/reservations/${new mongoose.Types.ObjectId().toString()}`)
        .set("Authorization", `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("AUTH/TOKEN Failures", () => {
    it.each([
      { label: "No token", getToken: () => undefined },
      { label: "Malformatted token", getToken: () => "malformattedToken" },
      {
        label: "Tampered JWT SECRET",
        getToken: () =>
          jwt.sign(
            {
              id: new mongoose.Types.ObjectId().toString(),
              role: "admin",
            },
            "TamperedJwtSecret",
          ),
      },
    ])("returns 401 with $label", async ({ getToken }) => {
      const reservation = await Reservation.create({
        ...createReservationPayload({
          name: "reservation1",
          restaurantId: restaurant1._id.toString(),
        }),
        userId: new mongoose.Types.ObjectId(),
      });
      const response = await request(app)
        .delete(`/reservations/${reservation._id.toString()}`)
        .set("Authorization", `Bearer ${getToken()}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(await Reservation.findById(reservation._id)).not.toBeNull();
    });

    it("returns 403 with Role: Kitchen", async () => {
      const reservation = await Reservation.create({
        ...createReservationPayload({
          name: "reservation1",
          restaurantId: restaurant1._id.toString(),
        }),
        userId: new mongoose.Types.ObjectId(),
      });
      const token = jwt.sign(
        {
          id: new mongoose.Types.ObjectId().toString(),
          role: "kitchen",
        },
        JWT_SECRET,
      );
      const response = await request(app)
        .delete(`/reservations/${reservation._id.toString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
      expect(await Reservation.findById(reservation._id)).not.toBeNull();
    });
  });
});
