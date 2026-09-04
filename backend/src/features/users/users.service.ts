import { ItemNotFound } from "../../shared/utils/errors.js";
import User from "./users.model.js";
import type { PublicUser, RegisterUser } from "./users.types.js";
import * as Hash from "../../shared/utils/helpers.js";

export const getOne = async (id: string): Promise<PublicUser> => {
  const foundUser = await User.findById(id);
  if (!foundUser) throw new ItemNotFound("User not found");
  return makePublic(foundUser);
};

export const getAll = async (): Promise<PublicUser[]> => {
  const allUsers = await User.find({});
  return allUsers.map((user) => makePublic(user));
};

export const createOne = async (
  validUser: RegisterUser,
): Promise<PublicUser> => {
  const passwordHash = await Hash.convert(validUser.password);
  const newUser = {
    email: validUser.email,
    role: validUser.role,
    passwordHash,
  };
  const createdUser = await User.create(newUser);
  return makePublic(createdUser);
};

export const deleteOne = async (id: string): Promise<PublicUser> => {
  const deletedUser = await User.findByIdAndDelete(id);
  if (!deletedUser) throw new ItemNotFound("Item not found");
  return makePublic(deletedUser);
};

export const makePublic = (user: any): PublicUser => {
  const userObject = user.toObject ? user.toObject() : user;
  const { passwordHash: _passwordHash, ...rest } = userObject;
  return rest as PublicUser;
};
