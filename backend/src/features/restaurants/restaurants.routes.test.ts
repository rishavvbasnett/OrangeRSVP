import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import Restaurant from "./restaurants.model.js";
import User from "../users/users.model.js";
import * as helpers from "../../shared/utils/helpers.js";
import request from "supertest";
import app from "../../app.js";

let mongoServer: MongoMemoryServer;
let managerToken: string;
let customerToken: string;
let adminToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
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

describe("POST /restaurants", () => {
  it("creates a restaurant. PAYLOAD: name, address, businessHours, isActive. Valid Token. ROLE: ADMIN", async () => {
    const response = await request(app)
      .post("/restaurants")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Nur",
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
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: "Nur",
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
    });
    expect(await Restaurant.findOne({ name: "Nur" })).toMatchObject({
      name: "Nur",
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
    });
  });
});
