import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "./app.dashboard";
export const Route = createFileRoute("/app/ia")({
  component: () => <Stub title="Estratégia de Inteligência" desc="Chat IA, Score + Simulação, Análise de Faculdade, Comparador, Plano de Ação e Modos da IA na próxima iteração." />,
});
