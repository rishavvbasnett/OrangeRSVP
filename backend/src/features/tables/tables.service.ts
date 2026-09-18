import { IdParam } from "../../shared/shared.types.js";
import {
  BadRequestError,
  ItemNotFoundError,
} from "../../shared/utils/errors.js";
import {
  ensureRestaurantExists,
  ensureUserExists,
} from "../../shared/utils/helpers.js";
import Table from "./tables.model.js";
import { TableDocument, TableInput } from "./tables.types.js";

const createOne = async (
  validTableInput: TableInput,
): Promise<TableDocument> => {
  await ensureRestaurantExists(validTableInput.restaurantId);
  return Table.create(validTableInput);
};

const getOne = async (tableId: IdParam): Promise<TableDocument> => {
  const foundTable = await Table.findById(tableId);
  if (!foundTable) throw new ItemNotFoundError("Table not found");
  return foundTable;
};

const getAllForRestaurant = async (
  restaurantId: IdParam,
): Promise<TableDocument[]> => {
  await ensureRestaurantExists(restaurantId);
  return Table.find({ restaurantId });
};

const deleteOne = async (tableId: IdParam): Promise<TableDocument> => {
  const table = await Table.findByIdAndDelete(tableId);
  if (!table) throw new ItemNotFoundError("Table not found");
  return table;
};

const updateOne = async (
  tableId: IdParam,
  updates: Partial<TableInput>,
): Promise<TableDocument> => {
  const updatedTable = await Table.findByIdAndUpdate(tableId, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!updatedTable) throw new ItemNotFoundError("Table not found");
  return updatedTable;
};

const setOverload = async (
  tableId: IdParam,
  newCapacity: number,
): Promise<TableDocument> => {
  const foundTable = await Table.findById(tableId);
  if (!foundTable) throw new ItemNotFoundError("Table not found");
  if (newCapacity < foundTable.seats)
    throw new BadRequestError("maximumCapacity cannot be less than seats");
  foundTable.overload = true;
  foundTable.maximumCapacity = newCapacity;
  return foundTable.save();
};

const clearOverload = async (tableId: IdParam): Promise<TableDocument> => {
  const foundTable = await Table.findById(tableId);
  if (!foundTable) throw new ItemNotFoundError("Table not found");
  foundTable.overload = false;
  foundTable.maximumCapacity = foundTable.seats;
  return foundTable.save();
};

const tableService = {
  createOne,
  getOne,
  getAllForRestaurant,
  deleteOne,
  updateOne,
  setOverload,
  clearOverload,
};

export default tableService;
