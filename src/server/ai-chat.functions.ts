import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(30),
});

export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { reply: "IA não configurada (LOVABLE_API_KEY ausente).", error: true };

    const { supabase, userId } = context as { supabase: any; userId: string };

    // Carrega contexto real do usuário
    const [profileRes, finRes, pipelineRes, deadlinesRes] = await Promise.all([
      supabase.from("profiles").select("full_name, age, english_level, ielts_score, toefl_score, main_goal, target_country, education_level, monthly_focus").eq("id", userId).maybeSingle(),
      supabase.from("financial_data").select("monthly_income, monthly_expenses, current_savings, budget_goal, currency").eq("user_id", userId).maybeSingle(),
      supabase.from("pipeline").select("status, university_id, universities(name, country, estimated_cost_usd, acceptance_chance)").eq("user_id", userId).limit(50),
      supabase.from("deadlines").select("title, date").eq("user_id", userId).gte("date", new Date().toISOString().slice(0, 10)).order("date").limit(10),
    ]);

    const ctx = {
      perfil: profileRes.data || {},
      financeiro: finRes.data || {},
      pipeline: pipelineRes.data || [],
      prazos_proximos: deadlinesRes.data || [],
    };

    const systemPrompt = `Você é a IA mentora de intercâmbio do NEXT SCHOOL. Responda em PT-BR, direta e prática (no máximo 4 parágrafos). Use os dados reais do usuário para dar respostas personalizadas. Se faltar dado, peça ao usuário para preencher na aba correspondente (Perfil, Financeiro, CRM).

CONTEXTO REAL DO USUÁRIO:
${JSON.stringify(ctx, null, 2)}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...data.messages],
        }),
      });
      if (res.status === 429) return { reply: "Muitas requisições. Tente novamente em alguns segundos.", error: true };
      if (res.status === 402) return { reply: "Créditos de IA esgotados. Adicione fundos na workspace.", error: true };
      if (!res.ok) return { reply: "Erro na IA. Tente novamente.", error: true };
      const json = await res.json();
      const reply = json.choices?.[0]?.message?.content ?? "Sem resposta.";
      return { reply, error: false };
    } catch (e) {
      return { reply: "Falha de rede ao consultar IA.", error: true };
    }
  });
