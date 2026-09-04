import { Outlet } from "react-router-dom";
import useAuthStore from "../../features/auth/stores/useAuthStore.ts";
import type { rolesProp } from "../../features/auth/auth.types.ts";
import NotFound from "../../shared/components/NotFound.tsx";

const RoleGuard = ({ allowedRoles }: { allowedRoles: rolesProp }) => {
  const loggedUser = useAuthStore.getState().loggedUser;
  if (
    loggedUser?.role &&
    allowedRoles.includes(loggedUser.role as rolesProp[number])
  ) {
    return <Outlet />;
  } else {
    return <NotFound />;
  }
};

export default RoleGuard;
