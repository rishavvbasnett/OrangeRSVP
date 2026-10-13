import db from "../../shared/config/db.js";
import { ResourceNotFoundError } from "../../shared/utils/errorClasses.js";
import { users } from "./users.schema.js";
import type {
  ProfileUpdate,
  UserDto,
  UserInput,
  UserRow,
} from "./users.types.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { invalidateActorCache } from "../auth/auth.actor.js";

export const SALT_ROUNDS = 10;

export const convertToDto = (user: UserRow): UserDto => {
  const userDto: UserDto = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    platformRole: user.platformRole,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return userDto;
};

const getUser = async (id: number): Promise<UserDto> => {
  const [foundUser] = await db.select().from(users).where(eq(users.id, id));
  if (!foundUser) throw new ResourceNotFoundError("User not found");
  return convertToDto(foundUser);
};

const getAllUsers = async (): Promise<UserDto[]> => {
  const allUsers = await db.select().from(users);
  return allUsers.map((user) => convertToDto(user));
};

const createUser = async (user: UserInput): Promise<UserDto> => {
  const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
  const [savedUser] = await db
    .insert(users)
    .values({
      name: user.name,
      email: user.email,
      phone: user.phone,
      passwordHash,
    })
    .returning();
  return convertToDto(savedUser);
};

const deactivateUser = async (id: number): Promise<UserDto> => {
  const [deactivatedUser] = await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, id))
    .returning();

  if (!deactivatedUser) throw new ResourceNotFoundError("User not found");

  await invalidateActorCache(deactivatedUser.id);

  return convertToDto(deactivatedUser);
};

const updateProfile = async (id: number, updates: ProfileUpdate) => {
  const [updatedProfile] = await db
    .update(users)
    .set({
      name: updates.name,
      phone: updates.phone,
    })
    .where(eq(users.id, id))
    .returning();

  if (!updatedProfile) throw new ResourceNotFoundError("User not found");
  return convertToDto(updatedProfile);
};

const userService = {
  getUser,
  getAllUsers,
  createUser,
  updateProfile,
  deactivateUser,
};

export default userService;
