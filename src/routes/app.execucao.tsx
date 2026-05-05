import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { 
  AlertTriangle, GripVertical, History, Mail, 
  Sparkles, X, MapPin, DollarSign, Trophy, 
  Check, Archive, ExternalLink, Activity, Info, Plus, GraduationCap,
  ListChecks, Calendar as CalendarIcon, FileText
} from "lucide-react";
import { AIEmailGenerator } from "@/components/colleges/AIEmailGenerator";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PrazosPage } from "./app.prazos";
import { DocumentosPage } from "./app.documentos";

export const Route = createFileRoute("/app/execucao")({ component: ExecucaoPage });

type Row = {
  id: string;
  status: string;
  notes: string | null;
  email_sent: boolean | null;
  response_received: boolean | null;
  applied: boolean | null;
  interest_level: string | null;
  last_activity_at: string | null;
  updated_at: string;
  university_id: string;
  universities: { 
    id: string;
    name: string; 
    country: string; 
    state: string; 
    city: string | null;
    estimated_cost_usd: number | null; 
    division: string | null; 
    acceptance_chance: string | null;
    website?: string | null;
  } | null;
};

type HistoryRow = { 
  id: string; 
  from_status: string | null; 
  to_status: string; 
  created_at: string; 
  note: string | null 
};

const COLUMNS = [
  { key: "interest", label: "Interesse", color: "border-[#F59E0B]", bg: "bg-[#F59E0B]/10", text: "text-[#F59E0B]" },
  { key: "email_sent", label: "Email Enviado", color: "border-[#3B82F6]", bg: "bg-[#3B82F6]/10", text: "text-[#3B82F6]" },
  { key: "response", label: "Resposta Recebida", color: "border-[#A855F7]", bg: "bg-[#A855F7]/10", text: "text-[#A855F7]" },
  { key: "applied", label: "Aplicado", color: "border-[#FF6B2B]", bg: "bg-[#FF6B2B]/10", text: "text-[#FF6B2B]" },
  { key: "accepted", label: "Aceito", color: "border-[#10B981]", bg: "bg-[#10B981]/10", text: "text-[#10B981]" },
  { key: "rejected", label: "Rejeitado", color: "border-[#EF4444]", bg: "bg-[#EF4444]/10", text: "text-[#EF4444]", collapsible: true },
];

function daysSince(iso: string | null) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function ExecucaoPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [emailGenFor, setEmailGenFor] = useState<Row | null>(null);
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set(["rejected"]));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pipeline")
      .select("id, status, notes, email_sent, response_received, applied, interest_level, last_activity_at, updated_at, university_id, universities(id, name, country, state, city, estimated_cost_usd, division, acceptance_chance, website)")
      .eq("user_id", user.id);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const loadHistory = async (pipelineId: string) => {
    const { data } = await supabase
      .from("pipeline_history")
      .select("id, from_status, to_status, created_at, note")
      .eq("pipeline_id", pipelineId)
      .order("created_at", { ascending: false });
    setHistory((data as HistoryRow[]) ?? []);
  };

  const updateRow = async (id: string, patch: Partial<Row>, statusChange?: { from: string; to: string }) => {
    const { universities: _u, ...rest } = patch;
    void _u;
    const { error } = await supabase.from("pipeline").update({ ...rest, last_activity_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    
    if (statusChange && user) {
      await supabase.from("pipeline_history").insert({
        pipeline_id: id, user_id: user.id, from_status: statusChange.from, to_status: statusChange.to,
      });
      
      if (statusChange.to === "accepted") {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#10B981", "#A855F7", "#FF6B2B"] });
      }
    }
    
    await load();
    if (editing?.id === id) {
      const next = { ...editing, ...patch } as Row;
      setEditing(next);
      loadHistory(id);
    }
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const row = rows.find(r => r.id === e.active.id);
    if (!row || row.status === overId) return;
    
    updateRow(row.id, { status: overId }, { from: row.status, to: overId });
    toast.success(`Movido para ${COLUMNS.find(c => c.key === overId)?.label ?? overId}`);
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const inProgress = rows.filter(r => r.status !== "interest" && r.status !== "rejected" && r.status !== "accepted").length;
    const accepted = rows.filter(r => r.status === "accepted").length;
    
    // Overall progress: sum of status indices / (total * max index)
    const statusOrder = COLUMNS.map(c => c.key);
    const progressSum = rows.reduce((acc, r) => acc + Math.max(0, statusOrder.indexOf(r.status)), 0);
    const maxPossible = total * (statusOrder.length - 2); // excluding rejected and interest as start/end
    const overallProgress = total > 0 ? Math.min(100, Math.round((progressSum / maxPossible) * 100)) : 0;
    
    return { total, inProgress, accepted, overallProgress };
  }, [rows]);

  if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Carregando pipeline...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black font-display tracking-tight">CRM</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Acompanhe sua jornada de candidatura em cada universidade
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progresso Geral</div>
              <div className="flex items-center gap-3">
                <Progress value={stats.overallProgress} className="w-32 h-2">
                  <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${stats.overallProgress}%` }} />
                </Progress>
                <span className="text-sm font-bold text-primary">{stats.overallProgress}%</span>
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-center">
                <div className="text-xl font-black">{stats.total}</div>
                <div className="text-[9px] font-bold uppercase text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-black text-primary">{stats.inProgress}</div>
                <div className="text-[9px] font-bold uppercase text-muted-foreground">Em andamento</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-black text-success">{stats.accepted}</div>
                <div className="text-[9px] font-bold uppercase text-muted-foreground">Aceitas</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/app/faculdades">Ver Ranking</Link>
          </Button>
          <Button className="bg-gradient-primary text-white font-bold" asChild>
            <Link to="/app/faculdades">+ Adicionar Universidade</Link>
          </Button>
        </div>
      </header>

      {/* CRM Tabs: Pipeline / Prazos / Documentos */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="bg-muted border border-border p-1 h-auto rounded-xl">
          <TabsTrigger value="pipeline" className="gap-2 px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
            <ListChecks className="h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="prazos" className="gap-2 px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
            <CalendarIcon className="h-4 w-4" /> Prazos
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2 px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-wider">
            <FileText className="h-4 w-4" /> Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide min-h-[70vh]">
              {COLUMNS.map(col => (
                <Column 
                  key={col.key} 
                  col={col} 
                  rows={rows.filter(r => r.status === col.key)} 
                  isCollapsed={collapsedCols.has(col.key)}
                  onToggleCollapse={() => {
                    const next = new Set(collapsedCols);
                    if (next.has(col.key)) next.delete(col.key); else next.add(col.key);
                    setCollapsedCols(next);
                  }}
                  onOpen={(r) => { setEditing(r); loadHistory(r.id); }} 
                  onEmail={(r) => setEmailGenFor(r)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeId ? (() => {
                const r = rows.find(x => x.id === activeId);
                return r ? <KanbanCard row={r} dragging /> : null;
              })() : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        <TabsContent value="prazos" className="mt-6 -mx-6 md:-mx-10">
          <PrazosPage />
        </TabsContent>

        <TabsContent value="documentos" className="mt-6 -mx-6 md:-mx-10">
          <DocumentosPage />
        </TabsContent>
      </Tabs>


      {/* Expanded Dialog */}
      <EditDialog
        row={editing}
        history={history}
        onClose={() => setEditing(null)}
        onChange={(patch) => {
          if (!editing) return;
          const statusOrder = COLUMNS.map(c => c.key);
          const currentIdx = statusOrder.indexOf(editing.status);
          
          // Heuristic to suggest moving to next column
          let suggestedStatus = "";
          if (patch.email_sent && editing.status === "interest") suggestedStatus = "email_sent";
          else if (patch.response_received && editing.status === "email_sent") suggestedStatus = "response";
          else if (patch.applied && editing.status === "response") suggestedStatus = "applied";
          
          updateRow(editing.id, patch);

          if (suggestedStatus) {
            const colLabel = COLUMNS.find(c => c.key === suggestedStatus)?.label;
            toast(`Deseja mover para '${colLabel}'?`, {
              action: {
                label: "Mover agora",
                onClick: () => updateRow(editing.id, { status: suggestedStatus }, { from: editing.status, to: suggestedStatus })
              }
            });
          }
        }}
        onMove={(toStatus) => editing && updateRow(editing.id, { status: toStatus }, { from: editing.status, to: toStatus })}
        onArchive={() => { 
          if (editing) { 
            updateRow(editing.id, { status: "rejected" }, { from: editing.status, to: "rejected" }); 
            setEditing(null); 
          } 
        }}
        onGenerateEmail={() => { setEmailGenFor(editing); setEditing(null); }}
      />

      {emailGenFor && (
        <AIEmailGenerator 
          isOpen={!!emailGenFor}
          onClose={() => setEmailGenFor(null)}
          universityName={emailGenFor.universities?.name ?? ""}
          onMarkAsSent={() => updateRow(emailGenFor.id, { email_sent: true })}
        />
      )}
    </div>
  );
}

function Column({ col, rows, isCollapsed, onToggleCollapse, onOpen, onEmail }: { 
  col: typeof COLUMNS[number]; 
  rows: Row[]; 
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
  onOpen: (r: Row) => void; 
  onEmail: (r: Row) => void 
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  
  if (isCollapsed && col.collapsible) {
    return (
      <div 
        onClick={onToggleCollapse}
        className="w-12 h-[600px] flex flex-col items-center py-6 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors"
      >
        <div className={cn("h-2 w-2 rounded-full mb-4", col.color.replace("border-", "bg-"))} />
        <div className="vertical-text font-bold text-[10px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
          {col.label} ({rows.length})
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-[300px] flex flex-col gap-4 rounded-2xl border-t-4 bg-white/5 border-x border-b border-white/5 p-4 transition-all duration-300",
        col.color.replace("border-", "border-t-"),
        isOver ? "bg-white/[0.08] ring-2 ring-primary/20 scale-[1.01]" : ""
      )}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", col.color.replace("border-", "bg-"))} />
          <h2 className="font-black text-sm uppercase tracking-tight">{col.label}</h2>
          <Badge variant="secondary" className="bg-white/10 text-white text-[10px] px-1.5 py-0 h-4 border-0">
            {rows.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          {col.collapsible && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onToggleCollapse}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
        {rows.map(r => <DraggableCard key={r.id} row={r} onOpen={() => onOpen(r)} onEmail={() => onEmail(r)} colColor={col.color} />)}
        {rows.length === 0 && (
          <div className="h-32 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-4">
            <Info className="h-5 w-5 text-white/10 mb-2" />
            <p className="text-[10px] text-white/30 font-medium">Arraste um card para esta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ row, onOpen, onEmail, colColor }: { row: Row; onOpen: () => void; onEmail: () => void; colColor: string }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id: row.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : 1 } : undefined;
  
  return (
    <div ref={setNodeRef} style={style}>
      <KanbanCard 
        row={row} 
        onOpen={onOpen} 
        onEmail={onEmail} 
        dragHandle={{ ...attributes, ...listeners }} 
        dragging={isDragging}
        colColor={colColor}
      />
    </div>
  );
}

function KanbanCard({ row, onOpen, onEmail, dragHandle, dragging, colColor }: { 
  row: Row; 
  onOpen?: () => void; 
  onEmail?: () => void; 
  dragHandle?: Record<string, unknown>; 
  dragging?: boolean;
  colColor?: string;
}) {
  const days = daysSince(row.last_activity_at);
  const isActive = days <= 7;
  
  const checklistSteps = [row.email_sent, row.response_received, row.applied].filter(Boolean).length;
  const progress = Math.round((checklistSteps / 3) * 100);

  return (
    <Card 
      onClick={onOpen}
      className={cn(
        "group relative p-4 bg-[#1A1A2E] border-white/5 transition-all duration-300 cursor-pointer overflow-hidden",
        dragging ? "shadow-2xl opacity-60 scale-105 rotate-2" : "hover:-translate-y-1 hover:border-white/20",
        !dragging && colColor && `hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_15px_${colColor.replace("border-[", "").replace("]", "")}20]`
      )}
    >
      {/* Accent Line */}
      <div className={cn("absolute top-0 left-0 w-full h-1", colColor?.replace("border-", "bg-"))} />
      
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-black text-sm text-white truncate leading-tight group-hover:text-primary-glow transition-colors">
              {row.universities?.name}
            </h3>
            <p className="text-[10px] text-white/50 mt-0.5 truncate flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {row.universities?.state} · {row.universities?.country === "USA" ? "EUA" : "Canadá"} · {row.universities?.division?.replace("_", " ") || "D1"}
            </p>
          </div>
          <button 
            {...dragHandle} 
            className="text-white/20 hover:text-white transition-colors cursor-grab active:cursor-grabbing p-1 -mr-1"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="text-[11px] font-bold text-emerald-400">
               ~${row.universities?.estimated_cost_usd?.toLocaleString()}/ano
             </div>
          </div>
          <div className="flex items-center gap-1.5">
             <span className={cn(
               "h-1.5 w-1.5 rounded-full",
               isActive ? "bg-emerald-500 animate-pulse" : "bg-white/10"
             )} />
             <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
               {isActive ? "Ativo" : "Inativo"}
             </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
           <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase text-white/40">
                <span>Checklist</span>
                <span>{checklistSteps}/3</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#A855F7] to-[#FF6B2B] rounded-full transition-all duration-500" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
           </div>
           <div className={cn(
             "px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1",
             row.interest_level === "high" ? "bg-emerald-500/10 text-emerald-500" :
             row.interest_level === "low" ? "bg-rose-500/10 text-rose-500" :
             "bg-amber-500/10 text-amber-500"
           )}>
             <span className={cn(
               "h-1 w-1 rounded-full",
               row.interest_level === "high" ? "bg-emerald-500" :
               row.interest_level === "low" ? "bg-rose-500" :
               "bg-amber-500"
             )} />
             {row.interest_level === "high" ? "Alto" : row.interest_level === "low" ? "Baixo" : "Médio"}
           </div>
        </div>

        {onEmail && row.status === "interest" && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onEmail(); }}
            className="w-full mt-1 h-8 bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest gap-2 hover:bg-[#A855F7]/20 hover:text-[#A855F7] hover:border-[#A855F7]/30 transition-all"
          >
            <Mail className="h-3 w-3" /> Enviar Email
          </Button>
        )}
      </div>
    </Card>
  );
}

function EditDialog({ row, history, onClose, onChange, onMove, onArchive, onGenerateEmail }: {
  row: Row | null;
  history: HistoryRow[];
  onClose: () => void;
  onChange: (patch: Partial<Row>) => void;
  onMove: (status: string) => void;
  onArchive: () => void;
  onGenerateEmail: () => void;
}) {
  const [localNotes, setLocalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => { 
    if (row) setLocalNotes(row.notes ?? ""); 
  }, [row?.id]);

  useEffect(() => {
    if (!row || localNotes === row.notes) return;
    const t = setTimeout(() => {
      setIsSaving(true);
      onChange({ notes: localNotes });
      setTimeout(() => setIsSaving(false), 1000);
    }, 1500);
    return () => clearTimeout(t);
  }, [localNotes]);

  if (!row) return null;

  const currentStatus = COLUMNS.find(c => c.key === row.status);
  const checklist = [
    { k: "email_sent" as const, label: "Enviei o email de contato?" },
    { k: "response_received" as const, label: "Recebi resposta?" },
    { k: "applied" as const, label: "Já me candidatei?" },
  ];
  
  const completedSteps = checklist.filter(s => !!row[s.k]).length;
  const progressPercent = Math.round((completedSteps / checklist.length) * 100);

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-[#0F0F1A] border-white/5 p-0 overflow-hidden shadow-2xl ring-1 ring-white/10">
        <div className="flex h-[85vh]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
             {/* Header Section */}
             <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                      <h2 className="text-2xl font-black text-white leading-tight">{row.universities?.name}</h2>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {row.universities?.state}, {row.universities?.country}</span>
                        <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5" /> {row.universities?.division?.replace("_", " ")}</span>
                        <span className="flex items-center gap-1 text-emerald-400 font-bold"><DollarSign className="h-3.5 w-3.5" /> ${row.universities?.estimated_cost_usd?.toLocaleString()}/ano</span>
                      </div>
                   </div>
                   <Badge className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest border-0", currentStatus?.bg, currentStatus?.text)}>
                     {currentStatus?.label}
                   </Badge>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-thin">
                {/* Checklist Section */}
                <section className="space-y-6">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Checklist de Etapas
                      </h3>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-[#A855F7]">{progressPercent}% Concluído</span>
                         <Progress value={progressPercent} className="w-24 h-1.5 bg-white/5">
                           <div className="h-full bg-gradient-to-r from-[#A855F7] to-[#FF6B2B] rounded-full" style={{ width: `${progressPercent}%` }} />
                         </Progress>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      {checklist.map(({ k, label }) => (
                        <div key={k} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-colors">
                           <span className="text-sm font-medium text-white/80">{label}</span>
                           <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onChange({ [k]: true })}
                                className={cn(
                                  "h-8 px-4 text-[10px] font-bold rounded-lg transition-all",
                                  row[k] === true ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-white/40 hover:text-white"
                                )}
                              >
                                {row[k] === true && <Check className="h-3 w-3 mr-1.5" />} Sim
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => onChange({ [k]: false })}
                                className={cn(
                                  "h-8 px-4 text-[10px] font-bold rounded-lg transition-all",
                                  row[k] === false ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "bg-white/5 text-white/40 hover:text-white"
                                )}
                              >
                                {row[k] === false && <X className="h-3 w-3 mr-1.5" />} Não
                              </Button>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>

                {/* Interest Level */}
                <section className="space-y-4">
                   <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Nível de Interesse</h3>
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { v: "low", l: "Baixo", c: "rose" },
                        { v: "medium", l: "Médio", c: "amber" },
                        { v: "high", l: "Alto", c: "emerald" },
                      ].map(opt => (
                        <Button 
                          key={opt.v}
                          variant="ghost"
                          onClick={() => onChange({ interest_level: opt.v })}
                          className={cn(
                            "h-12 flex flex-col gap-1 rounded-xl border border-white/5 transition-all font-black text-[10px] uppercase",
                            row.interest_level === opt.v ? `bg-${opt.c}-500/10 border-${opt.c}-500/40 text-${opt.c}-500 ring-1 ring-${opt.c}-500/20` : "bg-white/5 text-white/40 hover:bg-white/10"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", `bg-${opt.c}-500`, row.interest_level === opt.v && "animate-pulse")} />
                          {opt.l}
                        </Button>
                      ))}
                   </div>
                </section>

                {/* Notes */}
                <section className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Observações</h3>
                      {isSaving && <span className="text-[9px] text-primary-glow animate-pulse">Salvo automaticamente</span>}
                   </div>
                   <Textarea 
                     value={localNotes}
                     onChange={(e) => setLocalNotes(e.target.value)}
                     placeholder="Notas pessoais, estratégia, contexto..."
                     className="bg-white/5 border-white/10 rounded-xl min-h-[120px] text-sm focus:border-[#A855F7]/40 focus:ring-1 focus:ring-[#A855F7]/20 transition-all"
                   />
                </section>

                {/* Uni Link */}
                <section className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 flex items-center justify-between gap-6">
                   <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-white/80">
                         <GraduationCap className="h-4 w-4 text-[#A855F7]" />
                         <span className="text-sm font-bold">Saiba mais sobre a instituição</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Acesse o ranking completo, áreas de estudo, bolsas disponíveis e requisitos.
                      </p>
                   </div>
                   <Button variant="outline" className="border-[#FF6B2B]/40 text-[#FF6B2B] hover:bg-[#FF6B2B]/10 gap-2 font-bold" asChild>
                      <a href={row.universities?.website || "#"} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" /> Ver Página
                      </a>
                   </Button>
                </section>
             </div>

             {/* Footer */}
             <div className="p-6 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-4">
                <Button variant="ghost" onClick={onArchive} className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 gap-2 font-black text-[10px] uppercase">
                  <Archive className="h-4 w-4" /> Arquivar
                </Button>
                <div className="flex gap-3">
                   <Button variant="outline" onClick={onClose} className="border-white/10 text-white hover:bg-white/5 font-black text-[10px] uppercase">
                     Fechar
                   </Button>
                   <Button 
                    onClick={() => {
                      const statusOrder = COLUMNS.map(c => c.key);
                      const currentIdx = statusOrder.indexOf(row.status);
                      if (currentIdx < statusOrder.length - 1) {
                        onMove(statusOrder[currentIdx + 1]);
                      }
                    }} 
                    className="bg-gradient-to-r from-[#A855F7] to-[#FF6B2B] text-white font-black text-[10px] uppercase px-6"
                   >
                     Mover para próxima etapa
                   </Button>
                </div>
             </div>
          </div>

          {/* Side Info Panel */}
          <div className="w-[280px] border-l border-white/5 bg-black/40 flex flex-col hidden lg:flex">
             <div className="p-6 border-b border-white/5 flex items-center gap-2">
                <History className="h-4 w-4 text-[#A855F7]" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Histórico de Mudanças</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-10 opacity-30">
                    <Activity className="h-10 w-10 mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma mudança ainda</p>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                    {history.map((h, i) => (
                      <div key={h.id} className="relative pl-7 space-y-1">
                        <div className="absolute left-0 top-1 h-4 w-4 rounded-full bg-[#1A1A2E] border border-[#A855F7]/30 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#A855F7]" />
                        </div>
                        <p className="text-xs font-bold text-white/80 leading-snug">
                          {h.from_status ? (
                            <>Movido de <span className="text-white/40">{COLUMNS.find(c => c.key === h.from_status)?.label}</span> para <span className="text-primary-glow">{COLUMNS.find(c => c.key === h.to_status)?.label}</span></>
                          ) : (
                            <>Adicionado ao Pipeline em <span className="text-primary-glow">{COLUMNS.find(c => c.key === h.to_status)?.label}</span></>
                          )}
                        </p>
                        <p className="text-[9px] text-white/30 font-medium">
                          {format(new Date(h.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
             </div>
             <div className="p-6 border-t border-white/5">
                <Button 
                  onClick={onGenerateEmail}
                  className="w-full bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] hover:bg-[#A855F7] hover:text-white transition-all gap-2 h-10 font-bold"
                >
                  <Sparkles className="h-4 w-4" /> Gerar Email IA
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
