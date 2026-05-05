import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, DollarSign, Trophy, GraduationCap, ExternalLink, Mail, MessageSquare, FileCheck, Loader2, Sparkles } from "lucide-react";
import { AIEmailGenerator } from "./AIEmailGenerator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Uni = {
  id: string; name: string; country: string; state: string; city: string | null;
  type: string; nature: string; division: string | null;
  estimated_cost_usd: number | null; scholarship_available: boolean;
  acceptance_chance: string | null;
  website?: string | null;
};

type PipelineRow = {
  email_sent: boolean;
  response_received: boolean;
  applied: boolean;
  interest_level: string | null;
  notes: string | null;
};

type Props = {
  uni: Uni | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string | null;
  inPipeline: boolean;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  onTogglePipeline: (id: string) => void;
};

const YESNO = [
  { v: true, l: "Sim" },
  { v: false, l: "Não" },
] as const;

const INTEREST = [
  { v: "low", l: "Baixo", color: "from-rose-500 to-rose-600", dot: "bg-rose-400" },
  { v: "medium", l: "Médio", color: "from-amber-500 to-amber-600", dot: "bg-amber-400" },
  { v: "high", l: "Alto", color: "from-emerald-500 to-emerald-600", dot: "bg-emerald-400" },
] as const;

export function UniversityDetailDialog({
  uni, open, onOpenChange, userId, inPipeline, isFav, onToggleFav, onTogglePipeline,
}: Props) {
  const [row, setRow] = useState<PipelineRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEmailGen, setShowEmailGen] = useState(false);

  useEffect(() => {
    if (!open || !uni || !userId || !inPipeline) { setRow(null); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pipeline")
        .select("email_sent, response_received, applied, interest_level, notes")
        .eq("user_id", userId)
        .eq("university_id", uni.id)
        .maybeSingle();
      if (!cancel) {
        setRow((data as PipelineRow) ?? { email_sent: false, response_received: false, applied: false, interest_level: "medium", notes: "" });
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [open, uni, userId, inPipeline]);

  const update = async (patch: Partial<PipelineRow>) => {
    if (!uni || !userId || !row) return;
    const next = { ...row, ...patch };
    setRow(next);
    setSaving(true);
    const { error } = await supabase
      .from("pipeline")
      .update(patch)
      .eq("user_id", userId)
      .eq("university_id", uni.id);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar"); return; }
  };

  if (!uni) return null;

  const flag = uni.country === "USA" ? "🇺🇸" : uni.country === "CANADA" ? "🇨🇦" : "🌎";
  const chance = uni.acceptance_chance;
  const chanceLabel = chance === "high" ? "Alta" : chance === "low" ? "Baixa" : chance === "medium" ? "Média" : "—";
  const chanceClass = chance === "high" ? "text-emerald-400" : chance === "low" ? "text-rose-400" : "text-amber-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#12121F] border-[#A855F7]/30 text-white p-0 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-[#A855F7]/15 via-transparent to-[#FF6B2B]/10 border-b border-white/5">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#7C3AED] flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <h2 className="text-xl font-bold leading-tight">{uni.name}</h2>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-white/60">
                <MapPin className="h-3.5 w-3.5" />
                <span>{flag} {[uni.city, uni.state].filter(Boolean).join(", ")}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge className="bg-white/10 hover:bg-white/15 text-white border-0">
                  {uni.type === "community_college" ? "Community" : uni.type === "college" ? "College" : "University"}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/80">
                  {uni.nature === "public" ? "Pública" : "Privada"}
                </Badge>
                {uni.division && uni.division !== "NONE" && (
                  <Badge variant="outline" className="border-[#A855F7]/40 text-[#A855F7]">
                    <Trophy className="h-3 w-3 mr-1" />{uni.division.replace("_", " ")}
                  </Badge>
                )}
                {uni.scholarship_available && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-0">💰 Bolsa</Badge>
                )}
              </div>
            </div>
            <button
              onClick={() => onToggleFav(uni.id)}
              className="absolute top-5 right-5 p-2 rounded-lg hover:bg-white/5 transition-colors"
              aria-label="Favoritar"
            >
              <Star className={`h-5 w-5 ${isFav ? "fill-amber-400 text-amber-400" : "text-white/40"}`} />
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="rounded-lg bg-white/5 border border-white/5 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-white/50 font-semibold flex items-center gap-1"><DollarSign className="h-3 w-3" />Custo/ano</div>
              <div className="text-sm font-bold mt-0.5">${uni.estimated_cost_usd?.toLocaleString() ?? "—"}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/5 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-white/50 font-semibold">Chance</div>
              <div className={`text-sm font-bold mt-0.5 ${chanceClass}`}>{chanceLabel}</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/5 p-2.5">
              <div className="text-[10px] uppercase tracking-wide text-white/50 font-semibold">Bolsa</div>
              <div className="text-sm font-bold mt-0.5">{uni.scholarship_available ? "Disponível" : "Não"}</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[55vh] overflow-y-auto">
          {/* Pipeline editor */}
          {inPipeline ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
                  STATUS NO PIPELINE
                </h3>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#A855F7]" />}
              </div>

              {loading || !row ? (
                <div className="text-sm text-white/50 py-4">Carregando…</div>
              ) : (
                <>
                  <YesNoRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email enviado"
                    value={row.email_sent}
                    onChange={(v) => update({ email_sent: v })}
                  />
                  <YesNoRow
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="Resposta recebida"
                    value={row.response_received}
                    onChange={(v) => update({ response_received: v })}
                  />
                  <YesNoRow
                    icon={<FileCheck className="h-4 w-4" />}
                    label="Aplicado"
                    value={row.applied}
                    onChange={(v) => update({ applied: v })}
                  />

                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-white/50 font-semibold mb-2">Nível de interesse</div>
                    <div className="grid grid-cols-3 gap-2">
                      {INTEREST.map(opt => {
                        const active = (row.interest_level ?? "medium") === opt.v;
                        return (
                          <button
                            key={opt.v}
                            onClick={() => update({ interest_level: opt.v })}
                            className={`h-10 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 border ${
                              active
                                ? `bg-gradient-to-r ${opt.color} text-white border-transparent shadow-lg`
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                            {opt.l}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-white/50 font-semibold mb-2">Observações</div>
                    <Textarea
                      value={row.notes ?? ""}
                      onChange={(e) => setRow({ ...row, notes: e.target.value })}
                      onBlur={() => update({ notes: row.notes ?? "" })}
                      placeholder="Notas pessoais, estratégia, contexto…"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#A855F7]/40 min-h-[90px]"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-white/5 border border-white/5 p-4 text-sm text-white/70">
              Adicione esta universidade ao seu pipeline para acompanhar contato, candidatura e notas pessoais.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-white/5 bg-black/20">
          <div className="flex gap-2">
            {uni.website && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/15 text-white hover:bg-white/10 hover:text-white bg-transparent"
              >
                <a href={uni.website} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Site oficial
                </a>
              </Button>
            )}
            {inPipeline && (
              <Button
                variant="outline"
                size="sm"
                className="border-[#A855F7]/40 text-[#A855F7] hover:bg-[#A855F7]/10 bg-transparent gap-2"
                onClick={() => setShowEmailGen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" /> Gerar email com IA
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/15 text-white hover:bg-white/10 hover:text-white bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              className={inPipeline ? "bg-rose-500/90 hover:bg-rose-500 text-white" : "bg-[#A855F7] hover:bg-[#9333EA] text-white"}
              onClick={() => onTogglePipeline(uni.id)}
            >
              {inPipeline ? "Remover do pipeline" : "Adicionar ao pipeline"}
            </Button>
          </div>
        </div>

        <AIEmailGenerator 
          isOpen={showEmailGen}
          onClose={() => setShowEmailGen(false)}
          universityName={uni.name}
          onMarkAsSent={() => update({ email_sent: true })}
        />
      </DialogContent>
    </Dialog>
  );
}

function YesNoRow({
  icon, label, value, onChange,
}: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 border border-white/5 px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm text-white">
        <span className="text-[#A855F7]">{icon}</span>
        {label}
      </div>
      <div className="inline-flex rounded-md bg-black/30 p-0.5 border border-white/5">
        {YESNO.map(o => {
          const active = value === o.v;
          return (
            <button
              key={String(o.v)}
              onClick={() => onChange(o.v)}
              className={`px-3 h-7 text-xs font-semibold rounded transition-all ${
                active
                  ? o.v
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-white/15 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
