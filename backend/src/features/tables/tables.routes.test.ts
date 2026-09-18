import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import { JWT_SECRET } from "../../shared/config/env.js";
import mongoServer from "../../shared/test/mongoServer.setup.js";
import { createRestaurantPayload, createTablePayload } from "../../shared/test/createPayload.js";
import * as helpers from "../../shared/utils/helpers.js";
import Restaurant from "../restaurants/restaurants.model.js";
import type { RestaurantDocument } from "../restaurants/restaurants.types.js";
import Table from "./tables.model.js";

let managerToken: string;
let customerToken: string;
let adminToken: string;
let restaurant1: RestaurantDocument;

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

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
  await Table.deleteMany({});
  await Restaurant.deleteMany({});
  restaurant1 = await Restaurant.create(
    createRestaurantPayload({ name: "restaurant1" }),
  );
});

describe("POST /tables", () => {
  it.each([
    ["manager", () => managerToken],
    ["admin", () => adminToken],
  ])("creates and persists a table for the %s role", async (_role, getToken) => {
    const payload = createTablePayload({
      restaurantId: restaurant1.id,
      tableName: "table1",
      seats: 5,
      maximumCapacity: 5,
    });

    const response = await request(app)
      .post("/tables")
      .set(authHeader(getToken()))
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      tableName: "table1",
      seats: 5,
      maximumCapacity: 5,
      overload: false,
    });
    expect(await Table.findOne({ tableName: "table1" })).toMatchObject({
      seats: 5,
      maximumCapacity: 5,
    });
  });

  it("returns 400 for an invalid payload", async () => {
    const response = await request(app)
      .post("/tables")
      .set(authHeader(adminToken))
      .send(createTablePayload({ tableName: "", seats: 0 }));

    expect(response.status).toBe(400);
    expect(await Table.countDocuments()).toBe(0);
  });

  it("returns 403 when a customer tries to create a table", async () => {
    const response = await request(app)
      .post("/tables")
      .set(authHeader(customerToken))
      .send(createTablePayload({ restaurantId: restaurant1.id }));

    expect(response.status).toBe(403);
    expect(await Table.countDocuments()).toBe(0);
  });

  it("returns 401 without a token", async () => {
    const response = await request(app)
      .post("/tables")
      .send(createTablePayload({ restaurantId: restaurant1.id }));

    expect(response.status).toBe(401);
  });
});

describe("GET /tables", () => {
  it.each([
    ["manager", () => managerToken],
    ["customer", () => customerToken],
    ["admin", () => adminToken],
  ])("lists tables for the %s role and persists the result", async (_role, getToken) => {
    await Table.create([
      createTablePayload({ restaurantId: restaurant1.id, tableName: "table1" }),
      createTablePayload({ restaurantId: restaurant1.id, tableName: "table2" }),
    ]);

    const response = await request(app)
      .get(`/tables?restaurantId=${restaurant1.id}`)
      .set(authHeader(getToken()));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("returns 400 when restaurantId is invalid", async () => {
    const response = await request(app)
      .get("/tables?restaurantId=invalid")
      .set(authHeader(customerToken));

    expect(response.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const response = await request(app).get(
      `/tables?restaurantId=${restaurant1.id}`,
    );

    expect(response.status).toBe(401);
  });
});

describe("GET /tables/:id", () => {
  it("returns a table for a valid token", async () => {
    const table = await Table.create(
      createTablePayload({ restaurantId: restaurant1.id }),
    );

    const response = await request(app)
      .get(`/tables/${table.id}`)
      .set(authHeader(customerToken));

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(table.id);
  });

  it("returns 400 for an invalid table ID", async () => {
    const response = await request(app)
      .get("/tables/invalid")
      .set(authHeader(customerToken));

    expect(response.status).toBe(400);
  });

  it("returns 404 for a valid but missing table ID", async () => {
    const response = await request(app)
      .get(`/tables/${new mongoose.Types.ObjectId()}`)
      .set(authHeader(customerToken));

    expect(response.status).toBe(404);
  });
});

describe("PATCH /tables/:id", () => {
  it("updates and persists a table for a manager", async () => {
    const table = await Table.create(
      createTablePayload({ restaurantId: restaurant1.id }),
    );

    const response = await request(app)
      .patch(`/tables/${table.id}`)
      .set(authHeader(managerToken))
      .send({ tableName: "Updated table", status: "reserved" });

    expect(response.status).toBe(200);
    expect(response.body.tableName).toBe("Updated table");
    expect(await Table.findById(table.id)).toMatchObject({
      tableName: "Updated table",
      status: "reserved",
    });
  });

  it("returns 400 for an invalid update", async () => {
    const table = await Table.create(
      createTablePayload({ restaurantId: restaurant1.id }),
    );

    const response = await request(app)
      .patch(`/tables/${table.id}`)
      .set(authHeader(adminToken))
      .send({ seats: 0 });

    expect(response.status).toBe(400);
  });

  it("returns 403 when a customer tries to update", async () => {
    const table = await Table.create(
      createTablePayload({ restaurantId: restaurant1.id }),
    );

    const response = await request(app)
      .patch(`/tables/${table.id}`)
      .set(authHeader(customerToken))
      .send({ tableName: "Updated table" });

    expect(response.status).toBe(403);
  });
});

describe("DELETE /tables/:id", () => {
  it("deletes and persists removal for an admin", async () => {
    const table = await Table.create(
      createTablePayload({ restaurantId: restaurant1.id }),
    );

    const response = await request(app)
      .delete(`/tables/${table.id}`)
      .set(authHeader(adminToken));

    expect(response.status).toBe(200);
    expect(await Table.findById(table.id)).toBeNull();
  });

  it("returns 403 when a customer tries to delete", async () => {
    const table = await Table.create(
      createTablePayload({ restaurantId: restaurant1.id }),
    );

    const response = await request(app)
      .delete(`/tables/${table.id}`)
      .set(authHeader(customerToken));

    expect(response.status).toBe(403);
    expect(await Table.findById(table.id)).not.toBeNull();
  });
});

describe("overload routes", () => {
  it("sets overload and persists the new capacity", async () => {
    const table = await Table.create(
      createTablePayload({
        restaurantId: restaurant1.id,
        seats: 5,
        maximumCapacity: 5,
      }),
    );

    const response = await request(app)
      .patch(`/tables/${table.id}/overload`)
      .set(authHeader(managerToken))
      .send({ newCapacity: 10 });

    expect(response.status).toBe(200);
    expect(await Table.findById(table.id)).toMatchObject({
      overload: true,
      maximumCapacity: 10,
    });
  });

  it("returns 400 for invalid overload capacity and does not change persistence", async () => {
    const table = await Table.create(
      createTablePayload({
        restaurantId: restaurant1.id,
        seats: 5,
        maximumCapacity: 5,
      }),
    );

    const response = await request(app)
      .patch(`/tables/${table.id}/overload`)
      .set(authHeader(adminToken))
      .send({ newCapacity: 3 });

    expect(response.status).toBe(400);
    expect(await Table.findById(table.id)).toMatchObject({
      overload: false,
      maximumCapacity: 5,
    });
  });

  it("clears overload and persists the normal capacity", async () => {
    const table = await Table.create(
      createTablePayload({
        restaurantId: restaurant1.id,
        seats: 5,
        maximumCapacity: 10,
        overload: true,
      }),
    );

    const response = await request(app)
      .patch(`/tables/${table.id}/overload/clear`)
      .set(authHeader(managerToken));

    expect(response.status).toBe(200);
    expect(await Table.findById(table.id)).toMatchObject({
      overload: false,
      maximumCapacity: 5,
    });
  });

  it("returns 403 when a customer tries to change overload", async () => {
    const table = await Table.create(
      createTablePayload({ restaurantId: restaurant1.id }),
    );

    const response = await request(app)
      .patch(`/tables/${table.id}/overload`)
      .set(authHeader(customerToken))
      .send({ newCapacity: 10 });

    expect(response.status).toBe(403);
  });

  it("returns 401 with a tampered token", async () => {
    const token = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString(), role: "admin" },
      "wrong-secret",
    );

    const response = await request(app)
      .patch(`/tables/${new mongoose.Types.ObjectId()}/overload/clear`)
      .set(authHeader(token));

    expect(response.status).toBe(401);
    expect(JWT_SECRET).not.toBe("wrong-secret");
  });
});
