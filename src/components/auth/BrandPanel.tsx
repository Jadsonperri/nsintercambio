import { CheckCircle2, GraduationCap, Sparkles, Trophy } from "lucide-react";
import { Logo } from "@/components/Logo";

export function BrandPanel() {
  return (
    <div className="relative hidden md:flex flex-col justify-between overflow-hidden p-10 lg:p-14 text-white bg-gradient-to-br from-[oklch(0.62_0.21_295)] via-[oklch(0.55_0.21_305)] to-[oklch(0.74_0.17_50)]">
      {/* animated blobs */}
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-white/20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-[oklch(0.74_0.17_50)]/40 blur-3xl animate-pulse [animation-delay:600ms]" />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
            <Logo size={28} withText={false} />
          </div>
          <div className="font-bold text-lg tracking-tight">
            NEXT <span className="text-white/85">SCHOOL</span>
          </div>
        </div>

        <h1 className="mt-12 text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
          Sua jornada para uma faculdade nos EUA ou Canadá começa aqui.
        </h1>
        <p className="mt-4 text-white/80 text-sm lg:text-base max-w-md">
          Score acadêmico-esportivo, mapa de universidades, pipeline de inscrições e IA que sugere as melhores oportunidades pra você.
        </p>

        {/* mini dashboard preview */}
        <div className="mt-10 max-w-sm rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
          <div className="rounded-2xl bg-white/95 text-foreground p-4 shadow-2xl ring-1 ring-white/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Seu painel</span>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <div className="text-[10px] text-muted-foreground">Score</div>
                <div className="text-lg font-bold text-primary">78</div>
              </div>
              <div className="rounded-lg bg-accent/15 p-2.5">
                <div className="text-[10px] text-muted-foreground">Faculdades</div>
                <div className="text-lg font-bold text-foreground">12</div>
              </div>
              <div className="rounded-lg bg-success/15 p-2.5">
                <div className="text-[10px] text-muted-foreground">Bolsas</div>
                <div className="text-lg font-bold text-success">5</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-2">
              <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
              <span className="text-[11px] text-foreground">Próxima ação: enviar email Stanford</span>
            </div>
          </div>
        </div>
      </div>

      {/* social proof */}
      <div className="relative z-10 mt-10 space-y-2.5">
        {[
          "Dados criptografados — segurança ponta a ponta",
          "Sem cobrança no cadastro",
          "+500 atletas planejando o intercâmbio",
        ].map((t) => (
          <div key={t} className="flex items-center gap-2 text-sm text-white/90">
            <CheckCircle2 className="h-4 w-4 text-white/90 shrink-0" />
            <span>{t}</span>
          </div>
        ))}
        <div className="pt-3 flex items-center gap-2 text-[11px] text-white/70">
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Stanford · UCLA · Harvard · Toronto · McGill · UBC · +6 mil instituições</span>
        </div>
      </div>
    </div>
  );
}
