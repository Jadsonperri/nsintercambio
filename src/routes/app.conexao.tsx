import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/app/conexao")({
  component: () => (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Conexão</h1>
      <Card className="p-8 text-center border-dashed">
        <Construction className="h-10 w-10 mx-auto text-primary mb-3" />
        <p className="text-muted-foreground">Log de emails, contatos universitários e follow-up inteligente — em construção.</p>
      </Card>
    </div>
  ),
});
