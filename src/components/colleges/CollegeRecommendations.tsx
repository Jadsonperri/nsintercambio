import { useEffect, useState } from "react";
import { Sparkles, Star, Plus, Check, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { recommendUniversities } from "@/server/recommendations.functions";

export type RecUni = {
  id: string;
  name: string;
  state: string;
  country: string;
  division: string | null;
  estimated_cost_usd: number | null;
  scholarship_available: boolean;
  acceptance_chance: string | null;
};

type Profile = {
  fullName?: string;
  sport?: string;
  position?: string;
  gpa?: number;
  sat?: number;
  toefl?: number;
  budgetMaxUsd?: number;
};

const CACHE_KEY = (uid: string) => `ns_recs_${uid}`;
const TTL = 24 * 60 * 60 * 1000;

export function CollegeRecommendations({
  userId, profile, universities, favIds, pipeIds, onToggleFav, onAddPipeline,
}: {
  userId: string | null;
  profile: Profile;
  universities: RecUni[];
  favIds: Set<string>;
  pipeIds: Set<string>;
  onToggleFav: (id: string) => void;
  onAddPipeline: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Array<{ id: string; reason: string }>>([]);

  const load = async (force = false) => {
    if (!userId || universities.length === 0) return;
    if (!force) {
      try {
        const raw = localStorage.getItem(CACHE_KEY(userId));
        if (raw) {
          const c = JSON.parse(raw) as { ts: number; recs: Array<{ id: string; reason: string }> };
          if (Date.now() - c.ts < TTL) { setRecs(c.recs); return; }
        }
      } catch {}
    }
    setLoading(true); setError(null);
    try {
      const result = await recommendUniversities({
        data: {
          profile,
          universities: universities.slice(0, 250),
        },
      });
      if (result.error) setError(result.error);
      setRecs(result.recommendations);
      try {
        localStorage.setItem(CACHE_KEY(userId), JSON.stringify({ ts: Date.now(), recs: result.recommendations }));
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(false); /* eslint-disable-next-line */ }, [userId, universities.length]);

  if (!userId || universities.length === 0) return null;

  const byId = new Map(universities.map(u => [u.id, u]));
  const cards = recs.map(r => ({ ...r, u: byId.get(r.id) })).filter(x => x.u) as Array<{ id: string; reason: string; u: RecUni }>;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-smooth"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm">Top 5 pra você · IA</div>
            <div className="text-[11px] text-muted-foreground">
              {loading ? "Analisando seu perfil..." : `Recomendações personalizadas com base no seu perfil`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); void load(true); }}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            title="Atualizar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {loading && cards.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando recomendações...
            </div>
          ) : error && cards.length === 0 ? (
            <div className="text-sm text-destructive py-3">{error}</div>
          ) : cards.length === 0 ? (
            <div className="text-sm text-muted-foreground py-3">Nenhuma recomendação disponível.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {cards.map(({ u, reason }) => {
                const isFav = favIds.has(u.id);
                const inPipe = pipeIds.has(u.id);
                return (
                  <div key={u.id} className="rounded-lg border border-border bg-card p-3 space-y-2 hover:shadow-md transition-smooth">
                    <div className="font-semibold text-xs leading-tight line-clamp-2">{u.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {u.state} · {u.country === "USA" ? "EUA" : "Canadá"}
                    </div>
                    <div className="text-[10px] text-foreground/80 italic line-clamp-3 min-h-[36px]">
                      “{reason}”
                    </div>
                    <div className="flex gap-1 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 px-1.5 text-[10px]"
                        onClick={() => onToggleFav(u.id)}
                      >
                        <Star className={`h-3 w-3 ${isFav ? "fill-accent text-accent" : ""}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant={inPipe ? "secondary" : "default"}
                        className="flex-1 h-7 px-1.5 text-[10px]"
                        onClick={() => onAddPipeline(u.id)}
                        title={inPipe ? "Clique para remover do pipeline" : "Adicionar ao pipeline"}
                      >
                        {inPipe ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
