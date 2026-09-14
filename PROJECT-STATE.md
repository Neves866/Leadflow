# LeadFlow Project State

## Estratégia
**Iluminar Production First.**
- Iluminar será a primeira e única organização durante o MVP real.
- A arquitetura continuará preparada para múltiplas organizações (configs por organização, rotas por slug, IDs estáveis — nada de lógica de cliente no código genérico).
- Próxima grande fase: **Supabase + Auth + persistência real** (ainda não implementado — sem banco, sem auth, sem segundo cliente por ora).

## Objetivo
Colocar a Iluminar em produção: fluxo real de captação de leads via `/f/iluminar-orcamento` + painel, com persistência simulada em localStorage até a fase Supabase.

## Stack
- vinext (Next.js style on Cloudflare Workers)
- TypeScript
- App Router
- React (Client/Server Components)
- CSS Modules
- localStorage (simulação de persistência, até a integração com Supabase)

## Estado verificado em
2026-09-14 (limpeza arquitetural pré-Supabase)

## Estrutura atual
- `app/`: Diretório principal de rotas.
- `app/f/[slug]/`: Formulário público genérico de produção (resolvido por slug via config).
- `app/formulario/demo/`: Rota legada — apenas redirect temporário para `/f/iluminar-orcamento`.
- `components/forms/FormRenderer.tsx`: Renderer genérico. Não conhece serviços nem IDs específicos (ex.: "ar", "iluminar").
- `components/forms/FormRenderer.module.css`: Estilos do renderer (movidos de `app/formulario/demo/form.module.css`).
- `lib/config/`: Camada de configuração multiempresa (uma organização: Iluminar).
- `app/sucesso/`: Página de confirmação de envio.
- `app/painel/`: Área administrativa (Dashboard, leads, formulários, clientes, configurações).

## Rotas
- `/`: Home (Landing Page LeadFlow).
- `/f/iluminar-orcamento`: Formulário público da Iluminar (rota de produção).
- `/formulario/demo`: Redirect temporário → `/f/iluminar-orcamento` (legado; não usar em código novo).
- `/sucesso`: Confirmação (Client Component). Protocolo consistente e link para o lead recém-criado.
- `/painel`: Dashboard (Client Component). Integra Mocks + localStorage, reflete KPIs e trata Valor Potencial Zero.
- `/painel/leads`: Listagem (Client Component). Integra Mocks + localStorage, possui busca e filtro de status.
- `/painel/leads/[id]`: Detalhes (Client Component). Exibe respostas completas, normaliza WhatsApp (DDI 55) e trata Valor Potencial Zero.
- `/painel/formularios`, `/painel/clientes`, `/painel/configuracoes`: páginas de gestão (demonstrativas).

## Fluxo de produção
`/` → `/f/iluminar-orcamento` → `/sucesso` → `/painel/leads/[id]` → `/painel/leads` → `/painel`

## Configuração (multiempresa-ready)
- `lib/types/config.ts`: tipos (OrganizationConfig, FormConfig, FormFieldConfig, ServiceConfig).
  - `ServiceConfig.servicoTemplate?`: template opcional com placeholders `{fieldId}` para compor a descrição do serviço do lead a partir das respostas — resolve no config o que antes era lógica hardcoded no renderer.
- `lib/config/index.ts`: registro de organizações + `getOrganizationConfig()`, `getFormConfig()`, `getFormConfigBySlug()`. (`getCurrentOrganizationConfig()` foi removida — não era utilizada.)
- `lib/config/organizations/iluminar.ts`: config da Iluminar.
  - Form id estável de produção: `form_iluminar_orcamento` (antes `demo_form`).
  - Slug mantido: `iluminar-orcamento`.
  - Serviço "ar": `servicoTemplate: '{serviceType} ({btus} BTUs)'` — resultado do lead idêntico ao anterior.

## Convenções
- Nenhum código novo deve usar "demo" como identificação do formulário real (a rota `/formulario/demo` permanece só como redirect temporário).
- O FormRenderer não conhece IDs específicos de serviço; descrições compostas vêm de `servicoTemplate` na configuração.

## Dados mockados
- `MOCK_LEADS` em `@/lib/mocks`.

## localStorage
- `leadflow_leads`: Lista de leads criados via formulário (inclui organizationId, formId, formSlug e respostas completas).
- `leadflow_last_protocol`: Último protocolo gerado.
- `leadflow_last_lead_id`: ID do último lead criado para redirecionamento na página de sucesso.
- `leadflow_status_overrides`: Mapeamento de ID -> Status para persistir alterações nos mocks.

## CSS Modules
- `components/forms/FormRenderer.module.css`
- `app/sucesso/sucesso.module.css`
- `app/painel/painel.module.css`
- `app/painel/layout.module.css`
- `app/painel/leads/leads.module.css`
- `app/painel/leads/[id]/details.module.css`
- `app/painel/formularios/formularios.module.css`
- `app/painel/clientes/clientes.module.css`
- `app/painel/configuracoes/configuracoes.module.css`
- `app/page.module.css`

## Concluído
- [x] Fase A: Corrigir client boundaries/hydration.
- [x] Fase A: Fazer /formulario/demo salvar e responder.
- [x] Fase A: Fazer /sucesso funcionar com protocolo consistente.
- [x] Fase A: Fazer /painel/leads ler lead e aplicar overrides.
- [x] Fase A: Fazer /painel/leads/[id] abrir e permitir alteração de status.
- [x] Fase B: Integrar localStorage no Dashboard.
- [x] Fase B: Implementar busca e filtro em /painel/leads.
- [x] Fase B: Implementar navegação "+ Novo Lead" para /formulario/demo.
- [x] Fase B: Resolver botões mortos em /painel/formularios.
- [x] Fase B: Criar página de configurações.
- [x] Fase B: Estilizar página de clientes.
- [x] Fase C: Landing Page LeadFlow em `/`.
- [x] Fase C: Atualizar metadata e lang para pt-BR.
- [x] Fase C: Refinar sidebar com indicação de rota ativa.
- [x] Acabamento Final: Salvar todas as respostas do formulário.
- [x] Acabamento Final: Mostrar respostas completas no detalhe do lead.
- [x] Acabamento Final: Redirecionamento inteligente na página de sucesso.
- [x] Acabamento Final: Tratamento de Valor Potencial Zero ("A definir").
- [x] Acabamento Final: Normalização de WhatsApp (DDI 55).
- [x] Acabamento Final: Sidebar ativa em sub-rotas de leads.
- [x] Acabamento Final: Feedback em botões demonstrativos.
- [x] Design Final: Redesign premium do Dashboard e Sidebar.

## Testes executados
- `npm run build` → PASS (vinext build, todas as rotas compiladas).
- HTTP runtime (preview/wrangler): `/f/iluminar-orcamento` → 200 com categorias e etapa 1 renderizadas; `/formulario/demo` → 307 redirect para `/f/iluminar-orcamento`; `/painel/leads` → 200.
- Equivalência verificada por script: o template `{serviceType} ({btus} BTUs)` produz exatamente o mesmo `servico` do código anterior (inclusive com campos vazios).
- Fluxo completo com criação de lead em navegador (localStorage) segue válido — lógica do renderer preservada sem alteração de comportamento.

## Problemas conhecidos
- Persistência ainda em localStorage (mock) até a fase Supabase.
- Páginas de formulários/clientes/configurações do painel seguem demonstrativas.

## Pendências
- [x] Fase D: Validação final build + dev (Concluída).
- [x] Transformação para SaaS Multiempresa: Etapa 1 - Desacoplamento de Configuração.
- [x] Transformação para SaaS Multiempresa: Etapa 2 - Primeiro Formulário Público Genérico.
- [x] Limpeza arquitetural pré-Supabase: regra de serviço ('ar') removida do FormRenderer (agora `servicoTemplate` na config).
- [x] Limpeza arquitetural pré-Supabase: CSS do renderer movido para `components/forms/FormRenderer.module.css`.
- [x] Limpeza arquitetural pré-Supabase: form id `demo_form` → `form_iluminar_orcamento`.
- [x] Limpeza arquitetural pré-Supabase: remoção de `getCurrentOrganizationConfig()` (não utilizada).
- [x] FASE D1: FUNDAÇÃO DO BANCO DE DADOS (Schema, RLS, Seeds e Documentação).
- [x] FASE D2: Conexão ao Supabase remoto e aplicação de migrations.

## Próxima grande fase
Supabase remoto + Auth + persistência real (Substituição do localStorage).

## Último arquivo em edição
PROJECT-STATE.md
