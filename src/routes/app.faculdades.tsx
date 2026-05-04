import { createFileRoute } from "@tanstack/react-router";
import { Component, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";

const LeafletMap = lazy(() => import("@/components/colleges/LeafletMap"));
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Star, Plus, MapPin, DollarSign, Check, Search, SlidersHorizontal, X, ChevronDown, Globe, GraduationCap, Trophy, Map as MapIcon, List, LayoutGrid, ArrowUpDown, UserCircle2, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CollegeRecommendations } from "@/components/colleges/CollegeRecommendations";
import { ProfileCompatibilityCard } from "@/components/colleges/ProfileCompatibilityCard";
import { CompactFilterBar } from "@/components/colleges/CompactFilterBar";
import { UniversityDetailDialog } from "@/components/colleges/UniversityDetailDialog";

export const Route = createFileRoute("/app/faculdades")({ component: FaculdadesPage });

type Uni = {
  id: string; name: string; country: string; state: string; city: string | null;
  type: string; nature: string; division: string | null;
  estimated_cost_usd: number | null; scholarship_available: boolean;
  acceptance_chance: string | null;
  latitude: number | null; longitude: number | null;
  website: string | null;
};

type PipelineRow = {
  email_sent: boolean;
  response_received: boolean;
  applied: boolean;
  interest_level: string | null;
  notes: string | null;
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
  const { user, profile } = useAuth();
  const [unis, setUnis] = useState<Uni[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [pipeIds, setPipeIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("ALL");
  const [type, setType] = useState<string>("ALL");
  const [division, setDivision] = useState<string>("ALL");
  const [state, setState] = useState<string>("ALL");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recommended" | "cost_asc" | "cost_desc" | "chance" | "az">("recommended");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [costRange, setCostRange] = useState<[number, number]>([0, 80000]);
  const [minChance, setMinChance] = useState(0);

  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [selectedUni, setSelectedUni] = useState<Uni | null>(null);

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

  const filteredRaw = useMemo(() => unis.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !(u.city ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (country !== "ALL" && u.country !== country) return false;
    if (type !== "ALL" && u.type !== type) return false;
    if (division !== "ALL" && u.division !== division) return false;
    if (state !== "ALL" && u.state !== state) return false;
    if (scholarshipOnly && !u.scholarship_available) return false;
    const cost = u.estimated_cost_usd;
    if (cost != null && (cost < costRange[0] || cost > costRange[1])) return false;
    if (minChance > 0) {
      const pct = u.acceptance_chance === "high" ? 80 : u.acceptance_chance === "medium" ? 50 : u.acceptance_chance === "low" ? 20 : 0;
      if (pct < minChance) return false;
    }
    return true;
  }), [unis, search, country, type, division, state, scholarshipOnly, costRange, minChance]);

  const filtered = useMemo(() => {
    const arr = [...filteredRaw];
    const chanceRank = (c: string | null) => c === "high" ? 3 : c === "medium" ? 2 : c === "low" ? 1 : 0;
    switch (sortBy) {
      case "cost_asc": arr.sort((a, b) => (a.estimated_cost_usd ?? Infinity) - (b.estimated_cost_usd ?? Infinity)); break;
      case "cost_desc": arr.sort((a, b) => (b.estimated_cost_usd ?? -1) - (a.estimated_cost_usd ?? -1)); break;
      case "chance": arr.sort((a, b) => chanceRank(b.acceptance_chance) - chanceRank(a.acceptance_chance)); break;
      case "az": arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      default:
        // recomendado: alta chance + bolsa primeiro, depois custo asc
        arr.sort((a, b) => {
          const sa = chanceRank(a.acceptance_chance) * 2 + (a.scholarship_available ? 1 : 0);
          const sb = chanceRank(b.acceptance_chance) * 2 + (b.scholarship_available ? 1 : 0);
          if (sb !== sa) return sb - sa;
          return (a.estimated_cost_usd ?? Infinity) - (b.estimated_cost_usd ?? Infinity);
        });
    }
    return arr;
  }, [filteredRaw, sortBy]);

  useEffect(() => { setVisibleCount(20); }, [search, country, type, division, state, scholarshipOnly, sortBy]);

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

  const togglePipeline = async (uId: string) => {
    if (!user) return;
    if (pipeIds.has(uId)) {
      setPipeIds(prev => { const n = new Set(prev); n.delete(uId); return n; });
      await supabase.from("pipeline").delete().eq("user_id", user.id).eq("university_id", uId);
      toast.success("Removida do pipeline");
    } else {
      setPipeIds(prev => new Set(prev).add(uId));
      await supabase.from("pipeline").insert({ user_id: user.id, university_id: uId, status: "interest" });
      toast.success("Adicionada ao pipeline");
    }
  };

  const UniRow = ({ u }: { u: Uni }) => {
    const isFav = favIds.has(u.id);
    const inPipe = pipeIds.has(u.id);
    return (
      <div className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-muted/40 transition-smooth">
        <div className="col-span-4 min-w-0">
          <div className="font-medium text-sm truncate">{u.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{[u.city, u.state].filter(Boolean).join(", ")}</div>
        </div>
        <div className="col-span-2 text-xs text-muted-foreground truncate">
          {u.division && u.division !== "NONE" ? u.division.replace("_", " ") : "—"}
        </div>
        <div className="col-span-2 text-xs">
          ${u.estimated_cost_usd?.toLocaleString() ?? "—"}
          {u.scholarship_available && <span className="ml-1.5 text-success">• bolsa</span>}
        </div>
        <div className="col-span-2 text-xs">
          <span className={
            u.acceptance_chance === "high" ? "text-success font-medium" :
            u.acceptance_chance === "low" ? "text-destructive font-medium" : "text-warning font-medium"
          }>
            {u.acceptance_chance === "high" ? "Alta" : u.acceptance_chance === "low" ? "Baixa" : "Média"}
          </span>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-1">
          <button onClick={() => toggleFav(u.id)} className="p-1.5 rounded hover:bg-muted">
            <Star className={`h-4 w-4 ${isFav ? "fill-accent text-accent" : "text-muted-foreground"}`} />
          </button>
          <Button size="sm" variant={inPipe ? "secondary" : "default"} className="h-7 px-2 text-[11px]" onClick={() => togglePipeline(u.id)}>
            {inPipe ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    );
  };


  const FilterDropdown = ({ icon: Icon, label, value, onClear, children }: { icon: typeof Globe; label: string; value: string | null; onClear: () => void; children: React.ReactNode }) => {
    const active = value !== null;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-medium transition-smooth ${
              active
                ? "bg-primary/10 border-primary/40 text-foreground"
                : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            {active && (
              <>
                <span className="text-foreground">·</span>
                <span className="text-primary font-semibold max-w-[110px] truncate">{value}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClear(); }}
                  className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-background/50"
                >
                  <X className="h-3 w-3" />
                </span>
              </>
            )}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto min-w-[220px] p-2">
          <div className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase px-1 pb-2">{label}</div>
          {children}
        </PopoverContent>
      </Popover>
    );
  };

  const OptionRow = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-smooth flex items-center justify-between gap-2 ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <span className="truncate">{children}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );

  const UniCard = ({ u }: { u: Uni }) => {
    const isFav = favIds.has(u.id);
    const inPipe = pipeIds.has(u.id);
    return (
      <Card
        onClick={() => setSelectedUni(u)}
        className="p-5 cursor-pointer transition-smooth hover:shadow-elegant hover:-translate-y-0.5 hover:border-[#A855F7]/40"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{u.name}</h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> {[u.city, u.state, u.country === "USA" ? "EUA" : "Canadá"].filter(Boolean).join(", ")}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFav(u.id); }}
            className="shrink-0 p-2 -m-2 transition-smooth"
          >
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

        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant={inPipe ? "secondary" : "default"}
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); togglePipeline(u.id); }}
          >
            {inPipe ? <><Check className="h-3.5 w-3.5 mr-1.5" /> No pipeline</> : <><Plus className="h-3.5 w-3.5 mr-1.5" /> Pipeline</>}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); setSelectedUni(u); }}
          >
            Saber mais
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
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

      {/* AI Recommendations — TOPO, acima das tabs (Resultados/Favoritos/Mapa) */}
      {user && unis.length > 0 && (
        <CollegeRecommendations
          userId={user.id}
          profile={{ fullName: user.user_metadata?.full_name }}
          universities={unis.slice(0, 250).map(u => ({
            id: u.id, name: u.name, state: u.state, country: u.country,
            division: u.division, estimated_cost_usd: u.estimated_cost_usd,
            scholarship_available: u.scholarship_available, acceptance_chance: u.acceptance_chance,
          }))}
          favIds={favIds}
          pipeIds={pipeIds}
          onToggleFav={(id) => { void toggleFav(id); }}
          onAddPipeline={(id) => { void togglePipeline(id); }}
        />
      )}

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

          {/* Quick insights baseados nos filtros atuais */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {(() => {
                const withCost = filtered.filter(u => u.estimated_cost_usd != null);
                const avg = withCost.length ? Math.round(withCost.reduce((s, u) => s + (u.estimated_cost_usd ?? 0), 0) / withCost.length) : 0;
                const schol = filtered.filter(u => u.scholarship_available).length;
                const high = filtered.filter(u => u.acceptance_chance === "high").length;
                const lowCost = filtered.filter(u => (u.estimated_cost_usd ?? Infinity) < 30000).length;
                const stats = [
                  { label: "Custo médio/ano", value: avg ? `US$ ${avg.toLocaleString()}` : "—", ring: "ring-[oklch(0.62_0.22_305)]/30", bg: "from-[oklch(0.62_0.22_305)]/15 to-[oklch(0.62_0.22_305)]/5", Icon: DollarSign },
                  { label: "Com bolsa", value: `${schol} (${Math.round(schol / filtered.length * 100)}%)`, ring: "ring-success/30", bg: "from-success/15 to-success/5", Icon: Trophy },
                  { label: "Alta chance", value: high.toLocaleString(), ring: "ring-[oklch(0.72_0.20_38)]/30", bg: "from-[oklch(0.72_0.20_38)]/15 to-[oklch(0.72_0.20_38)]/5", Icon: Star },
                  { label: "Custo até $30k", value: lowCost.toLocaleString(), ring: "ring-[oklch(0.63_0.20_255)]/30", bg: "from-[oklch(0.63_0.20_255)]/15 to-[oklch(0.63_0.20_255)]/5", Icon: GraduationCap },
                ];
                return stats.map((s, i) => (
                  <div key={i} className={`rounded-xl bg-gradient-to-br ${s.bg} ring-1 ${s.ring} p-3 flex items-center gap-2.5`}>
                    <div className="h-9 w-9 rounded-lg bg-card/70 backdrop-blur flex items-center justify-center shrink-0">
                      <s.Icon className="h-4 w-4 text-foreground/80" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</div>
                      <div className="text-sm font-bold truncate">{s.value}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Compatibilidade do perfil */}
          {(() => {
            const fields: Array<unknown> = [
              profile?.full_name, profile?.username, profile?.email, profile?.avatar_url,
              (profile as Record<string, unknown> | null)?.age,
              (profile as Record<string, unknown> | null)?.english_level,
              (profile as Record<string, unknown> | null)?.education_level,
              (profile as Record<string, unknown> | null)?.target_country,
              (profile as Record<string, unknown> | null)?.main_goal,
              favIds.size > 0 ? true : null,
            ];
            const filled = fields.filter(Boolean).length;
            const pct = Math.round((filled / fields.length) * 100);
            const recs = filtered.slice(0, 3).map((u, i) => ({
              id: u.id,
              name: u.name,
              country: u.country,
              state: u.state,
              match: 95 - i * 4,
            }));
            return <ProfileCompatibilityCard percent={pct} recommendations={recs} />;
          })()}

          {/* Filtros compactos: Custo / Chance / Bolsa */}
          <CompactFilterBar
            costRange={costRange}
            onCostChange={setCostRange}
            minChance={minChance}
            onMinChanceChange={setMinChance}
            scholarshipOnly={scholarshipOnly}
            onScholarshipChange={setScholarshipOnly}
          />

          {/* Search + filters */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
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

              <FilterDropdown
                icon={Globe}
                label="País"
                value={country === "ALL" ? null : COUNTRY_OPTIONS.find(o => o.v === country)?.l ?? null}
                onClear={() => { setCountry("ALL"); setState("ALL"); }}
              >
                <div className="flex flex-col gap-1">
                  {COUNTRY_OPTIONS.map(o => (
                    <OptionRow key={o.v} active={country === o.v} onClick={() => { setCountry(o.v); setState("ALL"); }}>{o.l}</OptionRow>
                  ))}
                </div>
              </FilterDropdown>

              <FilterDropdown
                icon={GraduationCap}
                label="Tipo"
                value={type === "ALL" ? null : TYPE_OPTIONS.find(o => o.v === type)?.l ?? null}
                onClear={() => setType("ALL")}
              >
                <div className="flex flex-col gap-1">
                  {TYPE_OPTIONS.map(o => (
                    <OptionRow key={o.v} active={type === o.v} onClick={() => setType(o.v)}>{o.l}</OptionRow>
                  ))}
                </div>
              </FilterDropdown>

              <FilterDropdown
                icon={Trophy}
                label="Divisão"
                value={division === "ALL" ? null : DIVISION_OPTIONS.find(o => o.v === division)?.l ?? null}
                onClear={() => setDivision("ALL")}
              >
                <div className="grid grid-cols-2 gap-1">
                  {DIVISION_OPTIONS.map(o => (
                    <OptionRow key={o.v} active={division === o.v} onClick={() => setDivision(o.v)}>{o.l}</OptionRow>
                  ))}
                </div>
              </FilterDropdown>

              <FilterDropdown
                icon={MapIcon}
                label={country === "CANADA" ? "Província" : "Estado"}
                value={state === "ALL" ? null : state}
                onClear={() => setState("ALL")}
              >
                <div className="space-y-2">
                  <OptionRow active={state === "ALL"} onClick={() => setState("ALL")}>Todos</OptionRow>
                  <div className="grid grid-cols-4 gap-1 max-h-56 overflow-y-auto pr-1">
                    {states.map(s => (
                      <OptionRow key={s} active={state === s} onClick={() => setState(s)}>{s}</OptionRow>
                    ))}
                  </div>
                </div>
              </FilterDropdown>

              <FilterDropdown
                icon={DollarSign}
                label="Bolsas"
                value={scholarshipOnly ? "Com bolsa" : null}
                onClear={() => setScholarshipOnly(false)}
              >
                <div className="flex flex-col gap-1">
                  <OptionRow active={!scholarshipOnly} onClick={() => setScholarshipOnly(false)}>Todas</OptionRow>
                  <OptionRow active={scholarshipOnly} onClick={() => setScholarshipOnly(true)}>Apenas com bolsa</OptionRow>
                </div>
              </FilterDropdown>

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline px-2">
                  limpar tudo
                </button>
              )}
            </div>
          </Card>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wide mr-1">Filtros:</span>
              {country !== "ALL" && (
                <button onClick={() => { setCountry("ALL"); setState("ALL"); }} className="inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full text-[11px] bg-primary/10 border border-primary/30 text-foreground hover:bg-primary/15">
                  {COUNTRY_OPTIONS.find(o => o.v === country)?.l} <X className="h-3 w-3" />
                </button>
              )}
              {type !== "ALL" && (
                <button onClick={() => setType("ALL")} className="inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full text-[11px] bg-primary/10 border border-primary/30 text-foreground hover:bg-primary/15">
                  {TYPE_OPTIONS.find(o => o.v === type)?.l} <X className="h-3 w-3" />
                </button>
              )}
              {division !== "ALL" && (
                <button onClick={() => setDivision("ALL")} className="inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full text-[11px] bg-primary/10 border border-primary/30 text-foreground hover:bg-primary/15">
                  {DIVISION_OPTIONS.find(o => o.v === division)?.l} <X className="h-3 w-3" />
                </button>
              )}
              {state !== "ALL" && (
                <button onClick={() => setState("ALL")} className="inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full text-[11px] bg-primary/10 border border-primary/30 text-foreground hover:bg-primary/15">
                  {state} <X className="h-3 w-3" />
                </button>
              )}
              {scholarshipOnly && (
                <button onClick={() => setScholarshipOnly(false)} className="inline-flex items-center gap-1 h-6 pl-2 pr-1.5 rounded-full text-[11px] bg-success/15 border border-success/40 text-foreground hover:bg-success/20">
                  Com bolsa <X className="h-3 w-3" />
                </button>
              )}
              <button onClick={clearFilters} className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1">limpar tudo</button>
            </div>
          )}

          <div className="text-sm text-muted-foreground flex items-center justify-between gap-2 flex-wrap">
            <span>
              {loading ? "Carregando..." : (
                <>
                  <span className="font-semibold text-foreground">{filtered.length.toLocaleString()}</span> resultado{filtered.length !== 1 ? "s" : ""}
                  {visible.length < filtered.length && ` (mostrando ${visible.length})`}
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-8 pl-7 pr-7 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="recommended">Recomendado</option>
                  <option value="cost_asc">Custo ↑</option>
                  <option value="cost_desc">Custo ↓</option>
                  <option value="chance">+ chance</option>
                  <option value="az">A–Z</option>
                </select>
              </div>
              <div className="inline-flex rounded-md border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`h-8 px-2.5 text-xs flex items-center gap-1 transition-smooth ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`h-8 px-2.5 text-xs flex items-center gap-1 transition-smooth ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
                >
                  <List className="h-3.5 w-3.5" /> Lista
                </button>
              </div>
            </div>
          </div>

          {viewMode === "grid" ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(u => <UniCard key={u.id} u={u} />)}
            </div>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-border">
                {visible.map(u => <UniRow key={u.id} u={u} />)}
              </div>
            </Card>
          )}

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
              <Button variant="outline" onClick={() => setVisibleCount(c => c + 20)}>
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
              onAddPipeline={togglePipeline}
            />
          </MapErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Map (Leaflet/OSM) ---------------- */

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

const STATE_CENTERS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
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
  const [mapFilter, setMapFilter] = useState<"all" | "fav" | "pipe" | "high">("all");
  const [zoomState, setZoomState] = useState<string>("ALL");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ptsAll = useMemo(
    () => unis.filter(u => {
      const lat = Number(u.latitude); const lng = Number(u.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng);
    }),
    [unis]
  );

  const filteredForMap = useMemo(() => {
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
        </div>
      </div>

      {mounted ? (
        <Suspense fallback={<div className="h-[480px] flex items-center justify-center text-sm text-muted-foreground border border-border rounded-lg">Carregando mapa...</div>}>
          <LeafletMap
            unis={filteredForMap}
            favIds={favIds}
            pipeIds={pipeIds}
            onToggleFav={(id) => { void onToggleFav(id); }}
            onAddPipeline={(id) => { void onAddPipeline(id); }}
            zoomState={zoomState}
            stateCenters={STATE_CENTERS}
          />
        </Suspense>
      ) : (
        <div className="h-[480px] flex items-center justify-center text-sm text-muted-foreground border border-border rounded-lg">Inicializando...</div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        Clique nos pontos para ver detalhes · Pontos laranja = favoritas · Lilás = pipeline · Clusters agrupam pontos próximos
      </p>
    </Card>
  );
}
