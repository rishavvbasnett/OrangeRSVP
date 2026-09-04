import { create } from "zustand";
import type { AuthState, LoggedUser } from "../auth.types.ts";
import { createJSONStorage, persist } from "zustand/middleware";

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      loggedUser: null,
      setLoggedUser: (newUser: LoggedUser) =>
        set({
          loggedUser: newUser,
        }),
      logout: () => ({
        loggedUser: null,
      }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useAuthStore;
