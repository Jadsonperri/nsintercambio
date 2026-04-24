import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingUp, AlertTriangle, CheckCircle2, Wallet, Target, Clock } from "lucide-react";

export const Route = createFileRoute("/app/financeiro")({ component: FinanceiroPage });

type Fin = {
  monthly_income: number | null;
  monthly_expenses: number | null;
  current_savings: number | null;
  budget_goal: number | null;
  currency: string;
  usd_rate_override: number | null;
};

function FinanceiroPage() {
  const { user } = useAuth();
  const [fin, setFin] = useState<Fin>({
    monthly_income: null, monthly_expenses: null, current_savings: null, budget_goal: null, currency: "BRL", usd_rate_override: null,
  });
  const [saving, setSaving] = useState(false);
  const [apiRate, setApiRate] = useState<number | null>(null);

  // Cotação efetiva: override manual > API > fallback
  const usdRate = fin.usd_rate_override ?? apiRate;

  useEffect(() => {
    if (!user) return;
    supabase.from("financial_data").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setFin({
        monthly_income: data.monthly_income, monthly_expenses: data.monthly_expenses,
        current_savings: data.current_savings, budget_goal: data.budget_goal,
        currency: data.currency || "BRL",
        usd_rate_override: (data as { usd_rate_override?: number | null }).usd_rate_override ?? null,
      });
    });
    const cached = localStorage.getItem("usd_rate");
    if (cached) {
      const { rate, ts } = JSON.parse(cached);
      if (Date.now() - ts < 86400000) { setApiRate(rate); return; }
    }
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((r) => r.json())
      .then((d) => {
        const rate = d.rates?.BRL;
        if (rate) {
          setApiRate(rate);
          localStorage.setItem("usd_rate", JSON.stringify({ rate, ts: Date.now() }));
        }
      })
      .catch(() => setApiRate(5.0));
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("financial_data").upsert({
      user_id: user.id, ...fin,
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error("Erro ao salvar"); else toast.success("Dados salvos");
  };

  const calc = useMemo(() => {
    const income = fin.monthly_income || 0;
    const expenses = fin.monthly_expenses || 0;
    const savings = fin.current_savings || 0;
    const goal = fin.budget_goal || 0;
    const monthlySaving = income - expenses;
    const remaining = Math.max(0, goal - savings);
    const monthsToGoal = monthlySaving > 0 ? Math.ceil(remaining / monthlySaving) : Infinity;
    const progress = goal > 0 ? Math.min(100, (savings / goal) * 100) : 0;

    let viability: "viable" | "tight" | "unfeasible" = "viable";
    if (monthlySaving <= 0) viability = "unfeasible";
    else if (monthsToGoal > 36) viability = "tight";

    let score = 0;
    if (income > 0) score += 20;
    if (monthlySaving > income * 0.2) score += 25;
    else if (monthlySaving > 0) score += 10;
    if (savings > 0) score += 15;
    if (goal > 0) score += 10;
    if (progress > 25) score += 10;
    if (progress > 50) score += 10;
    if (monthsToGoal !== Infinity && monthsToGoal < 24) score += 10;

    return { monthlySaving, remaining, monthsToGoal, progress, viability, score: Math.min(100, score) };
  }, [fin]);

  const fmt = (n: number) => new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: fin.currency,
  }).format(n);

  const viabilityCfg = {
    viable: { color: "text-emerald-600 bg-emerald-500/10", label: "🟢 Viável", text: "Plano sustentável no ritmo atual" },
    tight: { color: "text-amber-600 bg-amber-500/10", label: "🟡 Ajustável", text: "Precisa otimizar gastos ou aumentar renda" },
    unfeasible: { color: "text-red-600 bg-red-500/10", label: "🔴 Inviável", text: "Gastos superam a renda — meta inalcançável" },
  }[calc.viability];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planejamento Financeiro</h1>
        <p className="text-muted-foreground mt-1">Tudo baseado nos seus dados reais</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="convert">Conversão</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="ai">IA Financeira</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Seus dados</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Moeda</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={fin.currency}
                  onChange={(e) => setFin({ ...fin, currency: e.target.value })}
                >
                  <option value="BRL">BRL — Real</option>
                  <option value="USD">USD — Dólar</option>
                  <option value="CAD">CAD — Dólar Canadense</option>
                </select>
              </div>
              <div />
              <div>
                <Label className="mb-1.5 block">Renda mensal</Label>
                <Input type="number" value={fin.monthly_income ?? ""} onChange={(e) => setFin({ ...fin, monthly_income: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label className="mb-1.5 block">Gastos mensais</Label>
                <Input type="number" value={fin.monthly_expenses ?? ""} onChange={(e) => setFin({ ...fin, monthly_expenses: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label className="mb-1.5 block">Reservas atuais</Label>
                <Input type="number" value={fin.current_savings ?? ""} onChange={(e) => setFin({ ...fin, current_savings: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label className="mb-1.5 block">Meta total do intercâmbio</Label>
                <Input type="number" value={fin.budget_goal ?? ""} onChange={(e) => setFin({ ...fin, budget_goal: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary">
              {saving ? "Salvando..." : "Salvar dados"}
            </Button>
          </Card>

          <div className="grid md:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4" /> Saldo atual</div>
              <div className="text-2xl font-bold mt-2">{fmt(fin.current_savings || 0)}</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Target className="h-4 w-4" /> Falta</div>
              <div className="text-2xl font-bold mt-2">{fmt(calc.remaining)}</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4" /> Poupança/mês</div>
              <div className={`text-2xl font-bold mt-2 ${calc.monthlySaving < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(calc.monthlySaving)}</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> Tempo p/ meta</div>
              <div className="text-2xl font-bold mt-2">{calc.monthsToGoal === Infinity ? "—" : `${calc.monthsToGoal} m`}</div>
            </Card>
          </div>

          <Card className={`p-6 ${viabilityCfg.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium opacity-80">Viabilidade Financeira</div>
                <div className="text-2xl font-bold mt-1">{viabilityCfg.label}</div>
                <p className="text-sm mt-2 opacity-90">{viabilityCfg.text}</p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-80">Score Financeiro</div>
                <div className="text-4xl font-bold">{calc.score}</div>
                <div className="text-xs opacity-70">de 100</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5"><span>Progresso da meta</span><span>{calc.progress.toFixed(0)}%</span></div>
              <div className="h-2 rounded-full bg-background/40 overflow-hidden">
                <div className="h-full bg-current transition-all" style={{ width: `${calc.progress}%` }} />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="convert" className="mt-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Conversão de Moeda</h2>
            <div className="space-y-2">
              <Label className="text-xs">Cotação USD → BRL (editável — sobrescreve a API)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder={apiRate ? `API: ${apiRate.toFixed(2)}` : "Carregando API..."}
                  value={fin.usd_rate_override ?? ""}
                  onChange={(e) => setFin({ ...fin, usd_rate_override: e.target.value ? Number(e.target.value) : null })}
                  className="max-w-[180px]"
                />
                {fin.usd_rate_override && (
                  <Button variant="outline" size="sm" onClick={() => setFin({ ...fin, usd_rate_override: null })}>
                    Usar cotação da API
                  </Button>
                )}
                <Button size="sm" onClick={save} disabled={saving}>Salvar</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Em uso: 1 USD ≈ R$ {usdRate?.toFixed(2) ?? "—"} {fin.usd_rate_override ? "(manual)" : "(API · cache 24h)"}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 bg-muted/30">
                <div className="text-sm text-muted-foreground">Sua reserva em USD</div>
                <div className="text-2xl font-bold mt-1">
                  ${usdRate && fin.current_savings ? (fin.current_savings / usdRate).toFixed(0) : "—"}
                </div>
              </Card>
              <Card className="p-4 bg-muted/30">
                <div className="text-sm text-muted-foreground">Sua meta em USD</div>
                <div className="text-2xl font-bold mt-1">
                  ${usdRate && fin.budget_goal ? (fin.budget_goal / usdRate).toFixed(0) : "—"}
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="mt-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Fluxo de Caixa Projetado</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-emerald-500/10">
                <div className="text-xs text-muted-foreground">Entradas/mês</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">{fmt(fin.monthly_income || 0)}</div>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10">
                <div className="text-xs text-muted-foreground">Saídas/mês</div>
                <div className="text-xl font-bold text-red-600 mt-1">{fmt(fin.monthly_expenses || 0)}</div>
              </div>
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="text-xs text-muted-foreground">Saldo/mês</div>
                <div className="text-xl font-bold text-primary mt-1">{fmt(calc.monthlySaving)}</div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Projeção até a meta</h3>
              {calc.monthsToGoal === Infinity ? (
                <p className="text-sm text-red-600">Sem capacidade de poupança no momento.</p>
              ) : (
                <p className="text-sm">
                  Mantendo o ritmo atual de <strong>{fmt(calc.monthlySaving)}/mês</strong>, você atinge a meta em <strong>{calc.monthsToGoal} meses</strong>.
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              {calc.viability === "viable" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
              Análise IA
            </h2>
            {fin.monthly_income === null && fin.budget_goal === null ? (
              <p className="text-muted-foreground">Preencha seus dados financeiros acima para receber análise.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-medium">Situação atual</div>
                  <p className="text-muted-foreground">
                    Você possui {fmt(fin.current_savings || 0)} de reservas, com poupança mensal de {fmt(calc.monthlySaving)}.
                    {fin.budget_goal ? ` Sua meta é de ${fmt(fin.budget_goal)}.` : ""}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Problema principal</div>
                  <p className="text-muted-foreground">
                    {calc.viability === "unfeasible" && "Seus gastos igualam ou superam sua renda — sem poupança não há como atingir a meta."}
                    {calc.viability === "tight" && `O ritmo atual leva ${calc.monthsToGoal} meses — considere reduzir gastos ou buscar bolsa.`}
                    {calc.viability === "viable" && "Nenhum bloqueio crítico identificado. Continue o ritmo."}
                  </p>
                </div>
                <div>
                  <div className="font-medium">Recomendação</div>
                  <p className="text-muted-foreground">
                    {calc.viability === "unfeasible" && "Reduza gastos fixos em pelo menos 20% ou busque renda extra. Reavalie meta."}
                    {calc.viability === "tight" && "Aumente poupança em 30% ou avalie estados/províncias com custo de vida menor."}
                    {calc.viability === "viable" && "Mantenha disciplina e avance no pipeline de faculdades."}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
