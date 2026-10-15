import type { Actor } from "../auth/auth.types.js";
import type { UserRow } from "./users.types.js";

const isAdmin = (actor: Actor): boolean => {
  if (actor.platformRole === "admin") return true;
  return false;
};

const isSelf = (actor: Actor, user: UserRow): boolean => {
  if (actor.id === user.id) return true;
  return false;
};

const canViewUser = (actor: Actor, user: UserRow): boolean => {
  if (isAdmin(actor)) return true;
  if (isSelf(actor, user)) return true;
  return false;
};

const canUpdateProfile = (actor: Actor, user: UserRow): boolean => {
  if (isAdmin(actor)) return true;
  if (isSelf(actor, user)) return true;
  return false;
};

const userPolicy = {
  canViewUser,
  canUpdateProfile,
};

export default userPolicy;
