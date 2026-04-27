import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, MapPin, DollarSign, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/faculdades")({ component: FaculdadesPage });

type Uni = {
  id: string; name: string; country: string; state: string; city: string | null;
  type: string; nature: string; division: string | null;
  estimated_cost_usd: number | null; scholarship_available: boolean;
  acceptance_chance: string | null;
};

function FaculdadesPage() {
  const { user } = useAuth();
  const [unis, setUnis] = useState<Uni[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [pipeIds, setPipeIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");
  const [division, setDivision] = useState<string>("ALL");
  const [state, setState] = useState<string>("ALL");
  const [visibleCount, setVisibleCount] = useState(60);

  const refresh = async () => {
    // Supabase default limit is 1000; paginate to fetch all ~6k universities
    const PAGE = 1000;
    const all: Uni[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data } = await supabase
        .from("universities")
        .select("*")
        .order("name")
        .range(from, from + PAGE - 1);
      const batch = (data as Uni[]) ?? [];
      all.push(...batch);
      if (batch.length < PAGE) break;
    }
    setUnis(all);
    if (user) {
      const [{ data: f }, { data: p }] = await Promise.all([
        supabase.from("favorites").select("university_id").eq("user_id", user.id),
        supabase.from("pipeline").select("university_id").eq("user_id", user.id),
      ]);
      setFavIds(new Set((f ?? []).map((r: { university_id: string }) => r.university_id)));
      setPipeIds(new Set((p ?? []).map((r: { university_id: string }) => r.university_id)));
    }
  };

  useEffect(() => { refresh(); }, [user]);

  const states = useMemo(() => {
    const s = new Set(unis.filter(u => country === "ALL" || u.country === country).map(u => u.state));
    return Array.from(s).sort();
  }, [unis, country]);

  const filtered = useMemo(() => unis.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (country !== "ALL" && u.country !== country) return false;
    if (type !== "ALL" && u.type !== type) return false;
    if (division !== "ALL" && u.division !== division) return false;
    if (state !== "ALL" && u.state !== state) return false;
    return true;
  }), [unis, search, country, type, division, state]);

  const toggleFav = async (uId: string) => {
    if (!user) return;
    if (favIds.has(uId)) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("university_id", uId);
      toast.success("Removida dos favoritos");
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, university_id: uId });
      toast.success("Adicionada aos favoritos ⭐");
    }
    refresh();
  };

  const addToPipeline = async (uId: string) => {
    if (!user || pipeIds.has(uId)) return;
    await supabase.from("pipeline").insert({ user_id: user.id, university_id: uId, status: "interest" });
    toast.success("Adicionada ao pipeline");
    refresh();
  };

  const FilterChip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`px-3 py-1 rounded-full text-xs font-medium transition-smooth ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
    }`}>{children}</button>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Jornada Acadêmica</h1>
        <p className="text-muted-foreground mt-1">{unis.length} universidades reais nos EUA e Canadá</p>
      </div>

      <Card className="p-5 space-y-4">
        <Input placeholder="Buscar universidade..." value={search} onChange={(e) => setSearch(e.target.value)} />

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">PAÍS</div>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={country === "ALL"} onClick={() => { setCountry("ALL"); setState("ALL"); }}>Todos</FilterChip>
            <FilterChip active={country === "USA"} onClick={() => { setCountry("USA"); setState("ALL"); }}>EUA</FilterChip>
            <FilterChip active={country === "CANADA"} onClick={() => { setCountry("CANADA"); setState("ALL"); }}>Canadá</FilterChip>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">TIPO</div>
          <div className="flex flex-wrap gap-2">
            {[["ALL", "Todos"], ["community_college", "Community College"], ["college", "College"], ["university", "University"]].map(([v, l]) => (
              <FilterChip key={v} active={type === v} onClick={() => setType(v)}>{l}</FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">DIVISÃO ESPORTIVA</div>
          <div className="flex flex-wrap gap-2">
            {[["ALL", "Todas"], ["NCAA_D1", "NCAA D1"], ["NCAA_D2", "D2"], ["NCAA_D3", "D3"], ["NAIA", "NAIA"], ["NJCAA", "NJCAA"]].map(([v, l]) => (
              <FilterChip key={v} active={division === v} onClick={() => setDivision(v)}>{l}</FilterChip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            {country === "CANADA" ? "PROVÍNCIA" : country === "USA" ? "ESTADO" : "ESTADO / PROVÍNCIA"}
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            <FilterChip active={state === "ALL"} onClick={() => setState("ALL")}>Todos</FilterChip>
            {states.map(s => (
              <FilterChip key={s} active={state === s} onClick={() => setState(s)}>{s}</FilterChip>
            ))}
          </div>
        </div>
      </Card>

      <div className="text-sm text-muted-foreground">{filtered.length} resultados</div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => {
          const isFav = favIds.has(u.id);
          const inPipe = pipeIds.has(u.id);
          return (
            <Card key={u.id} className="p-5 transition-smooth hover:shadow-elegant hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{u.name}</h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> {[u.city, u.state, u.country === "USA" ? "EUA" : "Canadá"].filter(Boolean).join(", ")}
                  </div>
                </div>
                <button onClick={() => toggleFav(u.id)} className="shrink-0 p-2 -m-2 transition-smooth">
                  <Star className={`h-5 w-5 ${isFav ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                <Badge variant="secondary">{u.type === "community_college" ? "Community" : u.type === "college" ? "College" : "University"}</Badge>
                <Badge variant="outline">{u.nature === "public" ? "Pública" : "Privada"}</Badge>
                {u.division && u.division !== "NONE" && <Badge variant="outline">{u.division.replace("_", " ")}</Badge>}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>${u.estimated_cost_usd?.toLocaleString() ?? "—"}/ano</span>
                </div>
                {u.scholarship_available && <Badge className="bg-success text-success-foreground">Bolsa</Badge>}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                Chance: <span className={
                  u.acceptance_chance === "high" ? "text-success font-medium" :
                  u.acceptance_chance === "low" ? "text-destructive font-medium" : "text-warning font-medium"
                }>
                  {u.acceptance_chance === "high" ? "Alta" : u.acceptance_chance === "low" ? "Baixa" : "Média"}
                </span>
              </div>

              <Button
                size="sm"
                variant={inPipe ? "secondary" : "default"}
                className="w-full mt-4"
                disabled={inPipe}
                onClick={() => addToPipeline(u.id)}
              >
                {inPipe ? <><Check className="h-3.5 w-3.5 mr-1.5" /> No pipeline</> : <><Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar ao pipeline</>}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
