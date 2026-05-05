import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, List, ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/app/prazos")({ component: PrazosPage });

type DeadlineType = "Inscrição" | "Entrega de documentos" | "Resposta esperada" | "Início do semestre";

interface Deadline {
  id: string;
  university: string;
  type: DeadlineType;
  date: Date;
}

// Mock data for initial implementation
const MOCK_DEADLINES: Deadline[] = [
  { id: "1", university: "Harvard University", type: "Inscrição", date: addDays(new Date(), 5) },
  { id: "2", university: "Stanford University", type: "Entrega de documentos", date: addDays(new Date(), 15) },
  { id: "3", university: "MIT", type: "Resposta esperada", date: addDays(new Date(), 45) },
  { id: "4", university: "Oxford University", type: "Início do semestre", date: addDays(new Date(), 90) },
  { id: "5", university: "University of Toronto", type: "Inscrição", date: addDays(new Date(), 3) },
];

export function PrazosPage() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getUrgencyColor = (date: Date) => {
    const diff = differenceInDays(date, new Date());
    if (diff <= 7) return "bg-red-500";
    if (diff <= 30) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getUrgencyBorder = (date: Date) => {
    const diff = differenceInDays(date, new Date());
    if (diff <= 7) return "border-red-500/50";
    if (diff <= 30) return "border-amber-500/50";
    return "border-emerald-500/50";
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const urgentDeadline = MOCK_DEADLINES.find(d => differenceInDays(d.date, new Date()) <= 7);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {urgentDeadline && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm font-medium text-red-400">
            ⚠️ {urgentDeadline.type} na {urgentDeadline.university} fecha em {differenceInDays(urgentDeadline.date, new Date())} dias
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Calendário de Prazos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Acompanhe datas críticas de suas aplicações</p>
        </div>

        <div className="flex items-center bg-sidebar rounded-lg p-1 border border-sidebar-border self-start md:self-center">
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
            className="gap-2"
          >
            <CalendarIcon className="h-4 w-4" /> Mensal
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            className="gap-2"
          >
            <List className="h-4 w-4" /> Lista
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <Card className="p-6 border-sidebar-border bg-sidebar/30 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-sidebar-border rounded-lg overflow-hidden border border-sidebar-border">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
              <div key={day} className="bg-sidebar/50 p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {day}
              </div>
            ))}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-sidebar/20 h-32 p-2" />
            ))}
            {days.map((day) => {
              const dayDeadlines = MOCK_DEADLINES.filter(d => isSameDay(d.date, day));
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toString()} className={cn(
                  "bg-sidebar/40 h-32 p-2 relative transition-colors hover:bg-sidebar/60 border-t border-l border-sidebar-border",
                  !isSameMonth(day, currentMonth) && "opacity-20",
                  isToday && "bg-primary/5"
                )}>
                  <span className={cn(
                    "text-sm font-medium",
                    isToday && "h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center -ml-1 -mt-1"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayDeadlines.map((deadline) => (
                      <button
                        key={deadline.id}
                        onClick={() => setSelectedDeadline(deadline)}
                        className={cn(
                          "w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate text-white transition-transform hover:scale-[1.02]",
                          getUrgencyColor(deadline.date)
                        )}
                      >
                        {deadline.university}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {["Todos", "Inscrição", "Entrega de documentos", "Resposta esperada", "Início do semestre"].map((filter) => (
              <Button key={filter} variant="outline" size="sm" className="whitespace-nowrap rounded-full">
                {filter}
              </Button>
            ))}
          </div>

          <div className="grid gap-3">
            {MOCK_DEADLINES.sort((a, b) => a.date.getTime() - b.date.getTime()).map((deadline) => {
              const daysRemaining = differenceInDays(deadline.date, new Date());
              return (
                <Card key={deadline.id} className="p-4 bg-sidebar/40 hover:bg-sidebar/60 border-sidebar-border transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-xl", getUrgencyColor(deadline.date), "bg-opacity-20")}>
                        <Clock className={cn("h-5 w-5", getUrgencyColor(deadline.date).replace("bg-", "text-"))} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-primary transition-colors">{deadline.university}</h3>
                        <p className="text-sm text-muted-foreground">{deadline.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div className="hidden md:block">
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Data</p>
                        <p className="text-sm font-medium">{format(deadline.date, "dd/MM/yyyy")}</p>
                      </div>
                      <div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          getUrgencyColor(deadline.date),
                          "bg-opacity-20",
                          getUrgencyColor(deadline.date).replace("bg-", "text-")
                        )}>
                          {daysRemaining <= 7 ? "Crítico" : daysRemaining <= 30 ? "Próximo" : "Tranquilo"}
                        </span>
                        <p className="text-[10px] mt-1 text-muted-foreground">{daysRemaining} dias restantes</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/20 hover:text-primary">
                        Ver Pipeline
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!selectedDeadline} onOpenChange={(open) => !open && setSelectedDeadline(null)}>
        {selectedDeadline && (
          <DialogContent className="sm:max-w-[425px] bg-sidebar border-sidebar-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Clock className={cn("h-5 w-5", getUrgencyColor(selectedDeadline.date).replace("bg-", "text-"))} />
                Detalhes do Prazo
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Informações críticas sobre sua aplicação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Universidade</p>
                <p className="text-lg font-bold text-white">{selectedDeadline.university}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Tipo</p>
                  <p className="text-sm font-medium">{selectedDeadline.type}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Vencimento</p>
                  <p className="text-sm font-medium">{format(selectedDeadline.date, "dd 'de' MMMM", { locale: ptBR })}</p>
                </div>
              </div>
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-3",
                getUrgencyColor(selectedDeadline.date),
                "bg-opacity-10",
                getUrgencyBorder(selectedDeadline.date)
              )}>
                <AlertCircle className={cn("h-5 w-5", getUrgencyColor(selectedDeadline.date).replace("bg-", "text-"))} />
                <p className="text-sm font-medium">
                  {differenceInDays(selectedDeadline.date, new Date())} dias restantes para completar esta etapa.
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setSelectedDeadline(null)} className="flex-1">Fechar</Button>
              <Button className="bg-gradient-primary flex-1">Ver no Pipeline</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
