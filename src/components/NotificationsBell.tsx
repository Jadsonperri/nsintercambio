import { useEffect, useState } from "react";
import { Bell, Calendar, FileWarning } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNavigate } from "@tanstack/react-router";

type Notif = { id: string; title: string; subtitle: string; date: string; urgency: "high" | "med" | "low"; route: string };

export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);

    supabase.from("deadlines")
      .select("id, title, date, description")
      .eq("user_id", user.id)
      .gte("date", today.toISOString().slice(0, 10))
      .lte("date", in30.toISOString().slice(0, 10))
      .order("date").then(({ data }) => {
        const list: Notif[] = (data || []).map((d) => {
          const days = Math.ceil((new Date(d.date).getTime() - today.getTime()) / 86400000);
          const urgency: Notif["urgency"] = days <= 7 ? "high" : days <= 14 ? "med" : "low";
          return {
            id: d.id, title: d.title,
            subtitle: days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`,
            date: d.date, urgency, route: "/app/execucao",
          };
        });
        setItems(list);
      });
  }, [user]);

  const unread = items.filter((i) => i.urgency !== "low").length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-smooth relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-semibold text-sm">Notificações</div>
          <div className="text-xs text-muted-foreground">{items.length} prazos</div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <FileWarning className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Sem prazos nos próximos 30 dias
            </div>
          ) : items.map((n) => {
            const dot = n.urgency === "high" ? "bg-red-500" : n.urgency === "med" ? "bg-amber-500" : "bg-emerald-500";
            return (
              <button key={n.id} onClick={() => navigate({ to: n.route })}
                className="w-full text-left px-4 py-3 hover:bg-accent/50 border-b border-border last:border-0 flex items-start gap-3">
                <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" /> {n.subtitle} · {new Date(n.date).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
