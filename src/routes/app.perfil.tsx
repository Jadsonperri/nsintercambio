import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/app/perfil")({ component: PerfilPage });

function PerfilPage() {
  const { user, refreshProfile } = useAuth();
  const [data, setData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setData(data);
    });
  }, [user]);

  const set = (k: string, v: unknown) => setData(d => ({ ...d, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: data.full_name, age: data.age, country: data.country, city: data.city, about: data.about,
      education_level: data.education_level, english_level: data.english_level,
      monthly_income: data.monthly_income, monthly_expenses: data.monthly_expenses,
      current_savings: data.current_savings, budget_goal: data.budget_goal,
      target_country: data.target_country, main_goal: data.main_goal,
      has_passport: data.has_passport, has_transcript: data.has_transcript,
      willingness: data.willingness, daily_time: data.daily_time, commitment_level: data.commitment_level,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Perfil atualizado"); refreshProfile(); }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="p-6 space-y-4">
      <h2 className="font-semibold text-lg">{title}</h2>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </Card>
  );

  const Field = ({ label, k, type = "text", placeholder }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <Label>{label}</Label>
      <Input
        type={type} placeholder={placeholder}
        value={(data[k] as string | number | undefined) ?? ""}
        onChange={(e) => set(k, type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
      />
    </div>
  );

  const Select = ({ label, k, opts }: { label: string; k: string; opts: [string, string][] }) => (
    <div>
      <Label>{label}</Label>
      <select
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        value={(data[k] as string | undefined) ?? ""}
        onChange={(e) => set(k, e.target.value || null)}
      >
        <option value="">—</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil</h1>
          <p className="text-muted-foreground mt-1">Base de decisão da IA — quanto mais completo, melhor</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-primary">{saving ? "Salvando..." : "Salvar"}</Button>
      </div>

      <Section title="Dados Pessoais">
        <Field label="Nome completo" k="full_name" />
        <Field label="Idade" k="age" type="number" />
        <Field label="País" k="country" placeholder="Brasil" />
        <Field label="Cidade" k="city" />
        <div className="md:col-span-2">
          <Label>Sobre mim</Label>
          <Textarea value={(data.about as string) ?? ""} onChange={(e) => set("about", e.target.value)} placeholder="Rotina, motivação, objetivos, por que quer intercâmbio..." rows={4} />
        </div>
      </Section>

      <Section title="Acadêmico">
        <Select label="Escolaridade" k="education_level" opts={[
          ["highschool_in_progress", "Ensino médio em andamento"],
          ["highschool_done", "Ensino médio concluído"],
          ["college_in_progress", "Faculdade em andamento"],
          ["college_done", "Faculdade concluída"],
        ]} />
        <Select label="Nível de inglês (CEFR)" k="english_level" opts={[
          ["A1", "A1"], ["A2", "A2"], ["B1", "B1"], ["B2", "B2"], ["C1", "C1"], ["C2", "C2"],
        ]} />
      </Section>

      <Section title="Financeiro (USD ou BRL)">
        <Field label="Renda mensal" k="monthly_income" type="number" />
        <Field label="Gastos mensais" k="monthly_expenses" type="number" />
        <Field label="Reservas atuais" k="current_savings" type="number" />
        <Field label="Meta total para o intercâmbio" k="budget_goal" type="number" />
      </Section>

      <Section title="Objetivo de Intercâmbio">
        <Select label="País alvo" k="target_country" opts={[
          ["USA", "EUA"], ["CANADA", "Canadá"], ["BOTH", "Ambos"],
        ]} />
        <Select label="Objetivo principal" k="main_goal" opts={[
          ["sport", "Esporte"], ["study", "Estudo"], ["hybrid", "Híbrido"],
        ]} />
      </Section>

      <Section title="Documentos">
        <Select label="Passaporte" k="has_passport" opts={[["true", "Sim"], ["false", "Não"]]} />
        <Select label="Histórico escolar" k="has_transcript" opts={[["true", "Sim"], ["false", "Não"]]} />
      </Section>

      <Section title="Comportamento de Execução">
        <Select label="Disposição para morar fora" k="willingness" opts={[
          ["full", "Sim, totalmente"], ["maybe", "Talvez"], ["unsure", "Não tenho certeza"],
        ]} />
        <Select label="Tempo disponível por dia" k="daily_time" opts={[
          ["<1", "Menos de 1h"], ["1-2", "1–2h"], ["2-4", "2–4h"], ["4+", "4h+"],
        ]} />
        <Select label="Nível de comprometimento" k="commitment_level" opts={[
          ["low", "Baixo (explorando)"], ["medium", "Médio (planejando)"],
          ["high", "Alto (executando)"], ["total", "Total (foco completo)"],
        ]} />
      </Section>
    </div>
  );
}
