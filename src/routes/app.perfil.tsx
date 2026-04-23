import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/perfil")({ component: PerfilPage });

type ProfileData = Record<string, string | number | boolean | null | undefined>;

// IMPORTANT: Section/Field/Select are defined OUTSIDE the component
// to prevent React from remounting them on every keystroke (which kills focus).
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-semibold text-lg">{title}</h2>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </Card>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, full,
}: {
  label: string;
  value: string | number | undefined | null;
  onChange: (v: string | number | null) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="mb-1.5 block">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) =>
          onChange(type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)
        }
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, opts,
}: {
  label: string;
  value: string | undefined | null;
  onChange: (v: string | null) => void;
  opts: [string, string][];
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <select
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">—</option>
        {opts.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

function PerfilPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [data, setData] = useState<ProfileData>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setData(data as ProfileData);
    });
  }, [user]);

  const set = <K extends string>(k: K, v: string | number | boolean | null) =>
    setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: data.full_name as string,
      age: data.age as number | null,
      country: data.country as string | null,
      city: data.city as string | null,
      about: data.about as string | null,
      education_level: data.education_level as string | null,
      english_level: data.english_level as string | null,
      monthly_income: data.monthly_income as number | null,
      monthly_expenses: data.monthly_expenses as number | null,
      current_savings: data.current_savings as number | null,
      budget_goal: data.budget_goal as number | null,
      target_country: data.target_country as string | null,
      main_goal: data.main_goal as string | null,
      has_passport: data.has_passport === "true" || data.has_passport === true,
      has_transcript: data.has_transcript === "true" || data.has_transcript === true,
      willingness: data.willingness as string | null,
      daily_time: data.daily_time as string | null,
      commitment_level: data.commitment_level as string | null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Perfil atualizado"); refreshProfile(); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter menos de 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Erro ao enviar imagem"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setUploading(false);
    if (updErr) { toast.error("Erro ao salvar avatar"); return; }
    setData((d) => ({ ...d, avatar_url: url }));
    toast.success("Foto atualizada");
    refreshProfile();
  };

  const initials = (profile?.full_name || profile?.username || "U")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Perfil</h1>
          <p className="text-muted-foreground mt-1">Base de decisão da IA — quanto mais completo, melhor</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-primary">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Avatar */}
      <Card className="p-6 flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={(data.avatar_url as string) || profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-smooth"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{profile?.full_name}</h3>
          <p className="text-sm text-muted-foreground">@{profile?.username}</p>
          <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP — máx 5MB</p>
        </div>
      </Card>

      <Section title="Dados Pessoais">
        <Field label="Nome completo" value={data.full_name as string} onChange={(v) => set("full_name", v)} />
        <Field label="Idade" value={data.age as number} onChange={(v) => set("age", v)} type="number" />
        <Field label="País" value={data.country as string} onChange={(v) => set("country", v)} placeholder="Brasil" />
        <Field label="Cidade" value={data.city as string} onChange={(v) => set("city", v)} />
        <div className="md:col-span-2">
          <Label className="mb-1.5 block">Sobre mim</Label>
          <Textarea
            value={(data.about as string) ?? ""}
            onChange={(e) => set("about", e.target.value)}
            placeholder="Rotina, motivação, objetivos, por que quer intercâmbio..."
            rows={4}
          />
        </div>
      </Section>

      <Section title="Acadêmico">
        <SelectField label="Escolaridade" value={data.education_level as string} onChange={(v) => set("education_level", v)} opts={[
          ["highschool_in_progress", "Ensino médio em andamento"],
          ["highschool_done", "Ensino médio concluído"],
          ["college_in_progress", "Faculdade em andamento"],
          ["college_done", "Faculdade concluída"],
        ]} />
        <SelectField label="Nível de inglês (CEFR)" value={data.english_level as string} onChange={(v) => set("english_level", v)} opts={[
          ["A1", "A1"], ["A2", "A2"], ["B1", "B1"], ["B2", "B2"], ["C1", "C1"], ["C2", "C2"],
        ]} />
      </Section>

      <Section title="Financeiro (USD ou BRL)">
        <Field label="Renda mensal" value={data.monthly_income as number} onChange={(v) => set("monthly_income", v)} type="number" />
        <Field label="Gastos mensais" value={data.monthly_expenses as number} onChange={(v) => set("monthly_expenses", v)} type="number" />
        <Field label="Reservas atuais" value={data.current_savings as number} onChange={(v) => set("current_savings", v)} type="number" />
        <Field label="Meta total para o intercâmbio" value={data.budget_goal as number} onChange={(v) => set("budget_goal", v)} type="number" />
      </Section>

      <Section title="Objetivo de Intercâmbio">
        <SelectField label="País alvo" value={data.target_country as string} onChange={(v) => set("target_country", v)} opts={[
          ["USA", "EUA"], ["CANADA", "Canadá"], ["BOTH", "Ambos"],
        ]} />
        <SelectField label="Objetivo principal" value={data.main_goal as string} onChange={(v) => set("main_goal", v)} opts={[
          ["sport", "Esporte"], ["study", "Estudo"], ["hybrid", "Híbrido"],
        ]} />
      </Section>

      <Section title="Documentos">
        <SelectField label="Passaporte" value={String(data.has_passport ?? "")} onChange={(v) => set("has_passport", v)} opts={[["true", "Sim"], ["false", "Não"]]} />
        <SelectField label="Histórico escolar" value={String(data.has_transcript ?? "")} onChange={(v) => set("has_transcript", v)} opts={[["true", "Sim"], ["false", "Não"]]} />
      </Section>

      <Section title="Comportamento de Execução">
        <SelectField label="Disposição para morar fora" value={data.willingness as string} onChange={(v) => set("willingness", v)} opts={[
          ["full", "Sim, totalmente"], ["maybe", "Talvez"], ["unsure", "Não tenho certeza"],
        ]} />
        <SelectField label="Tempo disponível por dia" value={data.daily_time as string} onChange={(v) => set("daily_time", v)} opts={[
          ["<1", "Menos de 1h"], ["1-2", "1–2h"], ["2-4", "2–4h"], ["4+", "4h+"],
        ]} />
        <SelectField label="Nível de comprometimento" value={data.commitment_level as string} onChange={(v) => set("commitment_level", v)} opts={[
          ["low", "Baixo (explorando)"], ["medium", "Médio (planejando)"],
          ["high", "Alto (executando)"], ["total", "Total (foco completo)"],
        ]} />
      </Section>
    </div>
  );
}
