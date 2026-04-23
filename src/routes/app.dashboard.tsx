import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({
  component: () => <Stub title="Visão Geral" desc="Progresso, rankings, mapa e insights da IA serão construídos na próxima iteração." />,
});

export function Stub({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <Card className="p-8 text-center border-dashed">
        <Construction className="h-10 w-10 mx-auto text-primary mb-3" />
        <p className="text-muted-foreground">{desc}</p>
      </Card>
    </div>
  );
}
