import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/execucao")({ component: ExecucaoPage });

type Row = { id: string; status: string; notes: string | null; universities: { name: string; country: string; state: string } | null };

function ExecucaoPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("pipeline").select("id, status, notes, universities(name, country, state)").eq("user_id", user.id)
      .then(({ data }) => setRows((data as unknown as Row[]) ?? []));
  }, [user]);

  const cols = [
    { key: "interest", label: "🟡 Interesse" },
    { key: "email_sent", label: "📬 Email enviado" },
    { key: "response", label: "💬 Resposta" },
    { key: "applied", label: "📝 Aplicado" },
    { key: "accepted", label: "🟢 Aceito" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Execução — Pipeline</h1>
        <p className="text-muted-foreground mt-1">Versão inicial. Kanban com cards inteligentes, IA, prioridade e Planos de Ação na próxima iteração.</p>
      </div>
      <div className="grid md:grid-cols-5 gap-4">
        {cols.map(c => (
          <div key={c.key} className="space-y-3">
            <div className="text-sm font-semibold">{c.label}</div>
            {rows.filter(r => r.status === c.key).map(r => (
              <Card key={r.id} className="p-3">
                <div className="font-medium text-sm">{r.universities?.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.universities?.state}, {r.universities?.country === "USA" ? "EUA" : "Canadá"}</div>
              </Card>
            ))}
            {rows.filter(r => r.status === c.key).length === 0 && (
              <div className="text-xs text-muted-foreground italic px-2">Vazio</div>
            )}
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <Badge className="mb-3">Nenhum item</Badge>
          <p className="text-muted-foreground text-sm">Adicione faculdades ao pipeline em <strong>Jornada Acadêmica</strong>.</p>
        </Card>
      )}
    </div>
  );
}
