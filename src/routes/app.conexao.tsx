import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "./app.dashboard";
export const Route = createFileRoute("/app/conexao")({
  component: () => <Stub title="Conexão" desc="CRM de comunicação com universidades (emails, follow-ups, IA) na próxima iteração." />,
});
