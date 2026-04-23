import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GraduationCap, Brain, Wallet, Compass, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/app" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild><Link to="/login">Entrar</Link></Button>
          <Button asChild><Link to="/signup">Criar conta</Link></Button>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="absolute inset-0 bg-glow pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Planejamento de intercâmbio com IA
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Seu futuro <span className="text-gradient">fora do país</span><br />começa aqui.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Do perfil à aplicação: faculdades reais, score inteligente, planejamento financeiro e IA estratégica em um só lugar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-gradient-primary shadow-glow" asChild>
              <Link to="/signup">Começar grátis <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 border-t border-border">
        <div className="mx-auto max-w-6xl grid md:grid-cols-4 gap-6">
          {[
            { icon: GraduationCap, title: "Faculdades reais", desc: "Base curada de universidades nos EUA e Canadá com dados verificados." },
            { icon: Brain, title: "IA estratégica", desc: "Score inteligente, simulações e recomendações com base no seu perfil." },
            { icon: Wallet, title: "Planejamento financeiro", desc: "Viabilidade real, fluxo de caixa e custo de vida por região." },
            { icon: Compass, title: "Direção clara", desc: "Pipeline, próximo passo e foco do mês — sempre atualizados." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-smooth hover:shadow-elegant hover:-translate-y-1">
              <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="px-6 py-8 border-t border-border text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NEXT SCHOOL · Planeje seu futuro
      </footer>
    </div>
  );
}
