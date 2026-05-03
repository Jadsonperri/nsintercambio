import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  GraduationCap, Compass, ClipboardList, Sparkles, ArrowRight, Star,
  Search, Globe, MapPin, DollarSign, Lock, Trophy, Plane, ChevronRight, Users,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

type UniPreview = {
  id: string; name: string; country: string; state: string; city: string | null;
  estimated_cost_usd: number | null; scholarship_available: boolean;
  acceptance_chance: string | null;
};

type CommunityPost = {
  id: string;
  content: string;
  achievement_type: string;
  badge: string | null;
  created_at: string;
};

function useCountUp(target: number, duration = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [uniCount, setUniCount] = useState(500);
  const [topUnis, setTopUnis] = useState<UniPreview[]>([]);
  const [stories, setStories] = useState<CommunityPost[]>([]);

  useEffect(() => { if (!loading && user) navigate({ to: "/app" }); }, [user, loading, navigate]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    (async () => {
      const [{ count }, { data: top }, { data: posts }] = await Promise.all([
        supabase.from("universities").select("id", { count: "exact", head: true }),
        supabase
          .from("universities")
          .select("id,name,country,state,city,estimated_cost_usd,scholarship_available,acceptance_chance")
          .eq("acceptance_chance", "high")
          .eq("scholarship_available", true)
          .limit(5),
        supabase
          .from("community_posts")
          .select("id,content,achievement_type,badge,created_at")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);
      if (typeof count === "number" && count > 0) setUniCount(count);
      setTopUnis((top as UniPreview[]) ?? []);
      setStories((posts as CommunityPost[]) ?? []);
    })();
  }, []);

  const animUnis = useCountUp(uniCount);
  const animCountries = useCountUp(40);
  const animStudents = useCountUp(10000);

  const pillars = [
    {
      icon: GraduationCap,
      title: "Universidades",
      tag: "Descoberta",
      desc: "Mais de 6.000 instituições reais nos EUA e Canadá. Mapa interativo, filtros inteligentes e ranking de chances.",
      color: "from-[oklch(0.62_0.22_305)] to-[oklch(0.48_0.22_295)]",
    },
    {
      icon: Plane,
      title: "Intercâmbio",
      tag: "Caminho",
      desc: "Pipeline de inscrições, contato com técnicos e coordenadores, modelos de e-mail e checklists guiados.",
      color: "from-[oklch(0.72_0.20_38)] to-[oklch(0.62_0.22_305)]",
    },
    {
      icon: ClipboardList,
      title: "Planejamento",
      tag: "Estratégia",
      desc: "Score acadêmico-esportivo, próximos passos com IA, finanças e metas com prazos — tudo em um só lugar.",
      color: "from-[oklch(0.63_0.20_255)] to-[oklch(0.62_0.22_305)]",
    },
  ];

  const newsCards = [
    {
      tag: "Ranking",
      tagColor: "bg-[oklch(0.62_0.22_305)]/15 text-[oklch(0.62_0.22_305)] border-[oklch(0.62_0.22_305)]/30",
      title: "As 10 melhores universidades dos EUA para atletas brasileiros em 2026",
      date: "Atualizado esta semana",
      icon: Trophy,
    },
    {
      tag: "Intercâmbio",
      tagColor: "bg-[oklch(0.72_0.20_38)]/15 text-[oklch(0.72_0.20_38)] border-[oklch(0.72_0.20_38)]/30",
      title: "Prazos NCAA D1 2026/27: deadlines críticos que você não pode perder",
      date: "Guia completo",
      icon: Plane,
    },
    {
      tag: "IA",
      tagColor: "bg-[oklch(0.63_0.20_255)]/15 text-[oklch(0.63_0.20_255)] border-[oklch(0.63_0.20_255)]/30",
      title: "Como nossa IA recomenda as 5 universidades certas para o seu perfil",
      date: "Funcionalidade",
      icon: Sparkles,
    },
    {
      tag: "Planejamento",
      tagColor: "bg-success/15 text-success border-success/30",
      title: "Planejamento financeiro: quanto custa estudar 1 ano nos EUA em 2026",
      date: "Análise",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* NAVBAR */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-background/75 border-b border-border shadow-sm"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto max-w-7xl flex items-center justify-between px-5 py-3">
          <Logo variant={scrolled ? "auto" : "light"} />
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Universidades", href: "#universidades" },
              { label: "Intercâmbio", href: "#intercambio" },
              { label: "Planejamento", href: "#planejamento" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-smooth ${
                  scrolled ? "text-foreground/80 hover:text-foreground hover:bg-muted" : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild className={scrolled ? "" : "text-white hover:text-white hover:bg-white/10"}>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-[oklch(0.72_0.20_38)] to-[oklch(0.68_0.22_25)] text-white shadow-glow hover:opacity-95 hover-scale border-0"
            >
              <Link to="/signup">
                Começar agora <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* HERO — DARK */}
      <section className="relative overflow-hidden bg-mesh-dark text-white pt-28 md:pt-36 pb-24 md:pb-32">
        {/* animated plane */}
        <div className="pointer-events-none absolute top-[18%] left-0 right-0 opacity-40">
          <Plane className="h-6 w-6 text-white animate-plane" />
        </div>
        <div className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-[oklch(0.72_0.20_38)]/30 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-[28rem] w-[28rem] rounded-full bg-[oklch(0.62_0.22_305)]/30 blur-3xl animate-pulse [animation-delay:600ms]" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-[oklch(0.63_0.20_255)]/25 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 text-center lg:text-left animate-in fade-in slide-in-from-bottom-3 duration-700">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase text-white/95">
              <Sparkles className="h-3.5 w-3.5 text-[oklch(0.78_0.18_60)]" />
              Universidades · Intercâmbio · Planejamento
            </div>

            <h1 className="font-display mt-6 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight">
              Sua jornada para as{" "}
              <span className="bg-gradient-to-r from-[oklch(0.85_0.18_60)] via-[oklch(0.78_0.20_320)] to-[oklch(0.78_0.18_240)] bg-clip-text text-transparent">
                melhores universidades
              </span>{" "}
              do mundo começa aqui.
            </h1>

            <p className="mt-5 text-base md:text-lg text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Descubra universidades, planeje seu intercâmbio e construa sua estratégia acadêmica e esportiva — com IA que entende o seu perfil.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                size="lg"
                asChild
                className="h-12 px-6 bg-gradient-to-r from-[oklch(0.72_0.20_38)] to-[oklch(0.68_0.22_25)] text-white shadow-glow hover:opacity-95 hover-scale border-0 text-base"
              >
                <Link to="/signup">
                  Começar agora <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-6 bg-white/5 border-white/30 text-white hover:bg-white/10 hover:text-white text-base"
              >
                <a href="#universidades">Explorar universidades</a>
              </Button>
            </div>

          </div>

          {/* Floating preview dashboard */}
          <div className="lg:col-span-5 relative animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
            <div className="relative rounded-2xl bg-white/95 text-foreground p-5 shadow-2xl ring-1 ring-white/40 backdrop-blur-xl rotate-[-1.5deg] hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Painel ao vivo</span>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl bg-gradient-to-br from-[oklch(0.62_0.22_305)]/15 to-[oklch(0.62_0.22_305)]/5 p-2.5 border border-primary/10">
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase">Score</div>
                  <div className="text-xl font-bold text-primary font-display">82</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[oklch(0.72_0.20_38)]/15 to-[oklch(0.72_0.20_38)]/5 p-2.5 border border-accent/10">
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase">Faculdades</div>
                  <div className="text-xl font-bold text-accent font-display">14</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-[oklch(0.63_0.20_255)]/15 to-[oklch(0.63_0.20_255)]/5 p-2.5 border border-[oklch(0.63_0.20_255)]/20">
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase">Bolsas</div>
                  <div className="text-xl font-bold text-[oklch(0.63_0.20_255)] font-display">7</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { uni: "Stanford University", state: "CA", chance: "Alta" },
                  { uni: "University of Toronto", state: "ON", chance: "Alta" },
                  { uni: "UCLA", state: "CA", chance: "Média" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold truncate">{row.uni}</div>
                      <div className="text-[9px] text-muted-foreground">{row.state}</div>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${row.chance === "Alta" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                      {row.chance}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-[oklch(0.72_0.20_38)]/10 to-[oklch(0.62_0.22_305)]/10 p-2 border border-accent/20">
                <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
                <span className="text-[10px] text-foreground">Próximo passo: enviar email para Stanford</span>
              </div>
            </div>

            {/* floating mini cards */}
            <div className="absolute -top-4 -right-2 rounded-xl bg-white px-3 py-2 shadow-2xl ring-1 ring-black/5 animate-float-slow">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.72_0.20_38)] to-[oklch(0.62_0.22_305)] flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-[9px] text-muted-foreground font-semibold uppercase">IA sugere</div>
                  <div className="text-[11px] font-bold text-foreground">Top 5 prontas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS COUNTERS */}
      <section className="relative -mt-12 z-10 px-5">
        <div className="mx-auto max-w-5xl rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-elegant p-6 md:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
          {[
            { v: animUnis, suffix: "+", label: "Universidades", color: "text-[oklch(0.62_0.22_305)]" },
            { v: animCountries, suffix: "+", label: "Estados e províncias", color: "text-[oklch(0.72_0.20_38)]" },
            { v: animStudents, suffix: "+", label: "Bolsas mapeadas", color: "text-[oklch(0.63_0.20_255)]" },
          ].map((s, i) => (
            <div key={i} className="text-center sm:text-left">
              <div className={`font-display text-4xl md:text-5xl font-bold tracking-tight ${s.color}`}>
                {s.v.toLocaleString()}{s.suffix}
              </div>
              <div className="text-sm text-muted-foreground font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THREE PILLARS */}
      <section id="universidades" className="px-5 py-24 md:py-32 scroll-mt-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Compass className="h-3 w-3" /> Os 3 pilares
            </div>
            <h2 className="font-display mt-4 text-3xl md:text-5xl font-bold tracking-tight">
              Tudo que você precisa, em <span className="text-gradient-brand">um só lugar</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Da descoberta da universidade ideal até o pouso no aeroporto: Next School organiza cada passo da sua jornada.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                id={i === 1 ? "intercambio" : i === 2 ? "planejamento" : undefined}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-smooth hover:-translate-y-1 hover:shadow-elegant scroll-mt-24"
              >
                <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${p.color} opacity-10 blur-2xl group-hover:opacity-25 transition-opacity duration-500`} />

                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-glow`}>
                  <p.icon className="h-6 w-6 text-white" />
                </div>
                <div className="mt-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{p.tag}</div>
                <h3 className="font-display text-2xl font-bold mt-1">{p.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                <Link
                  to="/signup"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all"
                >
                  Saiba mais <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP 5 AI UNIVERSITIES */}
      <section className="px-5 py-20 bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[oklch(0.72_0.20_38)]/15 to-[oklch(0.62_0.22_305)]/15 border border-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> Selecionadas pela IA
              </div>
              <h2 className="font-display mt-3 text-3xl md:text-4xl font-bold tracking-tight">
                Top 5 universidades em destaque
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Recomendações com base em chance de aceitação, bolsa e custo-benefício.
              </p>
            </div>
            <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
              <Link to="/signup">Ver todas <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(topUnis.length > 0 ? topUnis : Array.from({ length: 5 })).map((u, i) => {
              const locked = i >= 3;
              const uni = u as UniPreview | undefined;
              const medals = ["🥇", "🥈", "🥉", "4º", "5º"];
              return (
                <div
                  key={uni?.id ?? i}
                  className={`relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-smooth hover:-translate-y-1 hover:shadow-elegant ${
                    locked ? "" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">{medals[i]}</div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {uni?.country === "USA" ? "🇺🇸 EUA" : uni?.country === "CANADA" ? "🇨🇦 Canadá" : "🌎 Top"}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                    {uni?.name ?? "Universidade premium"}
                  </h3>
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {uni ? [uni.city, uni.state].filter(Boolean).join(", ") : "Cidade, Estado"}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 text-foreground/80">
                      <DollarSign className="h-3 w-3" />
                      {uni?.estimated_cost_usd ? `${(uni.estimated_cost_usd / 1000).toFixed(0)}k` : "—"}/ano
                    </span>
                    {uni?.scholarship_available && (
                      <span className="bg-success/15 text-success font-semibold px-1.5 py-0.5 rounded-full">Bolsa</span>
                    )}
                  </div>
                  <Button asChild size="sm" className="w-full mt-3 h-7 text-[11px] bg-gradient-to-r from-[oklch(0.72_0.20_38)] to-[oklch(0.62_0.22_305)] text-white border-0 hover:opacity-95">
                    <Link to="/signup">Explorar</Link>
                  </Button>

                  {locked && (
                    <div className="absolute inset-0 backdrop-blur-md bg-card/70 flex flex-col items-center justify-center text-center p-3">
                      <Lock className="h-5 w-5 text-primary mb-2" />
                      <div className="text-[11px] font-semibold">Cadastre-se para desbloquear</div>
                      <Link to="/signup" className="mt-2 text-[11px] text-primary font-bold hover:underline">
                        Criar conta grátis →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEARCH PREVIEW */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Encontre a sua universidade ideal em segundos
            </h2>
            <p className="text-muted-foreground mt-2">
              Filtros por país, estado, divisão esportiva, custo, bolsa e muito mais.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-elegant">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                disabled
                placeholder="Digite uma universidade, cidade ou estado..."
                className="w-full h-14 rounded-xl border border-border bg-background pl-12 pr-4 text-base font-medium placeholder:text-muted-foreground/70 cursor-not-allowed"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { i: Globe, l: "País" },
                { i: MapPin, l: "Estado" },
                { i: Trophy, l: "Divisão NCAA" },
                { i: DollarSign, l: "Custo" },
                { i: Star, l: "Bolsa" },
                { i: GraduationCap, l: "Tipo" },
              ].map((f) => (
                <span key={f.l} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border border-border bg-background text-foreground/70">
                  <f.i className="h-3.5 w-3.5" /> {f.l}
                </span>
              ))}
            </div>

            <div className="mt-5 grid sm:grid-cols-3 gap-3">
              {topUnis.slice(0, 3).map((u) => (
                <div key={u.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="font-semibold text-sm truncate">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{[u.city, u.state].filter(Boolean).join(", ")}</div>
                  <div className="text-[11px] mt-2 flex items-center gap-2 text-muted-foreground">
                    {u.scholarship_available && <span className="bg-success/15 text-success font-semibold px-1.5 py-0.5 rounded-full">Bolsa</span>}
                    <span>${u.estimated_cost_usd?.toLocaleString() ?? "—"}/ano</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 text-center">
              <Button asChild className="bg-gradient-primary text-white shadow-glow border-0 hover:opacity-95">
                <Link to="/signup">
                  Cadastre-se para buscar todas as {uniCount.toLocaleString()}+ universidades <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-5 py-20 bg-muted/40 border-y border-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Como funciona</h2>
            <p className="text-muted-foreground mt-2">Em três passos você sai do zero a um plano completo.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: "01", icon: Search, title: "Descubra", desc: "Explore mais de 6.000 universidades reais com filtros inteligentes e mapa interativo.", color: "from-[oklch(0.62_0.22_305)] to-[oklch(0.48_0.22_295)]" },
              { step: "02", icon: Sparkles, title: "Receba o seu match", desc: "Nossa IA analisa o seu perfil acadêmico-esportivo e sugere as universidades certas pra você.", color: "from-[oklch(0.72_0.20_38)] to-[oklch(0.62_0.22_305)]" },
              { step: "03", icon: ClipboardList, title: "Planeje e execute", desc: "Pipeline de inscrições, contato com técnicos, finanças e prazos — tudo organizado.", color: "from-[oklch(0.63_0.20_255)] to-[oklch(0.62_0.22_305)]" },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-border bg-card p-6 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
                <div className="absolute right-5 top-4 font-display text-5xl font-bold text-muted-foreground/15">{s.step}</div>
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-glow`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl mt-4">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-night relative overflow-hidden p-10 md:p-16 text-center text-white shadow-elegant">
          <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-[oklch(0.72_0.20_38)]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[oklch(0.62_0.22_305)]/30 blur-3xl" />

          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
              Comece a planejar seu <span className="bg-gradient-to-r from-[oklch(0.85_0.18_60)] to-[oklch(0.78_0.20_320)] bg-clip-text text-transparent">futuro</span> hoje.
            </h2>
            <p className="mt-4 text-white/80 max-w-xl mx-auto">
              Crie sua conta gratuita e tenha acesso a 6.000+ universidades, IA personalizada e ferramentas de planejamento completas.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                asChild
                className="h-12 px-8 bg-gradient-to-r from-[oklch(0.72_0.20_38)] to-[oklch(0.68_0.22_25)] text-white shadow-glow hover:opacity-95 hover-scale border-0 text-base"
              >
                <Link to="/signup">Criar conta grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 bg-white/5 border-white/30 text-white hover:bg-white/10 hover:text-white">
                <Link to="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-5 py-10 border-t border-border">
        <div className="mx-auto max-w-6xl flex items-center justify-center">
          <Logo />
        </div>
      </footer>
    </div>
  );
}
