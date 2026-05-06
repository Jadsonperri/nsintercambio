import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

type Profile = {
  english_level: string | null; ielts_score: number | null; toefl_score: number | null;
  has_passport: boolean | null; has_transcript: boolean | null;
  monthly_income: number | null; monthly_expenses: number | null; current_savings: number | null; budget_goal: number | null;
};

export function ScorePanel() {
  const { user } = useAuth();
  const [p, setP] = useState<Profile | null>(null);
  const [pipelineCount, setPipelineCount] = useState(0);
  const [docsRatio, setDocsRatio] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("english_level, ielts_score, toefl_score, has_passport, has_transcript, monthly_income, monthly_expenses, current_savings, budget_goal").eq("id", user.id).maybeSingle().then(({ data }) => setP(data as Profile));
    supabase.from("pipeline").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setPipelineCount(count || 0));
    supabase.from("documents").select("sent").eq("user_id", user.id).then(({ data }) => {
      if (!data?.length) return setDocsRatio(0);
      setDocsRatio(data.filter((d) => d.sent).length / data.length);
    });
  }, [user]);

  // Score breakdown (0-100)
  const eng = p?.ielts_score ? Math.min(20, (p.ielts_score / 9) * 20) : p?.toefl_score ? Math.min(20, (p.toefl_score / 120) * 20) : p?.english_level === "advanced" ? 15 : p?.english_level === "intermediate" ? 8 : 0;
  const docs = (p?.has_passport ? 8 : 0) + (p?.has_transcript ? 7 : 0) + Math.round(docsRatio * 10);
  const fin = p?.budget_goal && p?.current_savings ? Math.min(25, (p.current_savings / p.budget_goal) * 25) : 0;
  const monthly = (p?.monthly_income || 0) - (p?.monthly_expenses || 0);
  const finFlow = monthly > 0 ? Math.min(10, (monthly / Math.max(1, p?.monthly_income || 1)) * 30) : 0;
  const pipelineScore = Math.min(10, pipelineCount * 2);
  const total = Math.round(eng + docs + fin + finFlow + pipelineScore);

  const tier = total >= 70 ? { label: "Forte", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: CheckCircle2 } :
               total >= 40 ? { label: "Médio", color: "text-amber-600", bg: "bg-amber-500/10", icon: TrendingUp } :
                             { label: "Inicial", color: "text-red-600", bg: "bg-red-500/10", icon: AlertTriangle };
  const Icon = tier.icon;

  const items = [
    { label: "Inglês & testes", value: eng, max: 20 },
    { label: "Documentação", value: docs, max: 25 },
    { label: "Reservas vs meta", value: fin, max: 25 },
    { label: "Fluxo de caixa", value: finFlow, max: 10 },
    { label: "Pipeline ativo", value: pipelineScore, max: 10 },
  ];

  return (
    <div className="space-y-6">
      <Card className={`p-8 ${tier.bg}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium opacity-80"><Brain className="h-4 w-4" /> SCORE DE INTERCÂMBIO</div>
            <div className={`text-7xl font-black mt-2 ${tier.color}`}>{total}<span className="text-2xl text-muted-foreground"> / 100</span></div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-background/60 ${tier.color} font-bold`}>
            <Icon className="h-4 w-4" /> {tier.label}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Composição do score</h3>
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span>{it.label}</span>
              <span className="text-muted-foreground">{Math.round(it.value)} / {it.max}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${(it.value / it.max) * 100}%` }} />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground pt-2">Atualize seu Perfil, Financeiro e CRM para subir o score.</p>
      </Card>
    </div>
  );
}
