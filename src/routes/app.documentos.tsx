import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, CheckCircle2, Clock, XCircle, Upload, Plus, 
  Search, ExternalLink, ChevronDown, ChevronUp, File
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/app/documentos")({ component: DocumentosPage });

interface DocumentItem {
  id: string;
  name: string;
  status: "ready" | "in-progress" | "missing";
  validUntil?: string;
  fileName?: string;
}

interface UniversityDocs {
  id: string;
  university: string;
  status: "complete" | "incomplete" | "pending";
  documents: DocumentItem[];
}

const GENERAL_DOCS: DocumentItem[] = [
  { id: "1", name: "Histórico Escolar", status: "ready", fileName: "historico_final.pdf" },
  { id: "2", name: "Carta de Motivação", status: "in-progress" },
  { id: "3", name: "Cartas de Recomendação", status: "missing" },
  { id: "4", name: "Comprovante de Proficiência (TOEFL/IELTS)", status: "ready", validUntil: "12/2026", fileName: "toefl_results.pdf" },
  { id: "5", name: "Passaporte", status: "ready", validUntil: "05/2030", fileName: "passaporte_scan.jpg" },
  { id: "6", name: "Comprovante Financeiro", status: "missing" },
  { id: "7", name: "Foto 3x4 digital", status: "ready", fileName: "foto_perfil.png" },
];

const UNI_DOCS: UniversityDocs[] = [
  {
    id: "u1",
    university: "Harvard University",
    status: "incomplete",
    documents: [
      { id: "d1", name: "Application Form", status: "ready" },
      { id: "d2", name: "Essays (3)", status: "in-progress" },
      { id: "d3", name: "SAT Scores", status: "missing" },
    ],
  },
  {
    id: "u2",
    university: "University of British Columbia",
    status: "complete",
    documents: [
      { id: "d4", name: "Study Permit", status: "ready" },
      { id: "d5", name: "Letter of Acceptance", status: "ready" },
    ],
  },
];

function DocumentosPage() {
  const [expandedUni, setExpandedUni] = useState<string | null>(null);

  const readyCount = GENERAL_DOCS.filter(d => d.status === "ready").length;
  const progressPercent = Math.round((readyCount / GENERAL_DOCS.length) * 100);

  const statusIcons = {
    ready: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    "in-progress": <Clock className="h-4 w-4 text-amber-500" />,
    missing: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const statusLabels = {
    ready: "Pronto",
    "in-progress": "Em andamento",
    missing: "Faltando",
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display">Central de Documentos</h1>
        <p className="text-muted-foreground mt-1 text-sm">Organize e gerencie todos os documentos para sua jornada</p>
      </div>

      {/* Progress Section */}
      <Card className="p-6 border-sidebar-border bg-sidebar/30 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Progresso Geral</h2>
            <p className="text-sm text-muted-foreground">{readyCount} de {GENERAL_DOCS.length} documentos globais prontos</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-gradient-brand">{progressPercent}%</span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-3 bg-sidebar-border">
          <div className="h-full bg-gradient-to-r from-lilac-500 to-orange-500 transition-all" style={{ width: `${progressPercent}%` }} />
        </Progress>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* General Documents */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentos Gerais
            </h2>
            <Button size="sm" variant="outline" className="h-8 gap-2">
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </div>

          <div className="space-y-3">
            {GENERAL_DOCS.map((doc) => (
              <Card key={doc.id} className="p-4 bg-sidebar/40 border-sidebar-border hover:bg-sidebar/60 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg bg-sidebar-accent border border-sidebar-border",
                      doc.status === "ready" && "border-emerald-500/30 bg-emerald-500/5"
                    )}>
                      <File className={cn("h-4 w-4", doc.status === "ready" ? "text-emerald-500" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{doc.name}</h4>
                      {doc.fileName ? (
                        <p className="text-xs text-primary font-medium mt-0.5">{doc.fileName}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">{statusLabels[doc.status]}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.validUntil && (
                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-sidebar border border-sidebar-border">
                        Vence: {doc.validUntil}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {statusIcons[doc.status]}
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 hover:text-primary">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* University Documents */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-lilac-500" />
              Por Universidade
            </h2>
          </div>

          <div className="space-y-4">
            {UNI_DOCS.map((uni) => (
              <Card key={uni.id} className="overflow-hidden border-sidebar-border bg-sidebar/40">
                <button
                  onClick={() => setExpandedUni(expandedUni === uni.id ? null : uni.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-sidebar/60 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-lilac-500/20 flex items-center justify-center border border-primary/20">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-sm">{uni.university}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          uni.status === "complete" ? "bg-emerald-500/10 text-emerald-500" : 
                          uni.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {uni.status === "complete" ? "Completo" : uni.status === "pending" ? "Em andamento" : "Incompleto"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expandedUni === uni.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {expandedUni === uni.id && (
                  <div className="p-4 bg-sidebar/20 border-t border-sidebar-border animate-accordion-down">
                    <div className="space-y-3">
                      {uni.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-sidebar/40 border border-sidebar-border/50">
                          <span className="text-sm font-medium">{doc.name}</span>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded",
                              doc.status === "ready" ? "text-emerald-500" : doc.status === "in-progress" ? "text-amber-500" : "text-red-500"
                            )}>
                              {statusLabels[doc.status]}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Upload className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4 h-9 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all gap-2 text-sm">
                      <ExternalLink className="h-4 w-4" /> Ver no Pipeline
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Upload Area */}
          <Card className="p-8 border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/60 transition-all">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-1">Upload de Documentos</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Arraste e solte seus arquivos aqui ou clique para procurar
            </p>
            <p className="text-[10px] mt-4 text-muted-foreground uppercase tracking-widest">
              Suporta PDF, JPG, PNG, DOCX
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
