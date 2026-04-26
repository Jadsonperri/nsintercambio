
# Roadmap NEXT SCHOOL — Otimizado para 5 créditos/dia

Cada item abaixo = **1 mensagem de build**. Ordem prioriza: desbloquear IA → dados reais → módulos vazios → polimento.

**Estimativa total:** ~10 entregas → **2 dias** se usar os 5 créditos diários, ou ~3-4 dias com folga.

> Lembrete: build mode tem custo variável. Os números abaixo são metas de escopo, não garantia exata.

---

## DIA 1 (5 entregas — desbloquear IA + dados)

### Entrega 1 — Popular base de universidades (~1 créd)
- Importar dataset real de **1.000+ universidades** EUA + Canadá via SQL migration
- Campos: nome, cidade, estado/província, tipo, natureza, divisão esportiva, custo estimado, bolsa, chance, lat/long
- Fonte: dataset público (IPEDS/NCAA + Universities Canada)
- **Desbloqueia:** Faculdades, Mapa, Dashboard rankings, IA

### Entrega 2 — Score & Simulação (Estratégia & IA, sub-aba 2) (~1 créd)
- Implementar lógica 0–100 com pesos (Financeiro 30/Inglês 25/Docs 15/Progresso 15/Acadêmico 10/Tempo 5/Esporte 0–10)
- Inputs com sliders/selects, recálculo em tempo real
- Resultado visual com faixas 🔴🟡🟢🔥 + pontos fortes/fracos
- Salvar última simulação em tabela `scores` (criar)
- **Desbloqueia:** Direção, Dashboard insights, Readiness

### Entrega 3 — Chat IA + Modos (sub-aba 1) (~1 créd)
- Edge function `chat-ia` usando Lovable AI (gemini-2.5-flash)
- Lê perfil + pipeline + financeiro do user_id
- 4 modos: Estratégico/Rápido/Mentor/Crítico (system prompts diferentes)
- Estado vazio: "Complete seu perfil"
- **Desbloqueia:** Direção, Análise, Comparador (reutiliza edge fn)

### Entrega 4 — Direção Estratégica + Plano de Ação IA (sub-abas 3 e 6) (~1 créd)
- Visão executiva consolidada (situação/bloqueio/oportunidade/prontidão)
- Alerta global automático (inconsistências)
- Plano de Ação gerado pela IA (passos priorizados)
- Detector de Erro Estratégico
- **Desbloqueia:** Dashboard "Painel de Decisão Final"

### Entrega 5 — Dashboard completo (~1 créd)
- Mapa EUA+Canadá (react-simple-maps ou leaflet leve) com pontos
- Card "Foco Global" + "Painel de Decisão Final" + "Próximo Passo Único"
- Resumo pipeline por status + atividade recente
- Insights IA integrados (consome edge fn da entrega 3)

---

## DIA 2 (5 entregas — módulos vazios + polimento)

### Entrega 6 — Início (/home) completo (~1 créd)
- Hero dinâmico (incompleto vs completo)
- Foco mensal editável + saúde do plano + alertas (max 3)
- Timeline de prazos + próximo passo IA
- Notícias dinâmicas (feed simples)

### Entrega 7 — Conexão (/communication) completo (~1 créd)
- UI sobre `emails_log`: rascunhos/enviados/falhou/respondido
- Lista de contatos universitários com status de relacionamento
- Follow-up inteligente + sugestões IA
- Sincroniza com Pipeline

### Entrega 8 — Comunidade — comentários/amizades/mensagens (~1 créd)
- UI de comentários no feed (tabela já existe)
- Adicionar amigo por username + lista
- Chat 1:1 realtime (Supabase Realtime sobre `messages`)
- Upload avatar funcional

### Entrega 9 — Financeiro completo + Perfil avançado (~1 créd)
- Fluxo de caixa + projeção + simulador de cenários
- Score financeiro 0–100 + alertas + custo de vida por estado
- Perfil: Sistema de Evolução (Nível 1–4), Resumo IA, Readiness Score automático

### Entrega 10 — Pipeline: Planos de Ação + Faculdades polish (~1 créd)
- Sub-módulo Planos de Ação com 6 sub-abas (Metas/Estudos/Docs/Certificados/Provas/Financeiras) sobre tabela `goals`
- Faculdades: filtros pill/chip horizontais, filtro Estado/Província inteligente
- Resumo IA por card do Kanban

---

## Como executar

A cada dia, me mande simplesmente: **"executar entrega N"** e eu implemento aquele bloco. Se o crédito do dia sobrar, seguimos para a próxima.

## Riscos / pontos de atenção

- **Entrega 1** depende de dataset bom — uso fontes públicas (IPEDS para EUA, Universities Canada). Se não bater 1.000+, completo com fonte secundária.
- **Mapa (entrega 5)** pode pesar; usarei lib leve (react-simple-maps) com geojson estático.
- **Edge functions de IA** consomem créditos do **balance Cloud/AI** (separado dos créditos de chat) — você tem $1 grátis/mês.

Pronto para começar pela Entrega 1?
