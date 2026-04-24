import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Brain, MessageSquare, Gauge, Compass, Search, GitCompare, ListChecks } from "lucide-react";

export const Route = createFileRoute("/app/ia")({ component: IaPage });

function IaPage() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Brain className="h-7 w-7 text-primary" /> Estratégia & IA</h1>
        <p className="text-muted-foreground mt-1">Análises personalizadas com base nos seus dados reais.</p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1.5" /> Chat</TabsTrigger>
          <TabsTrigger value="score"><Gauge className="h-4 w-4 mr-1.5" /> Score & Simulação</TabsTrigger>
          <TabsTrigger value="direcao"><Compass className="h-4 w-4 mr-1.5" /> Direção</TabsTrigger>
          <TabsTrigger value="analise"><Search className="h-4 w-4 mr-1.5" /> Análise</TabsTrigger>
          <TabsTrigger value="comparador"><GitCompare className="h-4 w-4 mr-1.5" /> Comparador</TabsTrigger>
          <TabsTrigger value="plano"><ListChecks className="h-4 w-4 mr-1.5" /> Plano de Ação</TabsTrigger>
        </TabsList>

        {["chat", "score", "direcao", "analise", "comparador", "plano"].map((k) => (
          <TabsContent key={k} value={k} className="mt-6">
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground">Em construção — próxima iteração.</p>
              <p className="text-xs text-muted-foreground mt-2">Complete seu perfil para destravar análises personalizadas.</p>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
