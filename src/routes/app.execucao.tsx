import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Clock, AlertTriangle, Flame, GripVertical, History, Mail, Sparkles } from "lucide-react";
import { AIEmailGenerator } from "@/components/colleges/AIEmailGenerator";

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
  universities: { name: string; country: string; state: string; estimated_cost_usd: number | null; division: string | null; acceptance_chance: string | null } | null;
};

type HistoryRow = { id: string; from_status: string | null; to_status: string; created_at: string; note: string | null };

const COLUMNS = [
  { key: "interest", label: "Interesse", emoji: "🟡", color: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900" },
  { key: "email_sent", label: "Email enviado", emoji: "📬", color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900" },
  { key: "response", label: "Resposta", emoji: "💬", color: "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900" },
  { key: "applied", label: "Aplicado", emoji: "📝", color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900" },
  { key: "accepted", label: "Aceito", emoji: "🟢", color: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900" },
];

// Travas: define o que é necessário para entrar em cada status
const STATUS_GUARDS: Record<string, (r: Row) => string | null> = {
  interest: () => null,
  email_sent: (r) => (r.email_sent ? null : "Marque o card como 'Email enviado' antes."),
  response: (r) => (r.email_sent ? null : "Não pode receber resposta sem ter enviado email."),
  applied: (r) => (r.email_sent ? null : "Não pode aplicar sem ter enviado email."),
  accepted: (r) => (r.applied ? null : "Não pode aceitar sem ter aplicado."),
  rejected: () => null,
};

function daysSince(iso: string | null) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function inactivityBadge(days: number) {
  if (days <= 3) return { label: "Ativo", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" };
  if (days <= 7) return { label: `${days}d parado`, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" };
  return { label: `${days}d risco`, cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" };
}

function priorityFor(r: Row): { label: string; icon: string; cls: string } {
  // Heurística simples: alta chance + custo razoável + sem atividade recente = alta prioridade
  const chance = r.universities?.acceptance_chance ?? "";
  const days = daysSince(r.last_activity_at);
  if (chance.toLowerCase().includes("alta") && days > 5) return { label: "Alta", icon: "🔥", cls: "text-orange-600" };
  if (chance.toLowerCase().includes("média") || chance.toLowerCase().includes("media")) return { label: "Média", icon: "🟡", cls: "text-amber-600" };
  return { label: "Baixa", icon: "🔵", cls: "text-muted-foreground" };
}

function nextAction(r: Row): string {
  if (!r.email_sent) return "📬 Enviar email de apresentação";
  if (!r.response_received) return "⏳ Aguardar resposta / fazer follow-up";
  if (!r.applied) return "📝 Iniciar aplicação";
  return "🎯 Aguardar decisão final";
}

function ExecucaoPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [archived, setArchived] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [emailGenFor, setEmailGenFor] = useState<Row | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pipeline")
      .select("id, status, notes, email_sent, response_received, applied, interest_level, last_activity_at, updated_at, university_id, universities(name, country, state, estimated_cost_usd, division, acceptance_chance)")
      .eq("user_id", user.id);
    const all = (data as unknown as Row[]) ?? [];
    setRows(all.filter(r => r.status !== "rejected"));
    setArchived(all.filter(r => r.status === "rejected"));
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
    }
    await load();
    if (editing?.id === id) {
      const next = { ...editing, ...patch } as Row;
      setEditing(next);
      loadHistory(id);
    }
  };

  const moveTo = async (row: Row, toStatus: string) => {
    if (row.status === toStatus) return;
    const guard = STATUS_GUARDS[toStatus];
    const blocked = guard?.(row);
    if (blocked) { toast.error(blocked); return; }

    const patch: Partial<Row> = { status: toStatus };
    // Auto-marca os checkboxes ao avançar
    if (toStatus === "email_sent") patch.email_sent = true;
    if (toStatus === "response") { patch.email_sent = true; patch.response_received = true; }
    if (toStatus === "applied") { patch.email_sent = true; patch.applied = true; }
    if (toStatus === "accepted") { patch.email_sent = true; patch.applied = true; }

    await updateRow(row.id, patch, { from: row.status, to: toStatus });
    toast.success(`Movido para ${COLUMNS.find(c => c.key === toStatus)?.label ?? toStatus}`);
  };

  const archive = async (row: Row) => {
    await updateRow(row.id, { status: "rejected" }, { from: row.status, to: "rejected" });
    toast.success("Card arquivado");
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const row = rows.find(r => r.id === e.active.id);
    if (!row) return;
    moveTo(row, overId);
  };

  const widget = useMemo(() => {
    const stale = [...rows].sort((a, b) => daysSince(b.last_activity_at) - daysSince(a.last_activity_at)).slice(0, 3);
    const promising = [...rows]
      .filter(r => (r.universities?.acceptance_chance ?? "").toLowerCase().includes("alta"))
      .slice(0, 3);
    return { stale, promising };
  }, [rows]);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando pipeline...</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Arraste os cards entre colunas. Travas inteligentes evitam inconsistências.</p>
        </div>
        <Button variant="outline" onClick={() => setShowWidget(s => !s)}>
          {showWidget ? "Ocultar" : "Ver"} ranking
        </Button>
      </div>

      {showWidget && (
        <Card className="p-4 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Mais promissoras</h3>
            {widget.promising.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma com alta chance ainda.</p>
            ) : widget.promising.map(r => (
              <div key={r.id} className="text-sm py-1">{r.universities?.name}</div>
            ))}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Mais paradas</h3>
            {widget.stale.length === 0 ? (
              <p className="text-xs text-muted-foreground">Pipeline em dia.</p>
            ) : widget.stale.map(r => (
              <div key={r.id} className="text-sm py-1 flex justify-between">
                <span>{r.universities?.name}</span>
                <span className="text-muted-foreground text-xs">{daysSince(r.last_activity_at)}d</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {rows.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Badge className="mb-3">Nenhum item</Badge>
          <p className="text-muted-foreground text-sm">Adicione faculdades ao pipeline em <strong>Faculdades</strong>.</p>
        </Card>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {COLUMNS.map(col => (
              <Column 
                key={col.key} 
                col={col} 
                rows={rows.filter(r => r.status === col.key)} 
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
      )}

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Arquivo — Rejeitados ({archived.length})
          </summary>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            {archived.map(r => (
              <Card key={r.id} className="p-3 opacity-70">
                <div className="font-medium text-sm">{r.universities?.name}</div>
                <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => moveTo(r, "interest")}>
                  Reativar
                </Button>
              </Card>
            ))}
          </div>
        </details>
      )}

      <EditDialog
        row={editing}
        history={history}
        onClose={() => setEditing(null)}
        onChange={(patch) => editing && updateRow(editing.id, patch)}
        onArchive={() => { if (editing) { archive(editing); setEditing(null); } }}
        onGenerateEmail={() => setEditing(null) || setEmailGenFor(editing)}
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

function Column({ col, rows, onOpen, onEmail }: { col: typeof COLUMNS[number]; rows: Row[]; onOpen: (r: Row) => void; onEmail: (r: Row) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 p-3 min-h-[300px] transition-colors ${col.color} ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold flex items-center gap-1.5">
          <span>{col.emoji}</span>{col.label}
        </div>
        <Badge variant="secondary" className="text-xs">{rows.length}</Badge>
      </div>
      <div className="space-y-2">
        {rows.map(r => <DraggableCard key={r.id} row={r} onOpen={() => onOpen(r)} onEmail={() => onEmail(r)} />)}
        {rows.length === 0 && <p className="text-xs text-muted-foreground italic px-1">Vazio</p>}
      </div>
    </div>
  );
}

function DraggableCard({ row, onOpen, onEmail }: { row: Row; onOpen: () => void; onEmail: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({ id: row.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 } : { opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <KanbanCard row={row} onOpen={onOpen} onEmail={onEmail} dragHandle={{ ...attributes, ...listeners }} />
    </div>
  );
}

function KanbanCard({ row, onOpen, onEmail, dragHandle, dragging }: { row: Row; onOpen?: () => void; onEmail?: () => void; dragHandle?: Record<string, unknown>; dragging?: boolean }) {
  const days = daysSince(row.last_activity_at);
  const inact = inactivityBadge(days);
  const prio = priorityFor(row);
  return (
    <Card className={`p-3 bg-background ${dragging ? "shadow-2xl rotate-2" : "hover:shadow-md"} transition-all cursor-pointer`} onClick={onOpen}>
      <div className="flex items-start gap-2">
        <button {...dragHandle} className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{row.universities?.name ?? "—"}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {row.universities?.state}, {row.universities?.country === "USA" ? "EUA" : "Canadá"}
            {row.universities?.division && <> · {row.universities.division}</>}
          </div>
          {row.universities?.estimated_cost_usd && (
            <div className="text-xs text-muted-foreground mt-0.5">~ ${row.universities.estimated_cost_usd.toLocaleString()}/ano</div>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${inact.cls} flex items-center gap-1`}>
              <Clock className="h-2.5 w-2.5" />{inact.label}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-muted ${prio.cls}`}>
              {prio.icon} {prio.label}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground italic line-clamp-1 flex items-center justify-between">
            <span>→ {nextAction(row)}</span>
            {onEmail && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEmail(); }}
                className="text-primary hover:text-primary-glow flex items-center gap-0.5 ml-2"
              >
                <Mail className="h-3 w-3" />
                <span className="text-[10px]">Email</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function EditDialog({ row, history, onClose, onChange, onArchive, onGenerateEmail }: {
  row: Row | null;
  history: HistoryRow[];
  onClose: () => void;
  onChange: (patch: Partial<Row>) => void;
  onArchive: () => void;
  onGenerateEmail: () => void;
}) {
  const [notes, setNotes] = useState("");
  useEffect(() => { setNotes(row?.notes ?? ""); }, [row?.id]);

  if (!row) return null;
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{row.universities?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {row.universities?.state}, {row.universities?.country === "USA" ? "EUA" : "Canadá"}
              {row.universities?.division && <> · {row.universities.division}</>}
              {row.universities?.estimated_cost_usd && <> · ~${row.universities.estimated_cost_usd.toLocaleString()}/ano</>}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-lilac-500 border-lilac-500/30 hover:bg-lilac-500/10 gap-2"
              onClick={onGenerateEmail}
            >
              <Sparkles className="h-3.5 w-3.5" /> Gerar email com IA
            </Button>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Checklist</Label>
            <div className="space-y-2 mt-2">
              {[
                { k: "email_sent" as const, label: "📬 Email enviado" },
                { k: "response_received" as const, label: "💬 Resposta recebida" },
                { k: "applied" as const, label: "📝 Aplicado" },
              ].map(({ k, label }) => (
                <div key={k} className="flex items-center gap-2">
                  <Checkbox
                    id={k}
                    checked={!!row[k]}
                    onCheckedChange={(v) => {
                      // Travas: não pode marcar resposta sem email, nem aplicado sem email
                      if (v && k === "response_received" && !row.email_sent) { toast.error("Marque 'Email enviado' antes."); return; }
                      if (v && k === "applied" && !row.email_sent) { toast.error("Marque 'Email enviado' antes."); return; }
                      onChange({ [k]: !!v });
                    }}
                  />
                  <label htmlFor={k} className="text-sm cursor-pointer">{label}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground">Nível de interesse</Label>
            <div className="flex gap-2 mt-2">
              {["low", "medium", "high"].map(lv => (
                <Button key={lv} variant={row.interest_level === lv ? "default" : "outline"} size="sm" onClick={() => onChange({ interest_level: lv })}>
                  {lv === "low" ? "🔴 Baixo" : lv === "medium" ? "🟡 Médio" : "🟢 Alto"}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-xs uppercase text-muted-foreground">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (row.notes ?? "") && onChange({ notes })}
              placeholder="Notas pessoais, estratégia, contexto..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1"><History className="h-3 w-3" /> Histórico</Label>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">Sem mudanças registradas.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs">
                {history.map(h => (
                  <li key={h.id} className="flex justify-between text-muted-foreground">
                    <span>{h.from_status ?? "—"} → <strong className="text-foreground">{h.to_status}</strong></span>
                    <span>{new Date(h.created_at).toLocaleDateString("pt-BR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={onArchive}>
              Arquivar (Rejeitado)
            </Button>
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
