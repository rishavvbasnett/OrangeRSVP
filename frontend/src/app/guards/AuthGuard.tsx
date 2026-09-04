import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../../features/auth/stores/useAuthStore.ts";

const AuthGuard = () => {
  const loggedUser = useAuthStore.getState().loggedUser;
  if (!loggedUser) {
    <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default AuthGuard;
