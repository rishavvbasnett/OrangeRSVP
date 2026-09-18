import { beforeAll, afterAll, describe, it, expect, beforeEach } from "vitest";
import tableService from "./tables.service.js";
import Table from "./tables.model.js";
import Restaurant from "../restaurants/restaurants.model.js";
import {
  ItemNotFoundError,
  BadRequestError,
} from "../../shared/utils/errors.js";
import mongoServer from "../../shared/test/mongoServer.setup.js";
import {
  createRestaurantPayload,
  createTablePayload,
} from "../../shared/test/createPayload.js";
import User from "../users/users.model.js";
import mongoose from "mongoose";

let restaurant1;
let restaurant2;

beforeAll(async () => {
  await mongoServer.connect();

  await Restaurant.deleteMany({});
  await User.deleteMany({});

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

afterAll(async () => {
  await mongoServer.disconnect();
});

beforeEach(async () => {
  await Table.deleteMany({});
});

describe("createOne", () => {
  it("persists and returns a Table Document with Valid Input", async () => {
    const table1Payload = createTablePayload({
      restaurantId: restaurant1._id,
      tableName: "Front 1",
      seats: 1,
      maximumCapacity: 1,
      status: "available",
    });
    const savedTable1 = await tableService.createOne(table1Payload);

    expect(savedTable1.restaurantId.toString()).toBe(
      table1Payload.restaurantId.toString(),
    );
    expect(savedTable1.tableName).toBe(table1Payload.tableName);
    expect(savedTable1.seats).toBe(table1Payload.seats);
    expect(savedTable1.maximumCapacity).toBe(table1Payload.maximumCapacity);
    expect(savedTable1.status).toBe(table1Payload.status);

    const persistedTable1 = await Table.findById(savedTable1._id);
    expect(persistedTable1.restaurantId.toString()).toBe(
      savedTable1.restaurantId.toString(),
    );
    expect(persistedTable1.tableName).toBe(savedTable1.tableName);
    expect(persistedTable1.seats).toBe(savedTable1.seats);
    expect(persistedTable1.maximumCapacity).toBe(savedTable1.maximumCapacity);
    expect(persistedTable1.status).toBe(savedTable1.status);
  });
  it("throws ItemNotFoundError when restaurantId doesn't exist", async () => {
    const invalidRestaurantId = new mongoose.Types.ObjectId().toString();
    const table1Payload = createTablePayload({
      restaurantId: invalidRestaurantId,
    });
    await expect(tableService.createOne(table1Payload)).rejects.toThrow(
      ItemNotFoundError,
    );
    expect(
      await Table.findOne({
        restaurantId: invalidRestaurantId,
      }),
    ).toBeNull();
  });
});

describe("getOne", () => {
  it("returns the table when it exists on the DB", async () => {
    const savedTable1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "Front 1",
        seats: 1,
        maximumCapacity: 1,
        status: "available",
      }),
    );
    const foundTable1 = await tableService.getOne(savedTable1._id);
    expect(foundTable1.restaurantId.toString()).toBe(
      savedTable1.restaurantId.toString(),
    );
    expect(foundTable1.tableName).toBe(savedTable1.tableName);
    expect(foundTable1.seats).toBe(savedTable1.seats);
    expect(foundTable1.maximumCapacity).toBe(savedTable1.maximumCapacity);
    expect(foundTable1.status).toBe(savedTable1.status);
  });

  it("throws ItemNotFoundError when table doesn't exist in the DB", async () => {
    const savedTable1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "Front 1",
        seats: 1,
        maximumCapacity: 1,
        status: "available",
      }),
    );
    await Table.deleteMany({});
    await expect(tableService.getOne(savedTable1._id)).rejects.toThrow(
      ItemNotFoundError,
    );
  });
});

describe("updateOne", () => {
  it("persists and returns updated table with valid input", async () => {
    const savedTable1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "Front 1",
        seats: 1,
        maximumCapacity: 1,
        status: "available",
      }),
    );
    const updates = {
      restaurantId: restaurant2._id,
      tableName: "Back 2",
      seats: 2,
      maximumCapacity: 2,
      status: "reserved",
    };
    const newTable1 = await tableService.updateOne(savedTable1._id, updates);
    expect(newTable1.restaurantId.toString()).toBe(
      updates.restaurantId.toString(),
    );
    expect(newTable1.tableName).toBe(updates.tableName);
    expect(newTable1.seats).toBe(updates.seats);
    expect(newTable1.status).toBe(updates.status);
    expect(newTable1.maximumCapacity).toBe(updates.maximumCapacity);

    const persistedTable1 = await Table.findById(savedTable1.id);
    expect(persistedTable1.restaurantId.toString()).toBe(
      newTable1.restaurantId.toString(),
    );
    expect(persistedTable1.tableName).toBe(newTable1.tableName);
    expect(persistedTable1.seats).toBe(newTable1.seats);
    expect(persistedTable1.status).toBe(newTable1.status);
    expect(persistedTable1.maximumCapacity).toBe(newTable1.maximumCapacity);
  });
  it("throws ItemNotFoundError when table doesn't exists in the DB", async () => {
    const savedTable1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "Front 1",
        seats: 1,
        maximumCapacity: 1,
        status: "available",
      }),
    );
    const updates = {
      restaurantId: restaurant2._id,
      tableName: "Back 2",
      seats: 2,
      maximumCapacity: 2,
      status: "reserved",
    };
    await Table.deleteMany({});
    await expect(
      tableService.updateOne(savedTable1._id, updates),
    ).rejects.toThrow(ItemNotFoundError);
  });
});

describe("setOverload", () => {
  it("sets overload and persists the new maximum capacity", async () => {
    const table1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "table1",
        seats: 5,
        maximumCapacity: 5,
      }),
    );

    const updatedTable = await tableService.setOverload(table1._id, 10);
    const persistedTable = await Table.findById(table1._id);

    expect(updatedTable.overload).toBe(true);
    expect(updatedTable.maximumCapacity).toBe(10);
    expect(persistedTable?.overload).toBe(true);
    expect(persistedTable?.maximumCapacity).toBe(10);
  });

  it("throws BadRequestError and does not change the table when new capacity is less than seats", async () => {
    const table1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "table1",
        seats: 5,
        maximumCapacity: 5,
      }),
    );

    await expect(tableService.setOverload(table1._id, 3)).rejects.toThrow(
      BadRequestError,
    );

    const persistedTable = await Table.findById(table1._id);
    expect(persistedTable?.overload).toBe(false);
    expect(persistedTable?.maximumCapacity).toBe(5);
  });

  it("throws ItemNotFoundError when table id does not exist", async () => {
    const randomTableId = new mongoose.Types.ObjectId().toString();

    await expect(tableService.setOverload(randomTableId, 10)).rejects.toThrow(
      ItemNotFoundError,
    );
  });
});

describe("clearOverload", () => {
  it("clears overload and persists the table seats as the maximum capacity", async () => {
    const table1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "table1",
        seats: 5,
        maximumCapacity: 10,
        overload: true,
      }),
    );

    const updatedTable = await tableService.clearOverload(table1._id);
    const persistedTable = await Table.findById(table1._id);

    expect(updatedTable.overload).toBe(false);
    expect(updatedTable.maximumCapacity).toBe(5);
    expect(persistedTable?.overload).toBe(false);
    expect(persistedTable?.maximumCapacity).toBe(5);
  });
  it("throws ItemNotFoundError when table id does not exist", async () => {
    const randomTableId = new mongoose.Types.ObjectId().toString();
    await expect(tableService.clearOverload(randomTableId)).rejects.toThrow(
      ItemNotFoundError,
    );
  });
});

describe("deleteOne", () => {
  it("deletes and returns a table when it exits on the DB", async () => {
    const savedTable1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "Front 1",
        seats: 1,
        maximumCapacity: 1,
        status: "available",
      }),
    );
    const deletedTable = await tableService.deleteOne(savedTable1._id);
    expect(await Table.findById(savedTable1._id)).toBeNull();

    expect(deletedTable.restaurantId.toString()).toBe(
      savedTable1.restaurantId.toString(),
    );
    expect(deletedTable.tableName).toBe(savedTable1.tableName);
    expect(deletedTable.seats).toBe(savedTable1.seats);
    expect(deletedTable.status).toBe(savedTable1.status);
    expect(deletedTable.maximumCapacity).toBe(savedTable1.maximumCapacity);
  });

  it("throws ItemNotFoundError when table doesn't exists in the DB", async () => {
    const savedTable1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "Front 1",
        seats: 1,
        maximumCapacity: 1,
        status: "available",
      }),
    );
    await Table.deleteMany({});
    await expect(tableService.deleteOne(savedTable1._id)).rejects.toThrow(
      ItemNotFoundError,
    );
  });
});

describe("getAllForRestaurant", () => {
  it("returns all tables for a particular restaurant", async () => {
    const savedTable1 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "table1",
        seats: 1,
      }),
    );
    const savedTable2 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "table2",
        seats: 2,
      }),
    );
    const savedTable3 = await Table.create(
      createTablePayload({
        restaurantId: restaurant1._id,
        tableName: "table3",
        seats: 3,
      }),
    );
    const restaurant1Tables = await tableService.getAllForRestaurant(
      restaurant1._id,
    );
    expect(restaurant1Tables).toHaveLength(3);
    expect(restaurant1Tables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tableName: savedTable1.tableName,
          seats: savedTable1.seats,
        }),
        expect.objectContaining({
          tableName: savedTable2.tableName,
          seats: savedTable2.seats,
        }),
        expect.objectContaining({
          tableName: savedTable3.tableName,
          seats: savedTable3.seats,
        }),
      ]),
    );
  });
  it("returns an empty array when no tables exists for a restaurant", async () => {
    const restaurant2Tables = await tableService.getAllForRestaurant(
      restaurant2._id,
    );
    expect(restaurant2Tables).toHaveLength(0);
    expect(restaurant2Tables).toEqual([]);
  });
  it("throws ItemNotFoundError when restaurantId doesn't exist in the DB", async () => {
    const invalidRestaurantId = new mongoose.Types.ObjectId().toString();
    await expect(
      tableService.getAllForRestaurant(invalidRestaurantId),
    ).rejects.toThrow(ItemNotFoundError);
  });
});
