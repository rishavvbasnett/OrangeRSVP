import { createBrowserRouter } from "react-router-dom";
import LoginForm from "../features/auth/components/LoginForm.tsx";
import NotFound from "../shared/components/NotFound.tsx";
import AuthGuard from "./guards/AuthGuard.tsx";

const router = createBrowserRouter([
  { path: "/login", element: <LoginForm /> },
  { path: "*", element: <NotFound /> },
  { element: <AuthGuard />, children: [] },
]);

export default router;
