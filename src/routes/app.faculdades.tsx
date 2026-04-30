import { createFileRoute } from "@tanstack/react-router";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, Plus, MapPin, DollarSign, Check, Search, SlidersHorizontal, X, ChevronDown, Globe, GraduationCap, Trophy, Map as MapIcon, List } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/faculdades")({ component: FaculdadesPage });

type Uni = {
  id: string; name: string; country: string; state: string; city: string | null;
  type: string; nature: string; division: string | null;
  estimated_cost_usd: number | null; scholarship_available: boolean;
  acceptance_chance: string | null;
  latitude: number | null; longitude: number | null;
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

  // Realtime sync favorites + pipeline
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("faculdades-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "favorites", filter: `user_id=eq.${user.id}` }, async () => {
        const { data } = await supabase.from("favorites").select("university_id").eq("user_id", user.id);
        setFavIds(new Set((data ?? []).map((r: { university_id: string }) => r.university_id)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pipeline", filter: `user_id=eq.${user.id}` }, async () => {
        const { data } = await supabase.from("pipeline").select("university_id").eq("user_id", user.id);
        setPipeIds(new Set((data ?? []).map((r: { university_id: string }) => r.university_id)));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

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
  const favoritesList = useMemo(() => unis.filter(u => favIds.has(u.id)), [unis, favIds]);

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
      // optimistic
      setFavIds(prev => { const n = new Set(prev); n.delete(uId); return n; });
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("university_id", uId);
      toast.success("Removida dos favoritos");
    } else {
      setFavIds(prev => new Set(prev).add(uId));
      await supabase.from("favorites").insert({ user_id: user.id, university_id: uId });
      toast.success("Adicionada aos favoritos ⭐");
    }
  };

  const addToPipeline = async (uId: string) => {
    if (!user || pipeIds.has(uId)) return;
    setPipeIds(prev => new Set(prev).add(uId));
    await supabase.from("pipeline").insert({ user_id: user.id, university_id: uId, status: "interest" });
    toast.success("Adicionada ao pipeline");
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

  const UniCard = ({ u }: { u: Uni }) => {
    const isFav = favIds.has(u.id);
    const inPipe = pipeIds.has(u.id);
    return (
      <Card className="p-5 transition-smooth hover:shadow-elegant hover:-translate-y-0.5">
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
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Jornada Acadêmica</h1>
        <p className="text-muted-foreground mt-1">
          {unis.length.toLocaleString()} universidades reais nos EUA e Canadá
        </p>
      </div>

      <Tabs defaultValue="resultados" className="space-y-5">
        <TabsList>
          <TabsTrigger value="resultados" className="gap-1.5"><List className="h-4 w-4" /> Resultados</TabsTrigger>
          <TabsTrigger value="favoritos" className="gap-1.5">
            <Star className="h-4 w-4" /> Favoritos
            {favoritesList.length > 0 && <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-accent text-accent-foreground">{favoritesList.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="mapa" className="gap-1.5"><MapIcon className="h-4 w-4" /> Mapa</TabsTrigger>
        </TabsList>

        {/* RESULTADOS */}
        <TabsContent value="resultados" className="space-y-5 mt-0">
          {/* Mini painel lateral: resumo de favoritos + pipeline */}
          {(favoritesList.length > 0 || pipeIds.size > 0) && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Card className="p-4 flex items-center gap-3 border-accent/30 bg-accent/5">
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Favoritas</div>
                  <div className="font-semibold">{favoritesList.length} universidade{favoritesList.length !== 1 ? "s" : ""}</div>
                  {favoritesList.length > 0 && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {favoritesList.slice(0, 2).map(u => u.name).join(", ")}{favoritesList.length > 2 ? ` +${favoritesList.length - 2}` : ""}
                    </div>
                  )}
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-3 border-primary/30 bg-primary/5">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">No pipeline</div>
                  <div className="font-semibold">{pipeIds.size} universidade{pipeIds.size !== 1 ? "s" : ""}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {pipeIds.size > 0 ? "Acompanhe na aba Execução" : "Nenhuma ainda"}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Search + filters */}
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
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${filtersOpen ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"}`}>
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
              </Button>
            </div>

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
            {visible.map(u => <UniCard key={u.id} u={u} />)}
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
        </TabsContent>

        {/* FAVORITOS */}
        <TabsContent value="favoritos" className="space-y-4 mt-0">
          {favoritesList.length === 0 ? (
            <Card className="p-12 text-center">
              <Star className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Nenhuma universidade favoritada ainda</p>
              <p className="text-sm text-muted-foreground mt-1">Toque na ⭐ em qualquer card para salvar aqui.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoritesList.map(u => <UniCard key={u.id} u={u} />)}
            </div>
          )}
        </TabsContent>

        {/* MAPA */}
        <TabsContent value="mapa" className="mt-0">
          <MapErrorBoundary>
            <UniMap
              unis={filtered}
              favIds={favIds}
              pipeIds={pipeIds}
              onToggleFav={toggleFav}
              onAddPipeline={addToPipeline}
            />
          </MapErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Lightweight Geographic Map ---------------- */
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

class MapErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("Map error:", error); }
  render() {
    if (this.state.error) {
      return (
        <Card className="p-6 text-center space-y-3">
          <MapIcon className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">Não foi possível carregar o mapa</h3>
          <p className="text-sm text-muted-foreground">Use a aba Resultados ou Favoritos para visualizar as universidades.</p>
          <Button size="sm" variant="outline" onClick={() => this.setState({ error: null })}>Tentar novamente</Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

// Centros aproximados [longitude, latitude] de estados/províncias com universidades
const STATE_CENTERS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  // EUA
  CA: { center: [-119.4, 36.8], zoom: 3, label: "Califórnia" },
  TX: { center: [-99.3, 31.0], zoom: 3, label: "Texas" },
  FL: { center: [-81.5, 27.8], zoom: 3.5, label: "Flórida" },
  NY: { center: [-75.5, 42.9], zoom: 4, label: "Nova York" },
  PA: { center: [-77.2, 41.0], zoom: 4, label: "Pensilvânia" },
  IL: { center: [-89.0, 40.0], zoom: 4, label: "Illinois" },
  OH: { center: [-82.8, 40.4], zoom: 4.5, label: "Ohio" },
  GA: { center: [-83.4, 32.6], zoom: 4, label: "Geórgia" },
  NC: { center: [-79.0, 35.5], zoom: 4, label: "Carolina do Norte" },
  MI: { center: [-85.4, 44.3], zoom: 3.5, label: "Michigan" },
  MA: { center: [-71.8, 42.3], zoom: 6, label: "Massachusetts" },
  WA: { center: [-120.7, 47.4], zoom: 4, label: "Washington" },
  AZ: { center: [-111.6, 34.2], zoom: 3.5, label: "Arizona" },
  CO: { center: [-105.5, 39.0], zoom: 4, label: "Colorado" },
  IN: { center: [-86.2, 39.9], zoom: 4.5, label: "Indiana" },
  TN: { center: [-86.5, 35.8], zoom: 4, label: "Tennessee" },
  VA: { center: [-78.6, 37.5], zoom: 4, label: "Virgínia" },
  NJ: { center: [-74.5, 40.2], zoom: 6, label: "Nova Jersey" },
  WI: { center: [-89.7, 44.5], zoom: 4, label: "Wisconsin" },
  MO: { center: [-92.5, 38.4], zoom: 4, label: "Missouri" },
  MN: { center: [-94.3, 46.0], zoom: 3.5, label: "Minnesota" },
  AL: { center: [-86.8, 32.8], zoom: 4.5, label: "Alabama" },
  LA: { center: [-91.9, 31.0], zoom: 4, label: "Louisiana" },
  KY: { center: [-84.6, 37.6], zoom: 4.5, label: "Kentucky" },
  OR: { center: [-120.5, 43.9], zoom: 3.5, label: "Oregon" },
  OK: { center: [-97.5, 35.6], zoom: 4, label: "Oklahoma" },
  CT: { center: [-72.7, 41.6], zoom: 7, label: "Connecticut" },
  IA: { center: [-93.5, 42.0], zoom: 4.5, label: "Iowa" },
  MS: { center: [-89.7, 32.7], zoom: 4.5, label: "Mississippi" },
  AR: { center: [-92.4, 34.8], zoom: 4.5, label: "Arkansas" },
  KS: { center: [-98.4, 38.5], zoom: 4, label: "Kansas" },
  UT: { center: [-111.5, 39.3], zoom: 4, label: "Utah" },
  NV: { center: [-117.0, 39.0], zoom: 3.5, label: "Nevada" },
  NM: { center: [-106.1, 34.4], zoom: 3.5, label: "Novo México" },
  NE: { center: [-99.7, 41.5], zoom: 4, label: "Nebraska" },
  WV: { center: [-80.6, 38.6], zoom: 5, label: "Virgínia Ocidental" },
  ID: { center: [-114.7, 44.1], zoom: 3.5, label: "Idaho" },
  HI: { center: [-157.5, 20.8], zoom: 5, label: "Havaí" },
  ME: { center: [-69.2, 45.4], zoom: 4.5, label: "Maine" },
  NH: { center: [-71.6, 43.7], zoom: 6, label: "New Hampshire" },
  RI: { center: [-71.5, 41.7], zoom: 9, label: "Rhode Island" },
  MT: { center: [-110.4, 47.0], zoom: 3, label: "Montana" },
  SD: { center: [-99.9, 44.4], zoom: 4, label: "Dakota do Sul" },
  ND: { center: [-100.5, 47.5], zoom: 4, label: "Dakota do Norte" },
  AK: { center: [-152.4, 64.2], zoom: 1.8, label: "Alasca" },
  DE: { center: [-75.5, 39.0], zoom: 8, label: "Delaware" },
  VT: { center: [-72.7, 44.0], zoom: 6, label: "Vermont" },
  WY: { center: [-107.3, 43.0], zoom: 3.5, label: "Wyoming" },
  SC: { center: [-81.0, 33.9], zoom: 4.5, label: "Carolina do Sul" },
  MD: { center: [-76.7, 39.0], zoom: 6, label: "Maryland" },
  DC: { center: [-77.0, 38.9], zoom: 10, label: "Washington DC" },
  // Canadá
  ON: { center: [-85.3, 50.0], zoom: 2.5, label: "Ontário" },
  QC: { center: [-71.8, 52.0], zoom: 2.5, label: "Quebec" },
  BC: { center: [-125.0, 54.0], zoom: 2.5, label: "Colúmbia Britânica" },
  AB: { center: [-115.0, 53.9], zoom: 3, label: "Alberta" },
  MB: { center: [-98.7, 53.7], zoom: 2.8, label: "Manitoba" },
  SK: { center: [-106.4, 54.0], zoom: 3, label: "Saskatchewan" },
  NS: { center: [-63.7, 45.0], zoom: 4.5, label: "Nova Escócia" },
  NB: { center: [-66.4, 46.5], zoom: 4.5, label: "Nova Brunswick" },
  NL: { center: [-57.7, 53.1], zoom: 2.5, label: "Terra Nova" },
  PE: { center: [-63.0, 46.4], zoom: 7, label: "Ilha do Príncipe Eduardo" },
  YT: { center: [-135.0, 64.0], zoom: 2, label: "Yukon" },
};

function UniMap({
  unis, favIds, pipeIds, onToggleFav, onAddPipeline,
}: {
  unis: Uni[]; favIds: Set<string>; pipeIds: Set<string>;
  onToggleFav: (uId: string) => Promise<void>;
  onAddPipeline: (uId: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<Uni | null>(null);
  const [hovered, setHovered] = useState<{ u: Uni; x: number; y: number } | null>(null);
  const [mapFilter, setMapFilter] = useState<"all" | "fav" | "pipe" | "high">("all");
  const [zoomState, setZoomState] = useState<string>("ALL");
  const [Maps, setMaps] = useState<typeof import("react-simple-maps") | null>(null);

  useEffect(() => {
    let mounted = true;
    import("react-simple-maps").then(m => { if (mounted) setMaps(m); });
    return () => { mounted = false; };
  }, []);

  const ptsAll = useMemo(
    () => unis.filter(u => {
      const lat = Number(u.latitude);
      const lng = Number(u.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 20 && lat <= 75 && lng >= -170 && lng <= -50;
    }),
    [unis]
  );

  const pts = useMemo(() => {
    let arr = ptsAll;
    if (mapFilter === "fav") arr = arr.filter(u => favIds.has(u.id));
    else if (mapFilter === "pipe") arr = arr.filter(u => pipeIds.has(u.id));
    else if (mapFilter === "high") arr = arr.filter(u => u.acceptance_chance === "high");
    if (zoomState !== "ALL") arr = arr.filter(u => u.state === zoomState);
    return arr;
  }, [ptsAll, mapFilter, favIds, pipeIds, zoomState]);

  const total = ptsAll.length;
  const favCount = ptsAll.filter(u => favIds.has(u.id)).length;
  const pipeCount = ptsAll.filter(u => pipeIds.has(u.id)).length;
  const highCount = ptsAll.filter(u => u.acceptance_chance === "high").length;

  const colorOf = (u: Uni) => {
    if (favIds.has(u.id)) return "fill-accent";
    if (pipeIds.has(u.id)) return "fill-primary";
    if (u.acceptance_chance === "high") return "fill-success";
    return "fill-muted-foreground/50";
  };

  const TabBtn = ({ v, label, count, dotClass }: { v: typeof mapFilter; label: string; count: number; dotClass: string }) => (
    <button
      onClick={() => setMapFilter(v)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-smooth border flex items-center gap-1.5 ${
        mapFilter === v
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          <TabBtn v="all" label="Todas" count={total} dotClass="bg-muted-foreground/60" />
          <TabBtn v="fav" label="Favoritas" count={favCount} dotClass="bg-accent" />
          <TabBtn v="pipe" label="Pipeline" count={pipeCount} dotClass="bg-primary" />
          <TabBtn v="high" label="+ chance" count={highCount} dotClass="bg-success" />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={zoomState}
            onChange={(e) => setZoomState(e.target.value)}
            className="text-xs rounded-md border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="ALL">🌎 Todos os estados</option>
            <optgroup label="Estados Unidos">
              {Array.from(new Set(ptsAll.filter(u => u.country === "USA").map(u => u.state)))
                .filter(s => s && STATE_CENTERS[s])
                .sort()
                .map(s => <option key={s} value={s}>{STATE_CENTERS[s]?.label ?? s}</option>)}
            </optgroup>
            <optgroup label="Canadá">
              {Array.from(new Set(ptsAll.filter(u => u.country === "CANADA").map(u => u.state)))
                .filter(s => s && STATE_CENTERS[s])
                .sort()
                .map(s => <option key={s} value={s}>{STATE_CENTERS[s]?.label ?? s}</option>)}
            </optgroup>
          </select>
          {zoomState !== "ALL" && (
            <button onClick={() => setZoomState("ALL")} className="text-xs text-muted-foreground hover:text-foreground underline">
              resetar zoom
            </button>
          )}
          {selected && (
            <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground underline">limpar seleção</button>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card" style={{ minHeight: 420 }}>
        {!Maps ? (
          <div className="flex items-center justify-center h-[420px] text-sm text-muted-foreground">
            Carregando mapa...
          </div>
        ) : (
          <Maps.ComposableMap
            projection="geoAlbers"
            projectionConfig={{
              rotate: [98, 0, 0],
              center: [0, 48],
              parallels: [29.5, 60],
              scale: 700,
            }}
            width={980}
            height={560}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <Maps.ZoomableGroup
              center={zoomState !== "ALL" && STATE_CENTERS[zoomState] ? STATE_CENTERS[zoomState].center : [-95, 50]}
              zoom={zoomState !== "ALL" && STATE_CENTERS[zoomState] ? STATE_CENTERS[zoomState].zoom : 1}
              minZoom={1}
              maxZoom={12}
            >
            <Maps.Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name: string } }> }) =>
                geographies
                  .filter(g => g.properties && (g.properties.name === "United States of America" || g.properties.name === "Canada"))
                  .map(geo => (
                    <Maps.Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className="fill-muted stroke-border"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
              }
            </Maps.Geographies>

            {/* Plain dots first */}
            {pts.filter(u => !favIds.has(u.id) && !pipeIds.has(u.id)).map(u => (
              <Maps.Marker key={u.id} coordinates={[Number(u.longitude), Number(u.latitude)]}>
                <circle
                  r={1.8}
                  className={`${colorOf(u)} hover:opacity-100 cursor-pointer transition-opacity`}
                  onMouseEnter={(e) => setHovered({ u, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setHovered({ u, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(u)}
                />
              </Maps.Marker>
            ))}
            {/* Pipeline */}
            {pts.filter(u => pipeIds.has(u.id) && !favIds.has(u.id)).map(u => (
              <Maps.Marker key={u.id} coordinates={[Number(u.longitude), Number(u.latitude)]}>
                <circle r={6} className="fill-primary/25">
                  <animate attributeName="r" from="3" to="7" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle
                  r={3}
                  className="fill-primary cursor-pointer"
                  onMouseEnter={(e) => setHovered({ u, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setHovered({ u, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(u)}
                />
              </Maps.Marker>
            ))}
            {/* Favorites on top */}
            {pts.filter(u => favIds.has(u.id)).map(u => (
              <Maps.Marker key={u.id} coordinates={[Number(u.longitude), Number(u.latitude)]}>
                <circle r={6.5} className="fill-accent/25">
                  <animate attributeName="r" from="3.5" to="8" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle
                  r={3.5}
                  className="fill-accent cursor-pointer"
                  onMouseEnter={(e) => setHovered({ u, x: e.clientX, y: e.clientY })}
                  onMouseMove={(e) => setHovered({ u, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(u)}
                />
              </Maps.Marker>
            ))}

            {/* Selected pulse */}
            {selected && selected.latitude != null && selected.longitude != null && (
              <Maps.Marker coordinates={[Number(selected.longitude), Number(selected.latitude)]}>
                <circle r={9} className="fill-none stroke-primary" strokeWidth={1.5} opacity={0.7}>
                  <animate attributeName="r" from="5" to="14" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.8" to="0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              </Maps.Marker>
            )}
            </Maps.ZoomableGroup>
          </Maps.ComposableMap>
        )}

        {/* Hover tooltip */}
        {hovered && !selected && (
          <div
            className="pointer-events-none fixed z-50 bg-popover text-popover-foreground border border-border rounded-md shadow-lg px-2.5 py-1.5 text-xs"
            style={{ left: hovered.x + 12, top: hovered.y + 12 }}
          >
            <div className="font-semibold">{hovered.u.name}</div>
            <div className="text-muted-foreground">
              {[hovered.u.state, hovered.u.country === "USA" ? "EUA" : "Canadá"].filter(Boolean).join(", ")}
              {hovered.u.division && hovered.u.division !== "NONE" ? ` · ${hovered.u.division.replace("_", " ")}` : ""}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full ${
                    hovered.u.acceptance_chance === "high" ? "bg-success w-full" :
                    hovered.u.acceptance_chance === "low" ? "bg-destructive w-1/4" : "bg-warning w-2/3"
                  }`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {hovered.u.acceptance_chance === "high" ? "Alta" : hovered.u.acceptance_chance === "low" ? "Baixa" : "Média"}
              </span>
            </div>
          </div>
        )}

        {/* Selected info card overlay */}
        {selected && (
          <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:max-w-sm">
            <Card className="p-3 shadow-elegant border-primary/20">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm truncate">{selected.name}</h4>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {[selected.city, selected.state, selected.country === "USA" ? "EUA" : "Canadá"].filter(Boolean).join(", ")}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="secondary" className="text-[10px]">{selected.type === "community_college" ? "Community" : selected.type === "college" ? "College" : "University"}</Badge>
                    <Badge variant="outline" className="text-[10px]">{selected.nature === "public" ? "Pública" : "Privada"}</Badge>
                    {selected.division && selected.division !== "NONE" && <Badge variant="outline" className="text-[10px]">{selected.division.replace("_", " ")}</Badge>}
                    {selected.scholarship_available && <Badge className="bg-success text-success-foreground text-[10px]">Bolsa</Badge>}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${selected.estimated_cost_usd?.toLocaleString() ?? "—"}/ano</span>
                    <span>·</span>
                    <span>Chance: <span className={
                      selected.acceptance_chance === "high" ? "text-success font-medium" :
                      selected.acceptance_chance === "low" ? "text-destructive font-medium" : "text-warning font-medium"
                    }>
                      {selected.acceptance_chance === "high" ? "Alta" : selected.acceptance_chance === "low" ? "Baixa" : "Média"}
                    </span></span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-muted text-muted-foreground shrink-0">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant={favIds.has(selected.id) ? "secondary" : "outline"}
                  className="flex-1 h-8 text-xs"
                  onClick={() => onToggleFav(selected.id)}
                >
                  <Star className={`h-3.5 w-3.5 mr-1 ${favIds.has(selected.id) ? "fill-accent text-accent" : ""}`} />
                  {favIds.has(selected.id) ? "Favorita" : "Favoritar"}
                </Button>
                <Button
                  size="sm"
                  variant={pipeIds.has(selected.id) ? "secondary" : "default"}
                  className="flex-1 h-8 text-xs"
                  disabled={pipeIds.has(selected.id)}
                  onClick={() => onAddPipeline(selected.id)}
                >
                  {pipeIds.has(selected.id) ? <><Check className="h-3.5 w-3.5 mr-1" /> Pipeline</> : <><Plus className="h-3.5 w-3.5 mr-1" /> Pipeline</>}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Passe o mouse para detalhes · Clique para ações · Filtros aplicam ao mapa
      </p>
    </Card>
  );
}
