import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Target, AlertCircle, GraduationCap, ListChecks } from "lucide-react";

export const Route = createFileRoute("/app/")({ component: HomePage });

function HomePage() {
  const { profile, user } = useAuth();
  const [favCount, setFavCount] = useState(0);
  const [pipeCount, setPipeCount] = useState(0);
  const [profileFilled, setProfileFilled] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: fc }, { count: pc }, { data: p }] = await Promise.all([
        supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("pipeline").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      setFavCount(fc ?? 0);
      setPipeCount(pc ?? 0);
      if (p) {
        const fields = ["age", "country", "english_level", "education_level", "target_country", "main_goal", "monthly_income", "budget_goal"];
        const filled = fields.filter((f) => (p as Record<string, unknown>)[f]).length;
        setProfileFilled(Math.round((filled / fields.length) * 100));
      }
    })();
  }, [user]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const health = profileFilled < 30 ? "🔴" : profileFilled < 70 ? "🟡" : "🟢";

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-hero p-8 text-primary-foreground shadow-elegant relative overflow-hidden">
        <div className="absolute inset-0 bg-glow opacity-40" />
        <div className="relative">
          <div className="text-sm opacity-80">{greeting}, {profile?.full_name?.split(" ")[0] ?? "viajante"} 👋</div>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            {profileFilled < 50 ? "Planeje seu futuro fora do país" : "Você está no caminho certo"}
          </h1>
          <p className="mt-2 opacity-90 max-w-xl">
            {profileFilled < 50
              ? "Complete seu perfil para destravar recomendações personalizadas e seu score de prontidão."
              : "Continue avançando no seu pipeline para se aproximar da aplicação."}
          </p>
          {profileFilled < 50 && (
            <Button asChild className="mt-4 bg-background text-foreground hover:bg-background/90">
              <Link to="/app/perfil">Completar perfil <Sparkles className="ml-2 h-4 w-4" /></Link>
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2"><Star className="h-5 w-5 text-accent" /><h3 className="font-semibold">Favoritas</h3></div>
          <div className="text-3xl font-bold">{favCount}</div>
          <Link to="/app/faculdades" className="text-xs text-primary mt-2 inline-block">Ver faculdades →</Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2"><ListChecks className="h-5 w-5 text-primary" /><h3 className="font-semibold">Pipeline</h3></div>
          <div className="text-3xl font-bold">{pipeCount}</div>
          <Link to="/app/execucao" className="text-xs text-primary mt-2 inline-block">Ver pipeline →</Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-2"><Target className="h-5 w-5 text-success" /><h3 className="font-semibold">Saúde do Plano</h3></div>
          <div className="text-3xl font-bold">{health} {profileFilled}%</div>
          <div className="text-xs text-muted-foreground mt-2">Com base no seu perfil</div>
        </Card>
      </div>

      {/* Próximo passo */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">🔥 Próximo Passo</h3>
            <p className="text-sm text-muted-foreground">
              {profileFilled < 30 && "Comece preenchendo seu perfil — é a base de toda a inteligência do sistema."}
              {profileFilled >= 30 && profileFilled < 70 && "Adicione faculdades aos favoritos para começar seu pipeline."}
              {profileFilled >= 70 && favCount === 0 && "Explore as faculdades e marque suas preferidas."}
              {profileFilled >= 70 && favCount > 0 && pipeCount === 0 && "Mova faculdades para o pipeline e inicie o contato."}
              {profileFilled >= 70 && pipeCount > 0 && "Acompanhe seu pipeline e envie emails para as universidades."}
            </p>
          </div>
        </div>
      </Card>

      {/* Foco mensal placeholder */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Foco do mês</h3>
          <p className="text-sm text-muted-foreground">
            {profileFilled < 50 ? "Ainda sem foco definido. Complete o perfil para a IA gerar sua prioridade." : "Avance no preenchimento dos dados financeiros para liberar simulações."}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-warning" /> Alertas</h3>
          <p className="text-sm text-muted-foreground">
            {profileFilled < 30 ? "Nenhum dado suficiente para análise." : "Tudo em dia. Continue avançando."}
          </p>
        </Card>
      </div>

      <Card className="p-6 border-dashed">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Versão inicial.</strong> Próximos módulos sendo construídos: IA estratégica completa, score com simulação dinâmica, planejamento financeiro avançado, CRM Kanban inteligente e comunidade.
          </div>
        </div>
      </Card>
    </div>
  );
}
