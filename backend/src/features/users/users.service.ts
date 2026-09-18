import { ItemNotFoundError } from "../../shared/utils/errors.js";
import User from "./users.model.js";
import type { UserDto, RegisterUser } from "./users.types.js";
import * as Hash from "../../shared/utils/helpers.js";

export const getOne = async (id: string): Promise<UserDto> => {
  const foundUser = await User.findById(id).lean();
  if (!foundUser) throw new ItemNotFoundError("User not found");
  return toDto(foundUser);
};

export const getAll = async (): Promise<UserDto[]> => {
  const allUsers = await User.find({}).sort({ name: 1, _id: 1 }).lean();
  return allUsers.map((user) => toDto(user));
};

export const createOne = async (validUser: RegisterUser): Promise<UserDto> => {
  const passwordHash = await Hash.convert(validUser.password);
  const newUser = {
    email: validUser.email,
    role: validUser.role,
    passwordHash,
  };
  const createdUser = await User.create(newUser);
  return toDto(createdUser);
};

export const deleteOne = async (id: string): Promise<UserDto> => {
  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) throw new ItemNotFoundError("Item not found");
  return toDto(deletedUser);
};

export const toDto = (user: any): UserDto => {
  const userObject = user.toObject ? user.toObject() : user;
  const { passwordHash: _passwordHash, ...rest } = userObject;
  return rest as UserDto;
};
