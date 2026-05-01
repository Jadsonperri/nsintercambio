import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  profile: z.object({
    fullName: z.string().optional(),
    sport: z.string().optional(),
    position: z.string().optional(),
    gpa: z.number().optional(),
    sat: z.number().optional(),
    toefl: z.number().optional(),
    budgetMaxUsd: z.number().optional(),
  }).partial(),
  universities: z.array(z.object({
    id: z.string(),
    name: z.string(),
    state: z.string(),
    country: z.string(),
    division: z.string().nullable().optional(),
    estimated_cost_usd: z.number().nullable().optional(),
    scholarship_available: z.boolean().optional(),
    acceptance_chance: z.string().nullable().optional(),
  })).max(400),
});

export const recommendUniversities = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { recommendations: [] as Array<{ id: string; reason: string }>, error: "AI not configured" };
    }

    // Compact list to keep prompt small
    const list = data.universities.slice(0, 250).map(u =>
      `${u.id}|${u.name}|${u.state}|${u.country}|${u.division ?? "-"}|${u.estimated_cost_usd ?? "-"}|${u.scholarship_available ? "BOLSA" : "-"}|${u.acceptance_chance ?? "-"}`
    ).join("\n");

    const profileLine = JSON.stringify(data.profile);

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Você é um consultor de intercâmbio acadêmico-esportivo. Recomenda 5 universidades para o estudante baseado no perfil e na lista. Retorne APENAS via tool call.",
            },
            {
              role: "user",
              content: `Perfil:\n${profileLine}\n\nLista (id|nome|estado|país|divisão|custo|bolsa|chance):\n${list}\n\nEscolha as 5 melhores. Considere fit, custo e chance.`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "recommend",
              description: "Retorna 5 universidades recomendadas",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        reason: { type: "string", description: "1 frase em PT-BR explicando o porquê" },
                      },
                      required: ["id", "reason"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 5,
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "recommend" } },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("AI gateway error:", res.status, txt);
        return { recommendations: [], error: res.status === 429 ? "Limite de uso, tente novamente em alguns minutos." : res.status === 402 ? "Créditos esgotados." : "Erro na IA" };
      }

      const json = await res.json();
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return { recommendations: [], error: "Resposta inválida da IA" };
      const parsed = JSON.parse(args) as { recommendations: Array<{ id: string; reason: string }> };
      return { recommendations: parsed.recommendations.slice(0, 5), error: null };
    } catch (e) {
      console.error("recommend error:", e);
      return { recommendations: [], error: e instanceof Error ? e.message : "Erro desconhecido" };
    }
  });
