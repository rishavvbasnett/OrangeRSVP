import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import app from "../../app.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { JWT_SECRET } from "../../shared/config/env.js";
import User from "../users/users.model.js";
import bcrypt from "bcrypt";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await User.create({
    email: "fang@gmail.com",
    passwordHash: await bcrypt.hash("fang", 10),
    role: "manager",
  });
});

describe("POST /login", () => {
  it("returns a valid token with valid user credentials", async () => {
    const response = await request(app).post("/login").send({
      email: "fang@gmail.com",
      password: "fang",
      role: "manager",
    });
    const userInfo = response.body;
    expect(userInfo.token).not.toBeFalsy();

    const decodedToken = jwt.verify(userInfo.token, JWT_SECRET);
    expect(decodedToken.email).toBe("fang@gmail.com");
    expect(decodedToken.role).toBe("manager");
  });

  it("sends 401 unauthorized with valid email but incorrect password", async () => {
    const response = await request(app).post("/login").send({
      email: "bai@gmail.com",
      password: "wrongPassword",
    });
    expect(response.status).toBe(401);
  });

  it("sends 401 unauthorized with invalid email", async () => {
    const response = await request(app).post("/login").send({
      email: "invalidEmail@gmail.com",
      password: "wrongPassword",
    });
    expect(response.status).toBe(401);
  });

  it("sends 401 unauthorized with email that doesn't exist in DB", async () => {
    const response = await request(app).post("/login").send({
      email: "idontexist@gmail.com",
      password: "wrongPassword",
    });
    expect(response.status).toBe(401);
  });

  it("sends 400 status without email", async () => {
    const response = await request(app).post("/login").send({
      password: "fang",
    });
    expect(response.status).toBe(400);
  });

  it("sends 400 status without password", async () => {
    const response = await request(app).post("/login").send({
      email: "fang@gmail.com",
    });
    expect(response.status).toBe(400);
  });
});
