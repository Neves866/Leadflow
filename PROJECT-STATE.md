# LeadFlow Project State

## Objetivo
SaaS de captação e gerenciamento de leads para demonstração visual e navegável.

## Stack
- Next.js API via vinext
- TypeScript
- App Router
- React
- CSS Modules
- Cloudflare Workers
- Vite
- Wrangler

## Estrutura
- `app/`: Código fonte da aplicação.
- `app/painel/`: Dashboard e gestão interna.
- `app/painel/leads/`: Listagem e detalhes de leads.

## Rotas
- `/`: Página inicial (não detalhada ainda).
- `/painel`: Visão geral do dashboard.
- `/painel/leads`: Listagem de leads.

## Concluído
- Estrutura básica do `/painel`.
- Layout com sidebar básica.
- Listagem simplificada de leads em `/painel/leads`.
- Dashboard com KPIs e pipeline básicos.

## Dados mockados
- Atualmente hardcoded nos arquivos `app/painel/page.tsx` e `app/painel/leads/page.tsx`.

## localStorage
- Não implementado ainda.

## Componentes
- Ainda não há componentes reutilizáveis extraídos.

## CSS
- `app/painel/painel.module.css`: Estilos do dashboard.
- `app/painel/layout.module.css`: Estilos do layout/sidebar.
- `app/painel/leads/leads.module.css`: Estilos da listagem de leads.

## Decisões técnicas
- Utilização de CSS Modules para estilização.
- Mocks iniciais hardcoded para agilidade.

## Arquivos alterados
- Nenhum ainda por este agente.

## Pendências
- [ ] Refinar Dashboard (`/painel`) com KPIs completos e design profissional.
- [ ] Implementar 12-15 leads coerentes em `/painel/leads`.
- [ ] Criar página de detalhes do lead `/painel/leads/[id]`.
- [ ] Criar formulário público multi-etapa `/formulario/demo`.
- [ ] Criar página de sucesso `/sucesso`.
- [ ] Simular fluxo Formulário -> localStorage -> Listagem de Leads.
- [ ] Criar páginas demonstrativas: `/painel/formularios`, `/painel/clientes`, `/painel/configuracoes`.
- [ ] Refinar sidebar com indicação de item ativo.
- [ ] Garantir `npm run build` sem erros.

## Próxima tarefa
Refinar o dashboard em `/painel` para ter aparência de SaaS profissional e KPIs solicitados.

## Problemas conhecidos
- Sem persistência de dados (estão hardcoded).
