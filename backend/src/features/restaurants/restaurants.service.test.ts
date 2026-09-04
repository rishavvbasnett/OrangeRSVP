import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import Restaurant from "./restaurants.model.js";
import * as restaurantService from "./restaurants.service.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

beforeAll(async () => {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await Restaurant.deleteMany({});

  await Restaurant.create({
    name: "Nur",
    address: "Near Steinway Street",
  });
  await Restaurant.create({
    name: "Prime",
    address: "On Steinway Street",
  });
});

describe("createOne", () => {
  it("saves one restaurant with proper input", async () => {
    const thirdRestaurant = {
      name: "KuKu",
      address: "Far from Steinway Street",
    };
    const _savedRestaurant = await restaurantService.createOne(thirdRestaurant);
    const allRestaurants = await Restaurant.find({});
    expect(allRestaurants).toHaveLength(3);
    expect(allRestaurants[2]).toMatchObject(thirdRestaurant);
  });
});

describe("deleteOne", () => {
  it("deletes one restaurant with proper id", async () => {
    const nurRestaurant = await Restaurant.findOne({ name: "Nur" });
    const deletedNur = await restaurantService.deleteOne(nurRestaurant.id);
    expect(deletedNur?.name).toBe(nurRestaurant?.name);
    expect(deletedNur?.id).toBe(nurRestaurant?.id);
    expect(deletedNur?.address).toBe(nurRestaurant?.address);
    expect(await Restaurant.findOne({ name: "Nur" })).toBeNull();
  });

  it("throws an error when restaurant id doesn't exist", async () => {
    await expect(restaurantService.deleteOne("InvalidId")).rejects.toThrow();
  });
});

describe("getAll", () => {
  it("gets all the restaurants in the DB", async () => {
    const allRestaurants = await restaurantService.getAll();
    expect(allRestaurants).toHaveLength(2);
  });

  it("gets an empty array when there are no restaurants in the DB", async () => {
    await Restaurant.deleteMany({});
    const allRestaurants = await restaurantService.getAll();
    expect(allRestaurants).toHaveLength(0);
  });
});

describe("getOne", () => {
  it("gets one restaurant with valid id", async () => {
    const newRestaurant = await Restaurant.create({
      name: "Kuku",
      address: "Near Steinway Street",
    });
    const foundRestaurant = await restaurantService.getOne(newRestaurant.id);
    expect(foundRestaurant.name).toBe("Kuku");
    expect(foundRestaurant.address).toBe("Near Steinway Street");
  });

  it("throws an error when restaurant id doesn't exist in the DB", async () => {
    await expect(restaurantService.getOne("invalidId")).rejects.toThrow();
  });
});
