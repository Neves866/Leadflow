# LeadFlow Project State

## Objetivo
Demonstração visual e navegável de ponta a ponta de um SaaS de captação e gerenciamento de leads. Foco absoluto em runtime/interatividade no navegador para apresentação.

## Stack
- vinext (Next.js style on Cloudflare Workers)
- TypeScript
- App Router
- React (Client/Server Components)
- CSS Modules
- localStorage (simulação de persistência)

## Estado verificado em
2026-09-01 / 12:45 (approx)

## Estrutura atual
- `app/`: Diretório principal de rotas.
- `app/formulario/demo/`: Fluxo de captação de leads.
- `app/sucesso/`: Página de confirmação de envio.
- `app/painel/`: Área administrativa (Dashboard).
- `app/painel/leads/`: Gestão de leads (listagem e detalhes).
- `app/painel/formularios/`: Gestão de formulários.
- `app/painel/clientes/`: Gestão de contas.
- `app/painel/configuracoes/`: Página de configurações.

## Rotas
- `/`: Home (Landing Page LeadFlow).
- `/formulario/demo`: Formulário multi-etapa (Client Component). Salva respostas completas e ID do lead.
- `/sucesso`: Confirmação (Client Component). Protocolo consistente e link para o lead recém-criado.
- `/painel`: Dashboard (Client Component). Integra Mocks + localStorage, reflete KPIs e trata Valor Potencial Zero.
- `/painel/leads`: Listagem (Client Component). Integra Mocks + localStorage, possui busca e filtro de status.
- `/painel/leads/[id]`: Detalhes (Client Component). Exibe respostas completas, normaliza WhatsApp (DDI 55) e trata Valor Potencial Zero.
- `/painel/formularios`: Gestão de formulários (Client Component). Botões funcionais com feedbacks.
- `/painel/clientes`: Gestão de clientes (Client Component). Estilização profissional e botões com feedback.
- `/painel/configuracoes`: Página de configurações (Client Component). Interface visual completa.

## Fluxo da demo
`/` → `/formulario/demo` → `/sucesso` → `/painel/leads/[id]` → `/painel/leads` → `/painel`

## Dados mockados
- `MOCK_LEADS` em `@/lib/mocks`.

## localStorage
- `leadflow_leads`: Lista de leads criados via formulário.
- `leadflow_last_protocol`: Último protocolo gerado.
- `leadflow_last_lead_id`: ID do último lead criado para redirecionamento na página de sucesso.
- `leadflow_status_overrides`: Mapeamento de ID -> Status para persistir alterações nos mocks.

## Componentes / páginas importantes
- `app/formulario/demo/page.tsx`: Lógica de etapas e persistência de respostas.
- `app/painel/leads/page.tsx`: Agregador de mocks + localStorage.
- `app/painel/layout.tsx`: Sidebar de navegação com destaque de rota ativa (inclusive em sub-rotas).

## CSS Modules
- `app/formulario/demo/form.module.css`
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
- `npm run build` → PASS
- Runtime Browser → Validado fluxo completo: Home -> Formulário -> Sucesso -> Lead Detalhes (com respostas) -> WhatsApp -> Status -> Dashboard.

## Problemas conhecidos
- Nenhum crítico para a demo.

## Pendências
- [ ] Fase D: Validação final build + dev (Concluída).

## Próxima tarefa EXATA
Apresentação do produto.

## Último arquivo em edição
PROJECT-STATE.md
