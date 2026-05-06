import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Brain, MessageSquare, Calculator, Wallet, Gauge, Layers } from "lucide-react";
import { z } from "zod";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { ScorePanel } from "@/components/ai/ScorePanel";
import { StrategyPanel } from "@/components/ai/StrategyPanel";
import { SimuladorPage } from "./app.simulador";
import { FinanceiroPage } from "./app.financeiro";

const searchSchema = z.object({ tab: z.enum(["chat", "simulador", "financeiro", "score", "estrategia"]).optional() });

export const Route = createFileRoute("/app/ia")({
  component: IaPage,
  validateSearch: (s) => searchSchema.parse(s),
});

function IaPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState(search.tab || "estrategia");

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Brain className="h-7 w-7 text-primary" /> Estratégia & IA</h1>
        <p className="text-muted-foreground mt-1">Análise, recomendação e estratégia</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="flex-wrap h-auto p-1.5">
          <TabsTrigger value="estrategia"><Layers className="h-4 w-4 mr-1.5" /> Estratégia</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1.5" /> Chat IA</TabsTrigger>
          <TabsTrigger value="score"><Gauge className="h-4 w-4 mr-1.5" /> Score</TabsTrigger>
          <TabsTrigger value="simulador"><Calculator className="h-4 w-4 mr-1.5" /> Simulador</TabsTrigger>
          <TabsTrigger value="financeiro"><Wallet className="h-4 w-4 mr-1.5" /> Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="estrategia" className="mt-6"><StrategyPanel /></TabsContent>
        <TabsContent value="chat" className="mt-6"><AIChatPanel /></TabsContent>
        <TabsContent value="score" className="mt-6"><ScorePanel /></TabsContent>
        <TabsContent value="simulador" className="mt-2 -mx-6 md:-mx-8"><SimuladorPage /></TabsContent>
        <TabsContent value="financeiro" className="mt-2 -mx-6 md:-mx-8"><FinanceiroPage /></TabsContent>
      </Tabs>
    </div>
  );
}
