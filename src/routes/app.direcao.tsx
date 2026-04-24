import { createFileRoute, redirect } from "@tanstack/react-router";

// "Direção Estratégica" foi unificada em "Estratégia & IA"
export const Route = createFileRoute("/app/direcao")({
  beforeLoad: () => { throw redirect({ to: "/app/ia" }); },
  component: () => null,
});
