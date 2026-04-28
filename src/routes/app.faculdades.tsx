import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, MapPin, DollarSign, Check, Search, SlidersHorizontal, X, ChevronDown, Globe, GraduationCap, Trophy, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/faculdades")({ component: FaculdadesPage });

type Uni = {
  id: string; name: string; country: string; state: string; city: string | null;
  type: string; nature: string; division: string | null;
  estimated_cost_usd: number | null; scholarship_available: boolean;
  acceptance_chance: string | null;
};

const COUNTRY_OPTIONS = [
  { v: "ALL", l: "Todos" },
  { v: "USA", l: "🇺🇸 EUA" },
  { v: "CANADA", l: "🇨🇦 Canadá" },
];

const TYPE_OPTIONS = [
  { v: "ALL", l: "Todos" },
  { v: "community_college", l: "Community College" },
  { v: "college", l: "College" },
  { v: "university", l: "University" },
];

const DIVISION_OPTIONS = [
  { v: "ALL", l: "Todas" },
  { v: "NCAA_D1", l: "NCAA D1" },
  { v: "NCAA_D2", l: "NCAA D2" },
  { v: "NCAA_D3", l: "NCAA D3" },
  { v: "NAIA", l: "NAIA" },
  { v: "NJCAA", l: "NJCAA" },
  { v: "U_SPORTS", l: "U SPORTS 🇨🇦" },
];

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
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [user]);

  const states = useMemo(() => {
    const s = new Set(unis.filter(u => country === "ALL" || u.country === country).map(u => u.state));
    return Array.from(s).sort();
  }, [unis, country]);

  const filtered = useMemo(() => unis.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !(u.city ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (country !== "ALL" && u.country !== country) return false;
    if (type !== "ALL" && u.type !== type) return false;
    if (division !== "ALL" && u.division !== division) return false;
    if (state !== "ALL" && u.state !== state) return false;
    if (scholarshipOnly && !u.scholarship_available) return false;
    return true;
  }), [unis, search, country, type, division, state, scholarshipOnly]);

  useEffect(() => { setVisibleCount(60); }, [search, country, type, division, state, scholarshipOnly]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const activeFilterCount =
    (country !== "ALL" ? 1 : 0) +
    (type !== "ALL" ? 1 : 0) +
    (division !== "ALL" ? 1 : 0) +
    (state !== "ALL" ? 1 : 0) +
    (scholarshipOnly ? 1 : 0);

  const clearFilters = () => {
    setCountry("ALL"); setType("ALL"); setDivision("ALL"); setState("ALL"); setScholarshipOnly(false);
  };

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

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth border ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  const FilterSection = ({ icon: Icon, label, children }: { icon: typeof Globe; label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Jornada Acadêmica</h1>
        <p className="text-muted-foreground mt-1">
          {unis.length.toLocaleString()} universidades reais nos EUA e Canadá
        </p>
      </div>

      {/* Search + filters trigger */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar universidade ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            variant={filtersOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltersOpen(o => !o)}
            className="gap-2 shrink-0"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary-foreground/20 text-current">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Active filter pills (always visible when there are any) */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {country !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {COUNTRY_OPTIONS.find(o => o.v === country)?.l}
                <button onClick={() => setCountry("ALL")} className="hover:bg-background/50 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {type !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {TYPE_OPTIONS.find(o => o.v === type)?.l}
                <button onClick={() => setType("ALL")} className="hover:bg-background/50 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {division !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {DIVISION_OPTIONS.find(o => o.v === division)?.l}
                <button onClick={() => setDivision("ALL")} className="hover:bg-background/50 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {state !== "ALL" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {state}
                <button onClick={() => setState("ALL")} className="hover:bg-background/50 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {scholarshipOnly && (
              <Badge variant="secondary" className="gap-1 pr-1">
                Com bolsa
                <button onClick={() => setScholarshipOnly(false)} className="hover:bg-background/50 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline ml-1">
              limpar tudo
            </button>
          </div>
        )}

        {/* Collapsible filters */}
        {filtersOpen && (
          <div className="pt-3 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <FilterSection icon={Globe} label="País">
              {COUNTRY_OPTIONS.map(o => (
                <Chip key={o.v} active={country === o.v} onClick={() => { setCountry(o.v); setState("ALL"); }}>{o.l}</Chip>
              ))}
            </FilterSection>

            <FilterSection icon={GraduationCap} label="Tipo de instituição">
              {TYPE_OPTIONS.map(o => (
                <Chip key={o.v} active={type === o.v} onClick={() => setType(o.v)}>{o.l}</Chip>
              ))}
            </FilterSection>

            <FilterSection icon={Trophy} label="Divisão esportiva">
              {DIVISION_OPTIONS.map(o => (
                <Chip key={o.v} active={division === o.v} onClick={() => setDivision(o.v)}>{o.l}</Chip>
              ))}
            </FilterSection>

            <FilterSection icon={MapIcon} label={country === "CANADA" ? "Província" : country === "USA" ? "Estado" : "Estado / Província"}>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                <Chip active={state === "ALL"} onClick={() => setState("ALL")}>Todos</Chip>
                {states.map(s => (
                  <Chip key={s} active={state === s} onClick={() => setState(s)}>{s}</Chip>
                ))}
              </div>
            </FilterSection>

            <FilterSection icon={DollarSign} label="Bolsas">
              <Chip active={!scholarshipOnly} onClick={() => setScholarshipOnly(false)}>Todas</Chip>
              <Chip active={scholarshipOnly} onClick={() => setScholarshipOnly(true)}>Apenas com bolsa</Chip>
            </FilterSection>
          </div>
        )}
      </Card>

      <div className="text-sm text-muted-foreground flex items-center justify-between">
        <span>
          {loading ? "Carregando..." : (
            <>
              <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span> resultado{filtered.length !== 1 ? "s" : ""}
              {visible.length < filtered.length && ` (mostrando ${visible.length})`}
            </>
          )}
        </span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map(u => {
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

      {!loading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Nenhuma universidade encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">Tente ajustar a busca ou os filtros.</p>
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Limpar filtros</Button>
          )}
        </Card>
      )}

      {visible.length < filtered.length && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setVisibleCount(c => c + 60)}>
            Carregar mais ({(filtered.length - visible.length).toLocaleString()} restantes)
          </Button>
        </div>
      )}
    </div>
  );
}
