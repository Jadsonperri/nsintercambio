import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedShell } from "@/components/AppLayout";

export const Route = createFileRoute("/app")({
  component: () => <ProtectedShell><Outlet /></ProtectedShell>,
});
