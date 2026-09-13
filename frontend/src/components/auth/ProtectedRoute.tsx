import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "@/components/common/States";

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/chat" replace />;
  return <Outlet />;
}
