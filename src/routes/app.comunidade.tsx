import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "./app.dashboard";
export const Route = createFileRoute("/app/comunidade")({
  component: () => <Stub title="Comunidade" desc="Feed controlado de conquistas, badges e interações na próxima iteração." />,
});
