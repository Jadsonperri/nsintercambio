import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "./app.dashboard";
export const Route = createFileRoute("/app/financeiro")({
  component: () => <Stub title="Planejamento Financeiro" desc="Visão geral, conversão de moeda, fluxo de caixa, custo de vida, simulador, IA financeira e score na próxima iteração." />,
});
