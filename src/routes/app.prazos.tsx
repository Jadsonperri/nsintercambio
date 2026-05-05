import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar as CalendarIcon, List, ChevronLeft, ChevronRight,
  Plus, Trash2, Clock,
} from "lucide-react";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameMonth, isSameDay, differenceInDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/prazos")({ component: PrazosPage });

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  date: string; // ISO
}

export function PrazosPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [editing, setEditing] = useState<Deadline | null>(null);
  const [creating, setCreating] = useState<{ date?: Date } | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("deadlines")
      .select("id, title, description, date")
      .eq("user_id", user.id)
      .order("date", { ascending: true });
    setDeadlines((data as Deadline[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const urgencyClass = (iso: string) => {
    const diff = differenceInDays(new Date(iso), new Date());
    if (diff <= 7) return "bg-destructive text-destructive-foreground";
    if (diff <= 30) return "bg-warning text-warning-foreground";
    return "bg-success text-success-foreground";
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("deadlines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Prazo removido");
    setEditing(null);
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Calendário de Prazos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Adicione e acompanhe datas importantes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1 border border-border">
            <Button variant={view === "calendar" ? "secondary" : "ghost"} size="sm" onClick={() => setView("calendar")} className="gap-2">
              <CalendarIcon className="h-4 w-4" /> Mensal
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")} className="gap-2">
              <List className="h-4 w-4" /> Lista
            </Button>
          </div>
          <Button onClick={() => setCreating({ date: new Date() })} className="gap-2">
            <Plus className="h-4 w-4" /> Novo prazo
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground uppercase">
                {d}
              </div>
            ))}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`e-${i}`} className="bg-muted/20 h-28" />
            ))}
            {days.map((day) => {
              const dayDeadlines = deadlines.filter((d) => isSameDay(new Date(d.date), day));
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toString()}
                  onClick={() => setCreating({ date: day })}
                  className={cn(
                    "bg-card hover:bg-accent/40 transition-colors text-left h-28 p-2 relative",
                    !isSameMonth(day, currentMonth) && "opacity-40",
                    isToday && "ring-1 ring-primary ring-inset",
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isToday && "h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center",
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayDeadlines.slice(0, 3).map((dl) => (
                      <span
                        key={dl.id}
                        onClick={(e) => { e.stopPropagation(); setEditing(dl); }}
                        className={cn(
                          "block w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-90",
                          urgencyClass(dl.date),
                        )}
                      >
                        {dl.title}
                      </span>
                    ))}
                    {dayDeadlines.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{dayDeadlines.length - 3} mais</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {deadlines.length === 0 && (
            <Card className="p-10 text-center">
              <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum prazo cadastrado</p>
              <Button onClick={() => setCreating({ date: new Date() })} className="mt-4 gap-2">
                <Plus className="h-4 w-4" /> Adicionar primeiro prazo
              </Button>
            </Card>
          )}
          {deadlines.map((dl) => {
            const days = differenceInDays(new Date(dl.date), new Date());
            return (
              <Card key={dl.id} className="p-4 hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setEditing(dl)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn("p-3 rounded-xl", urgencyClass(dl.date))}>
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{dl.title}</h3>
                      {dl.description && <p className="text-sm text-muted-foreground truncate">{dl.description}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{format(new Date(dl.date), "dd/MM/yyyy")}</p>
                    <p className="text-xs text-muted-foreground">{days >= 0 ? `${days} dias` : "vencido"}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {(editing || creating) && (
        <DeadlineDialog
          open={!!(editing || creating)}
          deadline={editing}
          initialDate={creating?.date}
          onClose={() => { setEditing(null); setCreating(null); }}
          onSaved={() => { load(); setEditing(null); setCreating(null); }}
          onDelete={editing ? () => remove(editing.id) : undefined}
          userId={user?.id ?? ""}
        />
      )}
    </div>
  );
}

function DeadlineDialog({ open, deadline, initialDate, onClose, onSaved, onDelete, userId }: {
  open: boolean;
  deadline: Deadline | null;
  initialDate?: Date;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => void;
  userId: string;
}) {
  const [title, setTitle] = useState(deadline?.title ?? "");
  const [description, setDescription] = useState(deadline?.description ?? "");
  const [date, setDate] = useState(
    deadline?.date
      ? format(new Date(deadline.date), "yyyy-MM-dd")
      : format(initialDate ?? new Date(), "yyyy-MM-dd")
  );

  const save = async () => {
    if (!title.trim() || !date) return toast.error("Título e data obrigatórios");
    if (deadline) {
      const { error } = await supabase.from("deadlines")
        .update({ title, description, date: new Date(date).toISOString() })
        .eq("id", deadline.id);
      if (error) return toast.error(error.message);
      toast.success("Prazo atualizado");
    } else {
      const { error } = await supabase.from("deadlines")
        .insert({ user_id: userId, title, description, date: new Date(date).toISOString() });
      if (error) return toast.error(error.message);
      toast.success("Prazo criado");
    }
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{deadline ? "Editar prazo" : "Novo prazo"}</DialogTitle>
          <DialogDescription>Adicione informações sobre essa data importante.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Inscrição Harvard" />
          </div>
          <div className="space-y-2">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes opcionais..." />
          </div>
        </div>
        <DialogFooter className="flex-row gap-2">
          {onDelete && (
            <Button variant="ghost" onClick={onDelete} className="text-destructive gap-2">
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
