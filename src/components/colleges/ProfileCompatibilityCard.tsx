import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, UserCircle2, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

type RecUni = {
  id: string;
  name: string;
  country: string;
  state: string | null;
  match: number;
};

type Props = {
  percent: number;
  recommendations?: RecUni[];
};

const flagFor = (country: string) =>
  country === "USA" ? "🇺🇸" : country === "CANADA" ? "🇨🇦" : "🌎";

export function ProfileCompatibilityCard({ percent, recommendations = [] }: Props) {
  const [open, setOpen] = useState(false);
  const pct = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div
      className={`rounded-2xl bg-[#12121F] border transition-all duration-300 overflow-hidden ${
        open ? "border-[#A855F7]/60 shadow-[0_0_30px_rgba(168,85,247,0.15)]" : "border-[#A855F7]/20"
      }`}
    >
      {/* Header — clicável */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left p-5 md:p-6 flex items-center gap-4 group"
      >
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#A855F7] to-[#FF6B2B] flex items-center justify-center shrink-0">
          <UserCircle2 className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-semibold text-white">Compatibilidade do Perfil</h3>
            <span className="text-sm font-bold text-white">{pct}% completo</span>
          </div>
          <p className="text-xs text-white/50 mt-0.5">
            Complete seu perfil para receber recomendações mais precisas
          </p>
          <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#A855F7] to-[#FF6B2B] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-white/60 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Conteúdo expandido */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 md:px-6 pb-5 md:pb-6 border-t border-white/5 pt-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sparkles className="h-4 w-4 text-[#A855F7]" />
                🎓 Universidades recomendadas para o seu perfil
              </div>
              <p className="text-xs text-white/50 mt-1">
                Com base nas suas informações, essas têm maior compatibilidade com você
              </p>
            </div>

            {recommendations.length === 0 ? (
              <div className="rounded-xl bg-white/5 border border-white/5 p-4 text-sm text-white/60 text-center">
                Complete mais campos do perfil para gerar recomendações.
              </div>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-3">
                {recommendations.slice(0, 3).map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl bg-white/5 border border-white/5 p-3 flex flex-col gap-2 hover:border-[#A855F7]/40 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#A855F7]/30 to-[#3B82F6]/30 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-sm truncate">{u.name}</div>
                      <div className="text-[11px] text-white/50">
                        {flagFor(u.country)} {u.state ?? (u.country === "USA" ? "EUA" : "Canadá")}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[#A855F7]">{u.match}% compatível</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                asChild
                className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white"
              >
                <Link to="/app/perfil">Completar Perfil</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-[#A855F7]/40 text-[#A855F7] hover:bg-[#A855F7]/10 hover:text-[#A855F7]"
              >
                <Link to="/app/faculdades">Ver todas as recomendações</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Botão CTA quando fechado */}
      {!open && (
        <div className="px-5 md:px-6 pb-5">
          <Button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="bg-[#FF6B2B] hover:bg-[#FF6B2B]/90 text-white shadow-[0_0_20px_rgba(255,107,43,0.25)]"
          >
            Completar Perfil
          </Button>
        </div>
      )}
    </div>
  );
}
