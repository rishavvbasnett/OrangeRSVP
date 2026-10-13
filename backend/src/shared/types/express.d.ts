import type { AuthenticatedUser } from "../../features/auth/auth.types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
