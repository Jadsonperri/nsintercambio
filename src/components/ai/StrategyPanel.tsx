import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Target, Loader2, Sparkles } from "lucide-react";
import { aiChat } from "@/server/ai-chat.functions";
import { toast } from "sonner";

export function StrategyPanel() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ safe: 0, mid: 0, risky: 0, total: 0 });
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("pipeline").select("universities(acceptance_chance)").eq("user_id", user.id).then(({ data }) => {
      let safe = 0, mid = 0, risky = 0;
      (data || []).forEach((row: any) => {
        const c = (row.universities?.acceptance_chance || "").toLowerCase();
        if (c.includes("alta") || c.includes("high")) safe++;
        else if (c.includes("média") || c.includes("medium") || c.includes("media")) mid++;
        else if (c.includes("baixa") || c.includes("low")) risky++;
      });
      setCounts({ safe, mid, risky, total: data?.length || 0 });
    });
  }, [user]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await aiChat({ data: { messages: [{ role: "user", content: "Gere uma análise estratégica de 3-5 bullets sobre meu portfólio de universidades (seguras/médias/arriscadas), gaps no perfil e próximos passos críticos. Seja direto e prático." }] } });
      setAnalysis(res.reply);
      if (res.error) toast.error(res.reply);
    } finally { setLoading(false); }
  };

  const balance = counts.total === 0 ? "vazio" :
    counts.safe >= counts.risky && counts.mid > 0 ? "equilibrado" :
    counts.risky > counts.safe + counts.mid ? "muito arriscado" : "concentrado";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Distribuição estratégica</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-5 text-center">
            <div className="text-3xl font-black text-emerald-600">{counts.safe}</div>
            <div className="text-xs font-bold text-emerald-700/80 mt-1">SEGURAS</div>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-5 text-center">
            <div className="text-3xl font-black text-amber-600">{counts.mid}</div>
            <div className="text-xs font-bold text-amber-700/80 mt-1">MÉDIAS</div>
          </div>
          <div className="rounded-xl bg-red-500/10 p-5 text-center">
            <div className="text-3xl font-black text-red-600">{counts.risky}</div>
            <div className="text-xs font-bold text-red-700/80 mt-1">ARRISCADAS</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Portfólio <strong className="text-foreground">{balance}</strong> ({counts.total} universidades no pipeline).
          {counts.total > 0 && counts.safe === 0 && " Recomendamos adicionar pelo menos 2 opções seguras."}
        </p>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Análise estratégica IA</h3>
          </div>
          <Button onClick={generate} disabled={loading} size="sm" className="bg-gradient-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analisando..." : "Gerar análise"}
          </Button>
        </div>
        {analysis ? (
          <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/40 rounded-lg p-4">{analysis}</div>
        ) : (
          <p className="text-sm text-muted-foreground">Clique em "Gerar análise" para receber recomendações com base nos seus dados reais.</p>
        )}
      </Card>
    </div>
  );
}
