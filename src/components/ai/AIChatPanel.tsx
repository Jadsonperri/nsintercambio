import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { aiChat } from "@/server/ai-chat.functions";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Analise meu perfil e diga minhas chances reais",
  "Quais universidades do meu pipeline têm melhor custo-benefício?",
  "Quanto preciso poupar por mês para viabilizar meu intercâmbio?",
  "Que prazos críticos eu tenho nas próximas 4 semanas?",
];

export function AIChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Olá! Sou sua IA mentora de intercâmbio. Posso analisar faculdades, sugerir estratégias, calcular riscos e te ajudar a tomar decisões. Por onde quer começar?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await aiChat({ data: { messages: next.map(({ role, content }) => ({ role, content })) } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
      if (res.error) toast.error(res.reply);
    } catch (e) {
      toast.error("Falha ao conversar com a IA");
      setMessages([...next, { role: "assistant", content: "Falha de conexão. Tente novamente." }]);
    } finally { setLoading(false); }
  };

  return (
    <Card className="flex flex-col h-[70vh] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 md:px-6 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-accent/40 hover:bg-accent text-foreground/80 transition-colors flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-4 border-t border-border flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte algo sobre sua estratégia..." disabled={loading} />
        <Button type="submit" disabled={loading || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
      </form>
    </Card>
  );
}
