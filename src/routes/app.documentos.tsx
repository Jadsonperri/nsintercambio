import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText, Plus, Trash2, ChevronDown, ChevronUp, Check, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/app/documentos")({ component: DocumentosPage });

interface DocRow {
  id: string;
  user_id: string;
  university_id: string | null;
  name: string;
  sent: boolean;
}

interface PipelineUni {
  university_id: string;
  universities: { id: string; name: string; country: string; state: string } | null;
}

interface Group {
  university_id: string | null;
  university_name: string;
  docs: DocRow[];
}

export function DocumentosPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [unis, setUnis] = useState<PipelineUni[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["__general__"]));
  const [adding, setAdding] = useState<{ universityId: string | null } | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: docsData }, { data: pipeData }] = await Promise.all([
      supabase.from("documents").select("id, user_id, university_id, name, sent").eq("user_id", user.id),
      supabase.from("pipeline").select("university_id, universities(id, name, country, state)").eq("user_id", user.id),
    ]);
    setDocs((docsData as DocRow[]) ?? []);
    setUnis((pipeData as unknown as PipelineUni[]) ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const toggleSent = async (doc: DocRow) => {
    const { error } = await supabase.from("documents").update({ sent: !doc.sent }).eq("id", doc.id);
    if (error) return toast.error(error.message);
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, sent: !d.sent } : d)));
  };

  const removeDoc = async (id: string) => {
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Documento removido");
    load();
  };

  const groups: Group[] = [
    { university_id: null, university_name: "Documentos Gerais", docs: docs.filter((d) => !d.university_id) },
    ...unis
      .filter((u) => u.universities)
      .map((u) => ({
        university_id: u.university_id,
        university_name: u.universities!.name,
        docs: docs.filter((d) => d.university_id === u.university_id),
      })),
  ];

  const total = docs.length;
  const sent = docs.filter((d) => d.sent).length;
  const progress = total > 0 ? Math.round((sent / total) * 100) : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Central de Documentos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organize seus documentos por universidade</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">Progresso geral</h2>
            <p className="text-xs text-muted-foreground">{sent} de {total} documentos enviados</p>
          </div>
          <span className="text-2xl font-black text-gradient-brand">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      <div className="space-y-4">
        {groups.map((g) => {
          const key = g.university_id ?? "__general__";
          const isOpen = expanded.has(key);
          const groupSent = g.docs.filter((d) => d.sent).length;
          return (
            <Card key={key} className="overflow-hidden">
              <button
                onClick={() => {
                  const next = new Set(expanded);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  setExpanded(next);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-accent/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    {g.university_id ? <GraduationCap className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{g.university_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {g.docs.length === 0 ? "Sem documentos" : `${groupSent}/${g.docs.length} enviados`}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="p-4 border-t border-border space-y-2">
                  {g.docs.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-2">Nenhum documento. Adicione abaixo.</p>
                  )}
                  {g.docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border group">
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <Checkbox checked={doc.sent} onCheckedChange={() => toggleSent(doc)} />
                        <span className={cn("text-sm font-medium truncate", doc.sent && "line-through text-muted-foreground")}>
                          {doc.name}
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded",
                          doc.sent ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                        )}>
                          {doc.sent ? "Enviado" : "Não enviado"}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeDoc(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 gap-2"
                    onClick={() => setAdding({ universityId: g.university_id })}
                  >
                    <Plus className="h-4 w-4" /> Adicionar documento
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {adding && user && (
        <AddDocDialog
          open={!!adding}
          userId={user.id}
          universityId={adding.universityId}
          onClose={() => setAdding(null)}
          onSaved={() => { setAdding(null); load(); }}
        />
      )}
    </div>
  );
}

function AddDocDialog({ open, userId, universityId, onClose, onSaved }: {
  open: boolean;
  userId: string;
  universityId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const save = async () => {
    if (!name.trim()) return toast.error("Informe o nome do documento");
    const { error } = await supabase.from("documents").insert({
      user_id: userId, university_id: universityId, name, sent: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Documento adicionado");
    onSaved();
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Novo documento</DialogTitle>
          <DialogDescription>Adicione o nome do documento. Marque como enviado quando concluir.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome do documento</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Histórico escolar" autoFocus />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
