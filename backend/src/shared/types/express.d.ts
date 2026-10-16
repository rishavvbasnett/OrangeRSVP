import type {
  Actor,
  AuthenticatedUser,
} from "../../features/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user: AuthenticatedUser;
      actor: Actor;
    }
  }
}

export {};
