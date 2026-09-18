import { Request, Response } from "express";
import asyncHandler from "../../shared/middleware/asyncHandler.js";
import { IdParamSchema } from "../../shared/shared.validation.js";
import tableService from "./tables.service.js";
import {
  SetOverloadSchema,
  TableInputSchema,
  TableUpdateSchema,
} from "./tables.validation.js";

export const createOne = asyncHandler(
  async (request: Request, response: Response) => {
    const validTable = TableInputSchema.parse(request.body);
    const createdTable = await tableService.createOne(validTable);
    return response.status(201).json(createdTable);
  },
);

export const getOne = asyncHandler(
  async (request: Request, response: Response) => {
    const tableId = IdParamSchema.parse(request.params.id);
    const foundTable = await tableService.getOne(tableId);
    return response.json(foundTable);
  },
);

export const getAllForRestaurant = asyncHandler(
  async (request: Request, response: Response) => {
    const restaurantId = IdParamSchema.parse(request.query.restaurantId);
    const tables = await tableService.getAllForRestaurant(restaurantId);
    return response.json(tables);
  },
);

export const updateOne = asyncHandler(
  async (request: Request, response: Response) => {
    const tableId = IdParamSchema.parse(request.params.id);
    const updates = TableUpdateSchema.parse(request.body);
    const updatedTable = await tableService.updateOne(tableId, updates);
    return response.json(updatedTable);
  },
);

export const deleteOne = asyncHandler(
  async (request: Request, response: Response) => {
    const tableId = IdParamSchema.parse(request.params.id);
    const deletedTable = await tableService.deleteOne(tableId);
    return response.json(deletedTable);
  },
);

export const setOverload = asyncHandler(
  async (request: Request, response: Response) => {
    const tableId = IdParamSchema.parse(request.params.id);
    const { newCapacity } = SetOverloadSchema.parse(request.body);
    const updatedTable = await tableService.setOverload(tableId, newCapacity);
    return response.json(updatedTable);
  },
);

export const clearOverload = asyncHandler(
  async (request: Request, response: Response) => {
    const tableId = IdParamSchema.parse(request.params.id);
    const updatedTable = await tableService.clearOverload(tableId);
    return response.json(updatedTable);
  },
);
