import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, Sparkles, Copy, RefreshCw, 
  CheckCircle2, Globe, Languages 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EmailType = 
  | "Primeiro contato / Interesse" 
  | "Dúvida sobre o processo seletivo" 
  | "Envio de documentos" 
  | "Agradecimento após entrevista" 
  | "Follow-up sem resposta";

interface AIEmailGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  universityName: string;
  onMarkAsSent: (emailContent: string) => void;
}

export function AIEmailGenerator({ isOpen, onClose, universityName, onMarkAsSent }: AIEmailGeneratorProps) {
  const [type, setType] = useState<EmailType>("Primeiro contato / Interesse");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [language, setLanguage] = useState<"en" | "pt">("en");

  const emailTypes: EmailType[] = [
    "Primeiro contato / Interesse",
    "Dúvida sobre o processo seletivo",
    "Envio de documentos",
    "Agradecimento após entrevista",
    "Follow-up sem resposta",
  ];

  const generateEmail = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const isEnglish = language === "en";
      const email = isEnglish ? {
        subject: `Inquiry regarding Admission - [Your Name] - ${universityName}`,
        body: `Dear Admissions Team at ${universityName},\n\nI hope this email finds you well. My name is [Your Name] and I am highly interested in applying for the upcoming semester.\n\n${context || "I would like to learn more about the specific requirements for international students and any potential scholarship opportunities available."}\n\nThank you for your time and assistance.\n\nBest regards,\n[Your Name]`,
      } : {
        subject: `Dúvida sobre Admissão - [Seu Nome] - ${universityName}`,
        body: `Prezada equipe de admissões da ${universityName},\n\nEspero que este e-mail os encontre bem. Meu nome é [Seu Nome] e estou muito interessado em me candidatar para o próximo semestre.\n\n${context || "Gostaria de saber mais sobre os requisitos específicos para estudantes internacionais e possíveis oportunidades de bolsa de estudos disponíveis."}\n\nObrigado pelo seu tempo e assistência.\n\nAtenciosamente,\n[Seu Nome]`,
      };
      
      setGeneratedEmail(email);
      setIsGenerating(false);
      toast.success("E-mail gerado com sucesso! ✨");
    }, 1500);
  };

  const copyToClipboard = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`);
      toast.success("E-mail copiado para a área de transferência!");
    }
  };

  const handleSend = () => {
    if (generatedEmail) {
      onMarkAsSent(generatedEmail.body);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-sidebar border-sidebar-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar e-mail para {universityName}
          </DialogTitle>
          <DialogDescription>
            Nossa IA criará um e-mail profissional e personalizado para você.
          </DialogDescription>
        </DialogHeader>

        {!generatedEmail ? (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tipo de e-mail</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {emailTypes.map((t) => (
                  <Button
                    key={t}
                    variant={type === t ? "secondary" : "outline"}
                    className={cn(
                      "justify-start text-xs h-auto py-2.5 px-3",
                      type === t && "bg-primary/10 border-primary text-primary"
                    )}
                    onClick={() => setType(t)}
                  >
                    <Mail className="h-3.5 w-3.5 mr-2 opacity-70" />
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Contexto extra (opcional)</Label>
              <Textarea 
                placeholder="Ex: Mencione meu interesse em Engenharia ou pergunte sobre moradia no campus..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="bg-background border-sidebar-border min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-sidebar-border">
                <Button 
                  size="sm" 
                  variant={language === "en" ? "secondary" : "ghost"}
                  onClick={() => setLanguage("en")}
                  className="h-7 text-[10px] px-2"
                >
                  🇺🇸 EN
                </Button>
                <Button 
                  size="sm" 
                  variant={language === "pt" ? "secondary" : "ghost"}
                  onClick={() => setLanguage("pt")}
                  className="h-7 text-[10px] px-2"
                >
                  🇧🇷 PT
                </Button>
              </div>
              <Button 
                onClick={generateEmail} 
                disabled={isGenerating}
                className="bg-gradient-primary gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar E-mail
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">E-mail Sugerido</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 gap-1.5 text-xs text-primary"
                onClick={() => setLanguage(language === "en" ? "pt" : "en")}
              >
                <Languages className="h-3.5 w-3.5" />
                {language === "en" ? "Ver em Português" : "Ver em Inglês"}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground">ASSUNTO</Label>
                <div className="p-3 bg-background border border-sidebar-border rounded-lg font-medium text-sm">
                  {generatedEmail.subject}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground">CORPO DO E-MAIL</Label>
                <div className="p-4 bg-background border border-sidebar-border rounded-lg text-sm whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                  {generatedEmail.body}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1 gap-2" onClick={() => setGeneratedEmail(null)}>
                <RefreshCw className="h-4 w-4" /> Regerar
              </Button>
              <Button variant="outline" className="flex-1 gap-2 border-primary/30 text-primary" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" /> Copiar
              </Button>
              <Button className="flex-1 gap-2 bg-gradient-primary" onClick={handleSend}>
                <CheckCircle2 className="h-4 w-4" /> Marcar como Enviado
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
