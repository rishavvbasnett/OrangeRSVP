import { useMutation } from "@tanstack/react-query";
import useAuthStore from "../stores/useAuthStore.ts";
import loginApi from "../api/loginApi.ts";
import type { LoggedUser } from "../auth.types.ts";

const useLogin = () => {
  return useMutation({
    mutationFn: loginApi.login,

    onSuccess: (loggedUser: LoggedUser) => {
      useAuthStore.getState().setLoggedUser(loggedUser);
    },
  });
};

export default useLogin;
