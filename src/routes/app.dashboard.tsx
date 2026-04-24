import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Plus, Check, MapPin, Target, TrendingUp, Activity, AlertTriangle, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/dashboard")({ component: DashboardPage });

type Uni = {
  id: string; name: string; country: string; state: string; city: string | null;
  type: string; nature: string; division: string | null;
  estimated_cost_usd: number | null; scholarship_available: boolean;
  acceptance_chance: string | null;
};

type PipeRow = { id: string; status: string; university_id: string };

function DashboardPage() {
  const { user, profile } = useAuth();
  const [unis, setUnis] = useState<Uni[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [pipe, setPipe] = useState<PipeRow[]>([]);
  const [budget, setBudget] = useState<number | null>(null);

  const refresh = async () => {
    if (!user) return;
    const [{ data: u }, { data: f }, { data: p }, { data: fin }] = await Promise.all([
      supabase.from("universities").select("*"),
      supabase.from("favorites").select("university_id").eq("user_id", user.id),
      supabase.from("pipeline").select("id, status, university_id").eq("user_id", user.id),
      supabase.from("financial_data").select("budget_goal").eq("user_id", user.id).maybeSingle(),
    ]);
    setUnis((u as Uni[]) ?? []);
    setFavIds(new Set((f ?? []).map((r: { university_id: string }) => r.university_id)));
    setPipe((p as PipeRow[]) ?? []);
    setBudget(fin?.budget_goal ?? null);
  };

  useEffect(() => { refresh(); }, [user]);

  // Progresso real (5 fontes)
  const progress = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      !!profile.full_name && !!(profile as Record<string, unknown>).age,
      !!(profile as Record<string, unknown>).english_level && !!(profile as Record<string, unknown>).education_level,
      favIds.size > 0,
      pipe.length > 0,
      !!budget,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile, favIds, pipe, budget]);

  // Rankings
  const ranked = useMemo(() => {
    const cheap = [...unis].filter(u => u.estimated_cost_usd).sort((a, b) => (a.estimated_cost_usd! - b.estimated_cost_usd!));
    const highChance = [...unis].filter(u => u.acceptance_chance === "high");
    const recommended = [...unis]
      .filter(u => budget ? (u.estimated_cost_usd ?? 0) <= budget * 1.3 : true)
      .sort((a, b) => {
        const sa = (a.acceptance_chance === "high" ? 2 : a.acceptance_chance === "medium" ? 1 : 0) + (a.scholarship_available ? 1 : 0);
        const sb = (b.acceptance_chance === "high" ? 2 : b.acceptance_chance === "medium" ? 1 : 0) + (b.scholarship_available ? 1 : 0);
        return sb - sa;
      });
    return { cheap: cheap.slice(0, 10), highChance: highChance.slice(0, 10), recommended: recommended.slice(0, 10) };
  }, [unis, budget]);

  // Pipeline summary
  const pipeSummary = useMemo(() => {
    const groups: Record<string, number> = { interest: 0, email_sent: 0, response: 0, applied: 0, accepted: 0 };
    pipe.forEach(p => { groups[p.status] = (groups[p.status] ?? 0) + 1; });
    return groups;
  }, [pipe]);

  // Estratégia
  const strategy = useMemo(() => {
    const inPipe = unis.filter(u => pipe.some(p => p.university_id === u.id));
    const safe = inPipe.filter(u => u.acceptance_chance === "high").length;
    const balanced = inPipe.filter(u => u.acceptance_chance === "medium").length;
    const risky = inPipe.filter(u => u.acceptance_chance === "low").length;
    return { safe, balanced, risky };
  }, [unis, pipe]);

  // Próximo passo único + risco
  const nextStep = useMemo(() => {
    if (progress < 30) return { step: "Complete seu perfil para destravar análises reais", risk: "high" as const };
    if (favIds.size === 0) return { step: "Marque suas primeiras faculdades favoritas", risk: "medium" as const };
    if (pipe.length === 0) return { step: "Adicione faculdades ao pipeline", risk: "medium" as const };
    if (!budget) return { step: "Defina sua meta financeira no Financeiro", risk: "medium" as const };
    if (pipeSummary.email_sent === 0) return { step: "Envie o primeiro email para uma universidade", risk: "low" as const };
    return { step: "Continue avançando: aplicar nas universidades em pipeline", risk: "low" as const };
  }, [progress, favIds, pipe, budget, pipeSummary]);

  const toggleFav = async (uId: string) => {
    if (!user) return;
    if (favIds.has(uId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("university_id", uId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, university_id: uId });
      toast.success("Favoritada ⭐");
    }
    refresh();
  };

  const addToPipe = async (uId: string) => {
    if (!user || pipe.some(p => p.university_id === uId)) return;
    await supabase.from("pipeline").insert({ user_id: user.id, university_id: uId, status: "interest" });
    toast.success("No pipeline");
    refresh();
  };

  const targetCountry = (profile as Record<string, unknown>)?.target_country as string | undefined;
  const mainGoal = (profile as Record<string, unknown>)?.main_goal as string | undefined;
  const focusText = targetCountry && mainGoal
    ? `${mainGoal === "sport" ? "Esporte" : mainGoal === "study" ? "Estudo" : "Híbrido"} · ${targetCountry === "USA" ? "EUA" : targetCountry === "CANADA" ? "Canadá" : "EUA & Canadá"}`
    : "Defina seu objetivo no Perfil";

  const riskColor = nextStep.risk === "high" ? "text-destructive" : nextStep.risk === "medium" ? "text-warning" : "text-success";
  const riskEmoji = nextStep.risk === "high" ? "🔴" : nextStep.risk === "medium" ? "🟡" : "🟢";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">Tudo baseado nos seus dados reais.</p>
      </div>

      {/* Foco Global + Próximo Passo (sempre visíveis) */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-1 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary font-semibold">
            <Target className="h-4 w-4" /> Foco Global
          </div>
          <div className="text-lg font-bold mt-2">{focusText}</div>
          <Link to="/app/perfil" className="text-xs text-primary mt-2 inline-block hover:underline">Ajustar →</Link>
        </Card>

        <Card className="p-5 md:col-span-2 border-accent/30 bg-accent/5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-accent-foreground font-semibold">
            <Sparkles className="h-4 w-4" /> Próximo Passo Único
          </div>
          <div className="text-lg font-semibold mt-2">{nextStep.step}</div>
          <div className={`text-xs mt-2 ${riskColor}`}>{riskEmoji} Risco: {nextStep.risk === "high" ? "Alto" : nextStep.risk === "medium" ? "Médio" : "Baixo"}</div>
        </Card>
      </div>

      {/* Progresso Real */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold">Progresso real</div>
            <div className="text-xs text-muted-foreground">Perfil · Favoritos · Pipeline · Financeiro · Atividade</div>
          </div>
          <div className="text-3xl font-bold text-primary">{progress}%</div>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {/* Painel de Decisão Final */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Você deve aplicar agora?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {progress < 50 && "❌ Ainda não. Seu perfil precisa estar mais completo para decisões estratégicas."}
              {progress >= 50 && progress < 80 && "🟡 Parcial. Continue preparando documentos e financeiro antes de aplicar."}
              {progress >= 80 && pipeSummary.email_sent === 0 && "🟡 Quase. Comece o contato com universidades antes de aplicar."}
              {progress >= 80 && pipeSummary.email_sent > 0 && "✅ Sim, pode iniciar aplicações nas universidades de melhor encaixe."}
            </p>
          </div>
        </div>
      </Card>

      {/* Pipeline summary + Estratégia */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Resumo do Pipeline</h3>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            {([["interest", "Interesse"], ["email_sent", "Email"], ["response", "Resposta"], ["applied", "Aplicado"], ["accepted", "Aceito"]] as const).map(([k, l]) => (
              <div key={k}>
                <div className="text-2xl font-bold">{pipeSummary[k] ?? 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{l}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Estratégia de Aplicação</h3>
          </div>
          {pipe.length === 0 ? (
            <p className="text-sm text-muted-foreground">Adicione faculdades ao pipeline para ver sua estratégia.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-lg bg-success/10"><div className="text-xl font-bold text-success">{strategy.safe}</div><div className="text-xs">🟢 Seguras</div></div>
              <div className="p-3 rounded-lg bg-warning/10"><div className="text-xl font-bold text-warning">{strategy.balanced}</div><div className="text-xs">🟡 Médias</div></div>
              <div className="p-3 rounded-lg bg-destructive/10"><div className="text-xl font-bold text-destructive">{strategy.risky}</div><div className="text-xs">🔴 Arriscadas</div></div>
            </div>
          )}
        </Card>
      </div>

      {/* Rankings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-lg">Rankings de Universidades</h2>
        </div>
        <Tabs defaultValue="recommended">
          <TabsList>
            <TabsTrigger value="recommended">Recomendadas</TabsTrigger>
            <TabsTrigger value="cheap">Mais baratas</TabsTrigger>
            <TabsTrigger value="chance">Por chance</TabsTrigger>
          </TabsList>
          {([["recommended", ranked.recommended], ["cheap", ranked.cheap], ["chance", ranked.highChance]] as const).map(([k, list]) => (
            <TabsContent key={k} value={k} className="mt-4 space-y-2">
              {list.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Sem dados suficientes ainda.</p>
              ) : list.map((u, i) => {
                const isFav = favIds.has(u.id);
                const inPipe = pipe.some(p => p.university_id === u.id);
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`;
                return (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-smooth">
                    <div className="w-10 text-center font-bold text-sm">{medal}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {u.state}, {u.country === "USA" ? "EUA" : "CA"} · ${u.estimated_cost_usd?.toLocaleString() ?? "—"}/ano
                      </div>
                    </div>
                    <button onClick={() => toggleFav(u.id)} className="p-1.5 rounded hover:bg-muted">
                      <Star className={`h-4 w-4 ${isFav ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </button>
                    <Button size="sm" variant={inPipe ? "secondary" : "outline"} disabled={inPipe} onClick={() => addToPipe(u.id)}>
                      {inPipe ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Alertas */}
      {progress < 30 && (
        <Card className="p-5 border-warning/30 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">Dados insuficientes para análises completas</div>
              <p className="text-sm text-muted-foreground mt-1">Complete seu perfil para que a IA possa gerar recomendações personalizadas.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
