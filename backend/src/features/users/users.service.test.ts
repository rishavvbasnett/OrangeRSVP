import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";

import User from "./users.model.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as userService from "./users.service.js";
import mongoose from "mongoose";
import { RegisterUser, UserDocument } from "./users.types.js";

beforeAll(async () => {
  const mongoServer: MongoMemoryServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("makePublic", () => {
  it("returns everything else except passwordHash", () => {
    const user1: UserDocument = {
      email: "fangyuan@gmail.com",
      role: "manager",
      passwordHash: "fang",
    };
    expect(userService.makePublic(user1)).toEqual({
      email: "fangyuan@gmail.com",
      role: "manager",
    });
  });
});

describe("createOne ", () => {
  it("creates a user in DB with proper user input and returns a Public User", async () => {
    const rawUser: RegisterUser = {
      email: "fangyuan@gmail.com",
      role: "manager",
      password: "fang",
    };
    const savedPublicUser = await userService.createOne(rawUser);
    const allUsers = await User.find({});
    expect(allUsers.length).toBe(1);

    const user1DB = allUsers[0];
    expect(user1DB.email).toBe(savedPublicUser.email);
    expect(user1DB.role).toBe(savedPublicUser.role);
    expect(savedPublicUser).not.toHaveProperty("passwordHash");
  });
});

describe("getAll", () => {
  it("gets all users in DB with only email & role", async () => {
    const user1: RegisterUser = {
      email: "fangyuan@gmail.com",
      role: "manager",
      password: "fang",
    };

    const user2: RegisterUser = {
      email: "bainingbing@gmail.com",
      role: "customer",
      password: "bai",
    };
    const savedUser1 = await userService.createOne(user1);
    const savedUser2 = await userService.createOne(user2);
    const fetchedUsers = await userService.getAll();

    expect(fetchedUsers).toHaveLength(2);
    expect(fetchedUsers.map((user) => user.email).sort()).toEqual(
      [savedUser1.email, savedUser2.email].sort(),
    );
    expect(fetchedUsers.map((user) => user.role).sort()).toEqual(
      [savedUser1.role, savedUser2.role].sort(),
    );
    expect(fetchedUsers.every((user) => !("passwordHash" in user))).toBe(true);
  });
});

describe("getOne ", () => {
  it("gets a user via id", async () => {
    const rawUser: UserDocument = {
      email: "fangyuan@gmail.com",
      role: "manager",
      passwordHash: "randomHash",
    };

    const createdUser = await User.create(rawUser);
    const fetchedUser = await userService.getOne(createdUser._id.toString());
    expect(fetchedUser.email).toBe(createdUser.email);
    expect(fetchedUser.role).toBe(createdUser.role);
  });

  it("throws an error if user not found via id", async () => {
    const invalidId = "507f1f77bcf86cd799439011";
    await expect(userService.getOne(invalidId)).rejects.toThrow();
  });
});

describe("deleteOne", () => {
  it("deletes a user via valid id", async () => {
    const user1: RegisterUser = {
      email: "fangyuan@gmail.com",
      role: "manager",
      password: "fang",
    };
    const createdUser = await userService.createOne(user1);
    expect(await User.find({})).toHaveLength(1);

    const deletedUser = await userService.deleteOne(createdUser._id.toString());
    expect(await User.find({})).toHaveLength(0);
    expect(deletedUser).toMatchObject({
      email: "fangyuan@gmail.com",
      role: "manager",
    });
  });

  it("throws an error if user-to-delete not found in DB", async () => {
    await expect(userService.deleteOne("invalidid")).rejects.toThrow();
  });
});
