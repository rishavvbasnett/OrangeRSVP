import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import Restaurant from "./restaurants.model.js";
import jwt from "jsonwebtoken";
import * as helpers from "../../shared/utils/helpers.js";
import request from "supertest";
import app from "../../app.js";
import type {
  RestaurantDocument,
  RestaurantInput,
} from "./restaurants.types.js";
import { JWT_SECRET } from "../../shared/config/env.js";

let mongoServer: MongoMemoryServer;
let managerToken: string;
let customerToken: string;
let adminToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: { version: "7.0.14" },
  });
  await mongoose.connect(mongoServer.getUri());
  managerToken = await helpers.createUserToken("manager");
  customerToken = await helpers.createUserToken("customer");
  adminToken = await helpers.createUserToken("admin");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Restaurant.deleteMany({});
});

const makeRestaurantPayload = (overrides: Partial<any> = {}) => {
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

describe("POST /restaurants", () => {
  it("HAPPY PATH with VALID: FIELDS, TOKEN, ROLE", async () => {
    const response = await request(app)
      .post("/restaurants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(makeRestaurantPayload());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(makeRestaurantPayload());
    expect(await Restaurant.findOne({ name: "Prime" })).toMatchObject(
      makeRestaurantPayload(),
    );
  });

  describe("VALIDATION with Invalid Fields. But VALID TOKEN & ROLE", () => {
    it.each([
      {
        label: "missing name",
        overrides: {
          name: undefined,
        },
      },
      {
        label: "empty name",
        overrides: {
          name: "",
        },
      },
      {
        label: "missing address",
        overrides: {
          address: undefined,
        },
      },
      {
        label: "empty address",
        overrides: {
          address: "",
        },
      },
      {
        label: "String field: isActive",
        overrides: {
          isActive: "string",
        },
      },
      {
        label: "Number field: isActive",
        overrides: {
          isActive: 99,
        },
      },
      {
        label: "invalid day enum",
        overrides: {
          businessHours: [{ day: "someday", closed: true }],
        },
      },
      {
        label: "closed false & missing opensAt",
        overrides: {
          businessHours: [{ day: "monday", closed: false, closesAt: "22:00" }],
        },
      },
      {
        label: "closed false & missing closesAt",
        overrides: {
          businessHours: [
            {
              day: "monday",
              closed: false,
              opensAt: "9:00",
            },
          ],
        },
      },
      {
        label: "malformatted opensAt timeString",
        overrides: {
          businessHours: [
            {
              day: "monday",
              closed: false,
              opensAt: "9:099",
            },
          ],
        },
      },
    ])("rejects invalid Payload with: $label", async ({ overrides }) => {
      const payload = makeRestaurantPayload(overrides);
      const response = await request(app)
        .post("/restaurants")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(await Restaurant.countDocuments()).toBe(0);
    });
  });

  describe("AUTH/ROLE failures", () => {
    it.each([
      {
        label: "Role: customer",
        getToken: () => customerToken,
      },
      {
        label: "Role: manager",
        getToken: () => managerToken,
      },
    ])("returns status 403 with $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .post("/restaurants")
        .set("Authorization", `Bearer ${token}`)
        .send(makeRestaurantPayload());

      expect(response.status).toBe(403);
      expect(await Restaurant.countDocuments()).toBe(0);
    });
    it.each([
      {
        label: "No Token",
        getToken: () => undefined,
      },
      {
        label: "malformated Token",
        getToken: () => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",
      },
      {
        label: "Tampered JWT SECRET",
        getToken: () =>
          jwt.sign(
            {
              id: "some ID",
              role: "admin",
            },
            "TAMPERED JWT SECRET",
          ),
      },
    ])("returns status 401 with $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .post("/restaurants")
        .set("Authorization", `Bearer ${token}`)
        .send(makeRestaurantPayload());

      expect(response.status).toBe(401);
      expect(await Restaurant.countDocuments()).toBe(0);
    });
  });
  it("rejects DUPLICATE NAME", async () => {
    const response1 = await request(app)
      .post("/restaurants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(makeRestaurantPayload());

    const response2 = await request(app)
      .post("/restaurants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(makeRestaurantPayload());

    expect(response2.status).not.toBe(201);
    expect(await Restaurant.countDocuments()).toBe(1);
  });
});

describe("GET /restaurants", () => {
  let restaurant1Payload;
  let restaurant2Payload;

  beforeEach(async () => {
    restaurant1Payload = makeRestaurantPayload({
      name: "restaurant1",
      address: "address1",
    });
    restaurant2Payload = makeRestaurantPayload({
      name: "restaurant2",
      address: "address2",
    });
    await Restaurant.create([restaurant1Payload, restaurant2Payload]);
  });

  describe("HAPPY PATH with VALID TOKEN & VALID ROLE", () => {
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
    ])("Gets all Restaurants with: $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .get("/restaurants")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(await Restaurant.countDocuments()).toBe(2);
      expect(response.body).toMatchObject([
        restaurant1Payload,
        restaurant2Payload,
      ]);
    });
  });

  it("Returns empty array when NO RESTAURANTS in the DB", async () => {
    await Restaurant.deleteMany({});

    const response = await request(app)
      .get("/restaurants")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  describe("AUTH/TOKEN Failures", () => {
    it.each([
      {
        label: "No Token",
        getToken: () => undefined,
      },
      {
        label: "Malformatted Token",
        getToken: () => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",
      },
      {
        label: "Tampered JWT SECRET",
        getToken: () =>
          jwt.sign(
            {
              id: "someId",
              role: "admin",
            },
            "TAMPERED JWT SECRET",
          ),
      },
    ])("Returns STATUS 401 with: $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .get("/restaurants")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });
  });
});

describe("GET /restaurants/:id", () => {
  let createdRestaurant1: RestaurantDocument;

  beforeEach(async () => {
    await Restaurant.deleteMany({});
    createdRestaurant1 = await Restaurant.create(
      makeRestaurantPayload({
        name: "restaurant1",
        address: "address1",
      }),
    );
  });

  describe("HAPPY PATH with VALID ID. VALID TOKEN. VALID ROLE", () => {
    it.each([
      { label: "Role: Customer", getToken: () => customerToken },
      {
        label: "Role: Manager",
        getToken: () => managerToken,
      },
      {
        label: "Role: Admin",
        getToken: () => adminToken,
      },
    ])("Returns a Restaurant with: $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .get(`/restaurants/${createdRestaurant1.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.body.name).toBe(createdRestaurant1.name);
      expect(response.body.address).toBe(createdRestaurant1.address);
    });
  });

  it("Returns 404 when Restaurant doesn't exists", async () => {
    const replacement = createdRestaurant1.id[0] === "a" ? "b" : "a";
    const nonExistingId = replacement + createdRestaurant1.id.slice(1);
    const response = await request(app)
      .get(`/restaurants/${nonExistingId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  describe("VALIDATION FAILURES with ID PARAMS", () => {
    it.each([
      {
        label: "No ID",
        id: undefined,
      },
      {
        label: "Malformatted ID",
        id: "malformattedId",
      },
    ])("Returns 400 with $label", async ({ id }) => {
      const response = await request(app)
        .get(`/restaurants/${id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("AUTH/ROLE FAILURES", () => {
    it.each([
      {
        label: "No Token",
        getToken: () => undefined,
      },
      {
        label: "Malformatted Token",
        getToken: () => "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",
      },
      {
        label: "Tampered JWT SECRET",
        getToken: () =>
          jwt.sign(
            {
              id: "some ID",
              role: "admin",
            },
            "Tampered JWT SECRET",
          ),
      },
    ])("Returns 401 with $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .get(`/restaurants/${createdRestaurant1.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("Returns 403 with Valid TOKEN BUT INVALID ROLE", async () => {
      const token = jwt.sign(
        {
          id: "some ID",
          role: "kitchen",
        },
        JWT_SECRET,
      );
      const response = await request(app)
        .get(`/restaurants/${createdRestaurant1.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
    });
  });
});

describe("DELETE /restaurants/:id", () => {
  let createdRestaurant1: RestaurantDocument;

  beforeEach(async () => {
    createdRestaurant1 = await Restaurant.create(
      makeRestaurantPayload({
        name: "restaurant1",
        address: "address1",
      }),
    );
  });

  describe("HAPPY PATH with VALID ID. VALID TOKEN. VALID ROLE", () => {
    it("Deletes a Restaurant with: Role Admin", async () => {
      const response = await request(app)
        .delete(`/restaurants/${createdRestaurant1.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(createdRestaurant1.name);
      expect(response.body.address).toBe(createdRestaurant1.address);
      expect(response.body.isActive).toBe(createdRestaurant1.isActive);
      expect(await Restaurant.findById(createdRestaurant1.id)).toBeNull();
    });
  });

  it("Returns 404 when Restaurant doesn't exist", async () => {
    const replacement = createdRestaurant1.id[0] === "a" ? "b" : "a";
    const nonExistingId = replacement + createdRestaurant1.id.slice(1);
    const response = await request(app)
      .delete(`/restaurants/${nonExistingId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect(await Restaurant.findById(createdRestaurant1.id)).not.toBeNull();
  });

  describe("VALIDATION FAILURES with ID PARAMS", () => {
    it.each([
      {
        label: "No ID",
        id: undefined,
      },
      {
        label: "Malformatted ID",
        id: "malformattedId",
      },
    ])("Returns 400 with $label", async ({ id }) => {
      const response = await request(app)
        .delete(`/restaurants/${id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(await Restaurant.findById(createdRestaurant1.id)).not.toBeNull();
    });
  });

  describe("AUTH/ROLE FAILURES", () => {
    it.each([
      {
        label: "Role: Customer",
        getToken: () => customerToken,
      },
      {
        label: "Role: Manager",
        getToken: () => managerToken,
      },
    ])("Returns 403 with: $label", async ({ getToken }) => {
      const response = await request(app)
        .delete(`/restaurants/${createdRestaurant1.id}`)
        .set("Authorization", `Bearer ${getToken()}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
      expect(await Restaurant.findById(createdRestaurant1.id)).not.toBeNull();
    });

    it.each([
      {
        label: "No Token",
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
              id: "some ID",
              role: "admin",
            },
            "Tampered JWT SECRET",
          ),
      },
    ])("Returns 401 with: $label", async ({ getToken }) => {
      const token = getToken();
      const response = await request(app)
        .delete(`/restaurants/${createdRestaurant1.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
      expect(await Restaurant.findById(createdRestaurant1.id)).not.toBeNull();
    });

    it("Returns 403 with Valid TOKEN BUT INVALID ROLE", async () => {
      const token = jwt.sign(
        {
          id: "some ID",
          role: "kitchen",
        },
        JWT_SECRET,
      );
      const response = await request(app)
        .delete(`/restaurants/${createdRestaurant1.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
      expect(await Restaurant.findById(createdRestaurant1.id)).not.toBeNull();
    });
  });
});
