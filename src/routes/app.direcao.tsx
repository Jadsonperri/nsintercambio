import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "./app.dashboard";
export const Route = createFileRoute("/app/direcao")({
  component: () => <Stub title="Direção Estratégica" desc="Painel executivo com resumo IA, foco global, estratégia de aplicação e alertas na próxima iteração." />,
});
