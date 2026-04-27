# Seed massivo de universidades — IPEDS + Canadá (~6.300 instituições)

## Objetivo

Popular `public.universities` com ~6.300 instituições reais (EUA + Canadá) a partir de fontes oficiais, mantendo o schema atual (zero refactor de UI).

## Fontes

- **EUA**: IPEDS HD (Higher Education Directory) do NCES — CSV oficial com ~6.000 instituições Title IV. Campos: UNITID, INSTNM, CITY, STABBR, LATITUDE, LONGITUD, CONTROL (1=público, 2=privado nonprofit, 3=privado for-profit), ICLEVEL (1=4 anos, 2=2 anos, 3=<2 anos), WEBADDR.
- **Canadá**: Universities Canada (96 públicas) + Colleges and Institutes Canada (~150 colleges) + lista de privadas reconhecidas. Fonte: scraping das páginas oficiais (ou CSV agregado público se disponível).

## Mapeamento para o schema atual

Sem mudar nenhuma coluna. Mapeamento determinístico:

| Coluna do banco | Origem |
|---|---|
| `name` | INSTNM (IPEDS) / nome oficial (CA) |
| `country` | `"USA"` ou `"CANADA"` |
| `state` | STABBR (EUA, sigla 2 letras) / sigla província (CA) |
| `city` | CITY |
| `type` | ICLEVEL: 1→`university` se 4 anos, 2→`community_college`, 3→`college`. Heurística adicional: nome contendo "Community College" → `community_college`; "College" sem "University" → `college`. |
| `nature` | CONTROL: 1→`public`, 2/3→`private` |
| `division` | NULL por padrão. Cruzar com lista NCAA D1/D2/D3 + NAIA + NJCAA por nome (matching fuzzy). Canadá: U_SPORTS para universities, NULL para colleges. |
| `estimated_cost_usd` | Heurística por (country, type, nature): community público $10k, college público $20k, university pública $28k, college privada $35k, university privada $50k. Canadá: ~$25k university, $18k college. |
| `scholarship_available` | true se division ≠ NULL ou nature=`public`; false caso contrário |
| `acceptance_chance` | Heurística: community→`high`, college→`medium`, university pública→`medium`, university privada→`low`. Override para Ivy League e top 25 (lista hardcoded ~30 escolas) → `low`. |
| `latitude`, `longitude` | LATITUDE, LONGITUD (IPEDS) / geocoded para Canadá |
| `website` | WEBADDR (prefixar `https://` se faltar) |

## Passos de execução

### 1. Garantir índice único (migração)
```sql
CREATE UNIQUE INDEX IF NOT EXISTS universities_name_country_state_uniq
  ON public.universities (name, country, state);
```

### 2. Baixar e processar dados (script Python local)
- Download IPEDS HD2023.zip via `curl` da NCES
- Parse CSV (encoding latin-1, ~6.000 linhas)
- Filtrar: ICLEVEL ∈ {1,2,3}, sectors válidos, com lat/lng não-nulos
- Para Canadá: fetch lista Universities Canada + CICan. Se scraping falhar, usar dataset curado de ~300 (já tenho ~55 da entrega anterior + expandir manualmente para ~300 a partir de listas públicas).
- Aplicar mapeamento acima
- Carregar lista NCAA/NAIA/NJCAA (CSV público) para popular `division`
- Override Ivy League + top schools manualmente

### 3. Limpar tabela atual e inserir em lotes
```sql
DELETE FROM pipeline_history;
DELETE FROM pipeline;
DELETE FROM favorites;
DELETE FROM universities;
```
Inserir via `psql COPY FROM STDIN` (muito mais rápido que INSERTs individuais para 6.000+ linhas).

### 4. Verificação final
```sql
SELECT country, type, nature, COUNT(*)
FROM universities
GROUP BY 1,2,3 ORDER BY 1,2,3;
```
Esperado: ~6.000 USA distribuídos + ~300 CANADA.

### 5. UI já está pronta
`src/routes/app.faculdades.tsx` já lê todos esses campos. Único ajuste: garantir que a paginação/scroll aguenta 6.000 cards (adicionar virtualização ou limite inicial de 200 com "carregar mais").

## Limitações honestas

- **Custo e chance são heurística**, não dados reais por escola. Para precisão real precisaria do IPEDS IC (Institutional Characteristics) que é outro CSV de ~50MB e levaria mais 1-2 créditos.
- **Divisão esportiva**: matching por nome tem ~10% de erro. Schools sem match ficam NULL.
- **Canadá**: pode não chegar exatamente a 305 — depende do que conseguir extrair das fontes públicas em uma rodada. Garanto pelo menos 200.
- **Lat/lng**: IPEDS tem ~95% de cobertura. Linhas sem coordenada serão inseridas com lat/lng NULL (mapa simplesmente não mostra).

## Risco

Se o download do IPEDS falhar ou mudar de URL, faço fallback para mirror no GitHub (urbaninstitute/education-data) ou College Scorecard API (também oficial, JSON, mesma cobertura).

## Custo estimado

1–2 créditos. Tudo em uma única entrega.
